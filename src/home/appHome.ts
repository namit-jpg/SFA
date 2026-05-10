import { App } from '@slack/bolt';
import {
  getSFUserByEmail,
  getSFAUserByEmail,
  getSFAUserByUserId,
  getManagerStatus,
  getDailyVisits,
  getActiveVisit,
  getTeamVisits,
  getStoresByIds,
  VisitRecord,
} from '../salesforce/soql';
import { buildRepHomeView } from './views/repHome';
import { buildManagerHomeView } from './views/managerHome';
import * as B from '../utils/blocks';

const sfUserCache = new Map<string, { sfUserId: string; sfaUser: any; sfUserRecordId: string; isManager: boolean; slackUserId: string }>();

export async function resolveUser(slackUserId: string, client: any): Promise<{
  sfUserId: string;
  sfaUser: any;
  sfUserRecordId: string;
  isManager: boolean;
} | null> {
  if (sfUserCache.has(slackUserId)) {
    return sfUserCache.get(slackUserId)!;
  }

  const slackUser = await client.users.info({ user: slackUserId });
  const email = slackUser.user?.profile?.email;
  if (!email) return null;

  const sfaUser = await getSFAUserByEmail(email);

  if (sfaUser) {
    const sfUser = await getSFUserByEmail(email);
    const isManager = sfUser ? !!sfUser.UserRoleId : false;
    const result = { sfUserId: sfaUser.Id, sfaUser, sfUserRecordId: sfUser?.Id || '', isManager, slackUserId };
    sfUserCache.set(slackUserId, result);
    return result;
  }

  const sfUser = await getSFUserByEmail(email);
  if (!sfUser) return null;

  const sfaUserByUserId = await getSFAUserByUserId(sfUser.Id);
  if (sfaUserByUserId) {
    const isManager = !!sfUser.UserRoleId;
    const result = { sfUserId: sfaUserByUserId.Id, sfaUser: sfaUserByUserId, sfUserRecordId: sfUser.Id, isManager, slackUserId };
    sfUserCache.set(slackUserId, result);
    return result;
  }

  const isManager = !!sfUser.UserRoleId;
  const result = { sfUserId: sfUser.Id, sfaUser: null, sfUserRecordId: sfUser.Id, isManager, slackUserId };
  sfUserCache.set(slackUserId, result);
  return result;
}

export function clearUserCache(slackUserId: string) {
  sfUserCache.delete(slackUserId);
}

export function getCachedUser(slackUserId: string) {
  return sfUserCache.get(slackUserId);
}

async function collectStoreIds(...visits: (VisitRecord | null)[]): Promise<string[]> {
  const ids = new Set<string>();
  for (const v of visits) {
    if (v?.Retail_Store_Custom__c) ids.add(v.Retail_Store_Custom__c);
  }
  return [...ids];
}

export async function publishHomeView(app: App, slackUserId: string, client: any) {
  const userCtx = await resolveUser(slackUserId, client);

  if (!userCtx) {
    await client.views.publish({
      user_id: slackUserId,
      view: {
        type: 'home',
        blocks: [B.section(':warning: *Unable to link your Slack account to Salesforce.* Check your email matches.')],
      },
    });
    return;
  }

  const { sfaUser, isManager } = userCtx;
  const sfUserName = sfaUser?.Name || 'User';
  const today = B.todayDateString();

  if (isManager) {
    const teamVisits = await getTeamVisits(userCtx.sfUserId, today);
    const storeIds = teamVisits.map((v: any) => v.Retail_Store_Custom__c).filter(Boolean);
    const storeMap = await getStoresByIds(storeIds);
    const totalOrders = teamVisits.reduce((sum, v: any) => sum + (v.Order_Value__c || 0), 0);
    const view = buildManagerHomeView(sfUserName, teamVisits, totalOrders, storeMap);
    await client.views.publish({ user_id: slackUserId, view });
  } else {
    const dailyVisits = await getDailyVisits(userCtx.sfUserId, today);
    const activeVisit = await getActiveVisit(userCtx.sfUserId);
    const storeIds = await collectStoreIds(activeVisit, ...dailyVisits);
    const storeMap = await getStoresByIds(storeIds);

    const weekVisits = await getDailyVisits(userCtx.sfUserId, 'THIS_WEEK');
    const completed = weekVisits.filter((v: any) => v.Status__c === 'Completed').length;
    const total = weekVisits.length;

    const view = buildRepHomeView(sfUserName, activeVisit, dailyVisits, { completed, total }, storeMap);
    await client.views.publish({ user_id: slackUserId, view });
  }
}

export function registerAppHome(app: App) {
  app.event('app_home_opened', async ({ event, client }) => {
    await publishHomeView(app, event.user, client);
  });

  app.action('sfa_refresh_home', async ({ ack, body, client }) => {
    await ack();
    const slackUserId = (body as any).user.id;
    clearUserCache(slackUserId);
    await publishHomeView(app, slackUserId, client);
  });
}
