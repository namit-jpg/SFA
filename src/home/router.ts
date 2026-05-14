import { App } from '@slack/bolt';
import { buildHomeView } from './views/homeView';
import { buildVisitsView } from './views/visitsView';
import { buildVisitDetailsView } from './views/visitDetailsView';
import { buildVisitInsightsView } from './views/visitInsightsView';
import { buildOrdersView } from './views/ordersView';
import { buildAccountsView } from './views/accountsView';
import { buildProfileView } from './views/profileView';
import {
  getDailyVisits, getActiveVisit, getVisitInsights, getTodayAttendance,
  getStoresByIds, getVisitById, getStoreVisitHistory, getStoreOrders,
  getFrequentlyBoughtProducts, getAccountContact, getLastOrderSummary,
  getStoreVisitLogs, getAllStores, getVisitSurveyResponses,
} from '../salesforce/soql';
import * as B from '../utils/blocks';

type Page = 'home' | 'visits' | 'visit_details' | 'visit_insights' | 'orders' | 'accounts' | 'profile';

interface AppState {
  page: Page;
  selectedVisitId?: string;
  visitFilter: 'today' | 'all';
}

const state = new Map<string, AppState>();

function getState(slackUserId: string): AppState {
  const s = state.get(slackUserId);
  if (!s) { const d: AppState = { page: 'home', visitFilter: 'today' }; state.set(slackUserId, d); return d; }
  return s;
}

export function setState(slackUserId: string, update: Partial<AppState>) {
  const s = getState(slackUserId);
  const merged = { ...s, ...update };
  state.set(slackUserId, merged);
}

export function clearState(slackUserId: string) {
  state.delete(slackUserId);
}

function navBar(currentPage: Page): any {
  const pages: { id: string; label: string; emoji: string; page: Page }[] = [
    { id: 'sfa_nav_home', label: 'Home', emoji: ':house:', page: 'home' },
    { id: 'sfa_nav_visits', label: 'Visits', emoji: ':calendar:', page: 'visits' },
    { id: 'sfa_nav_orders', label: 'Orders', emoji: ':package:', page: 'orders' },
  ];
  const actions = pages.map(p =>
    B.button(`${p.emoji} ${p.label}`, p.id, undefined, currentPage === p.page ? 'primary' : undefined)
  );
  // Add Create Visit + Onboarding
  actions.push(B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined));
  actions.push(B.button(':new: Onboarding', 'sfa_open_onboarding', undefined));
  actions.push(B.button(':bust_in_silhouette: Profile', 'sfa_nav_profile', undefined, currentPage === 'profile' ? 'primary' : undefined));
  return B.actions(...actions);
}

export async function publishView(app: App, slackUserId: string, client: any, userCtx: any) {
  const s = getState(slackUserId);
  const blocks: any[] = [];

  try {
    switch (s.page) {
      case 'home': {
        const today = B.todayDateString();
        const [dailyVisits, insights, attendance] = await Promise.all([
          getDailyVisits(userCtx.sfUserId, today),
          getVisitInsights(userCtx.sfUserId),
          getTodayAttendance(userCtx.sfUserId, today),
        ]);
        const weekVisits = await getDailyVisits(userCtx.sfUserId, 'THIS_WEEK');
        const completed = weekVisits.filter((v: any) => v.Status__c === 'Completed').length;
        blocks.push(...buildHomeView(userCtx.sfaUser?.Name || 'User', dailyVisits, insights, completed, weekVisits.length, !!attendance));
        break;
      }
      case 'visits': {
        const today = B.todayDateString();
        const dailyVisits = await getDailyVisits(userCtx.sfUserId, today);
        const allVisits = s.visitFilter === 'all' ? await getDailyVisits(userCtx.sfUserId, 'LAST_MONTH') : [];
        const visits = s.visitFilter === 'all' ? allVisits : dailyVisits;
        const storeIds = visits.map((v: any) => v.Retail_Store_Custom__c).filter(Boolean);
        const storeMap = await getStoresByIds(storeIds);
        const activeVisit = await getActiveVisit(userCtx.sfUserId);
        blocks.push(...buildVisitsView(visits, storeMap, s.visitFilter, activeVisit?.Id || null));
        break;
      }
      case 'visit_details': {
        if (!s.selectedVisitId) { setState(slackUserId, { page: 'visits' }); return publishView(app, slackUserId, client, userCtx); }
        const visit = await getVisitById(s.selectedVisitId);
        if (!visit) { setState(slackUserId, { page: 'visits' }); return publishView(app, slackUserId, client, userCtx); }
        const storeIds = [visit.Retail_Store_Custom__c].filter(Boolean);
        const storeMap = await getStoresByIds(storeIds);
        const store = storeMap.get(visit.Retail_Store_Custom__c);
        const contact = visit.AccountId__c ? await getAccountContact(visit.AccountId__c) : null;
        const surveys = await getVisitSurveyResponses(s.selectedVisitId);
        blocks.push(...buildVisitDetailsView(visit, store, contact, surveys));
        break;
      }
      case 'visit_insights': {
        if (!s.selectedVisitId) { setState(slackUserId, { page: 'visit_details' }); return publishView(app, slackUserId, client, userCtx); }
        const visit = await getVisitById(s.selectedVisitId);
        if (!visit) { setState(slackUserId, { page: 'visit_details' }); return publishView(app, slackUserId, client, userCtx); }
        const store = await getStoresByIds([visit.Retail_Store_Custom__c]);
        const storeRec = store.get(visit.Retail_Store_Custom__c);
        const storeName = storeRec?.Account__r?.Name || storeRec?.Name || 'N/A';

        const [history, orders, freqProducts, lastOrder, logs] = await Promise.all([
          getStoreVisitHistory(visit.Retail_Store_Custom__c, 5),
          getStoreOrders(visit.Retail_Store_Custom__c, 5),
          getFrequentlyBoughtProducts(visit.AccountId__c, 5),
          getLastOrderSummary(visit.AccountId__c),
          getStoreVisitLogs(visit.Retail_Store_Custom__c, 10),
        ]);
        blocks.push(...buildVisitInsightsView(storeName, history, freqProducts, lastOrder, logs));
        break;
      }
      case 'orders': {
        const today = B.todayDateString();
        const dailyVisits = await getDailyVisits(userCtx.sfUserId, today);
        const storeIds = dailyVisits.map((v: any) => v.Retail_Store_Custom__c).filter(Boolean);
        const storeMap = await getStoresByIds(storeIds);
        blocks.push(...buildOrdersView(dailyVisits, storeMap));
        break;
      }
      case 'accounts': {
        const stores = await getAllStores();
        blocks.push(...buildAccountsView(stores));
        break;
      }
      case 'profile': {
        const insights = await getVisitInsights(userCtx.sfUserId);
        blocks.push(...buildProfileView(userCtx.sfaUser?.Name || 'User', insights));
        break;
      }
    }
  } catch (e) {
    console.error('[router] publishView error:', e);
    blocks.push(B.section(':warning: Failed to load this page. Please try refreshing.'));
    blocks.push(B.actions(B.button(':arrows_counterclockwise: Refresh', 'sfa_refresh_home')));
    await client.views.publish({ user_id: slackUserId, view: { type: 'home', blocks } });
    return;
  }

  blocks.unshift(navBar(s.page));
  await client.views.publish({ user_id: slackUserId, view: { type: 'home', blocks } });
}
