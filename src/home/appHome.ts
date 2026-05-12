import { App } from '@slack/bolt';
import {
  getSFUserByEmail, getSFAUserByEmail, getSFAUserByUserId, getManagerStatus,
  getDailyVisits, getActiveVisit, getTeamVisits, getStoresByIds, getStoreById,
  getVisitInsights, getPastVisits, getTodayAttendance, getStoreWithLocation,
  getStoreVisitHistory, getStoreOrders, getFrequentlyBoughtProducts,
  getProductStock, getVisitOrdersForInvoice, getOrderItemsWithStock,
  VisitRecord, RetailStoreRecord, getVisitById,
} from '../salesforce/soql';
import { SOBJECTS } from '../config';
import { buildRepHomeView, VisitInsights } from './views/repHome';
import { buildManagerHomeView } from './views/managerHome';
import { buildMarkAttendanceModal, buildDailyVisitsView } from '../modals/markAttendanceModal';
import { buildPastVisitsModal, buildPastVisitsResultsView } from '../modals/pastVisitsModal';
import { buildOnboardingStep1Modal, buildOnboardingStep2Modal, buildOnboardingStep3Modal } from '../modals/retailerOnboardingModal';
import { buildVisitIntelModal } from '../modals/visitIntelModal';
import { buildReturnModal, buildClaimModal } from '../modals/returnsClaimsModal';
import { buildProcessInvoiceModal } from '../modals/invoiceModal';
import * as B from '../utils/blocks';

const sfUserCache = new Map<string, { sfUserId: string; sfaUser: any; sfUserRecordId: string; isManager: boolean; slackUserId: string }>();
const pageState = new Map<string, string>();

export async function resolveUser(slackUserId: string, client: any): Promise<{
  sfUserId: string; sfaUser: any; sfUserRecordId: string; isManager: boolean;
} | null> {
  if (sfUserCache.has(slackUserId)) return sfUserCache.get(slackUserId)!;
  const slackUser = await client.users.info({ user: slackUserId });
  const email = slackUser.user?.profile?.email;
  if (!email) return null;

  const sfaUser = await getSFAUserByEmail(email);
  if (sfaUser) {
    const sfUser = await getSFUserByEmail(email);
    const r = { sfUserId: sfaUser.Id, sfaUser, sfUserRecordId: sfUser?.Id || '', isManager: !!sfUser?.UserRoleId, slackUserId };
    sfUserCache.set(slackUserId, r); return r;
  }
  const sfUser = await getSFUserByEmail(email);
  if (!sfUser) return null;
  const sfaUserByUserId = await getSFAUserByUserId(sfUser.Id);
  const r = { sfUserId: sfaUserByUserId?.Id || sfUser.Id, sfaUser: sfaUserByUserId || null, sfUserRecordId: sfUser.Id, isManager: !!sfUser.UserRoleId, slackUserId };
  sfUserCache.set(slackUserId, r); return r;
}

export function clearUserCache(slackUserId: string) { sfUserCache.delete(slackUserId); pageState.delete(slackUserId); }
export function getCachedUser(slackUserId: string) { return sfUserCache.get(slackUserId); }

async function collectStoreIds(...visits: (VisitRecord | null)[]): Promise<string[]> {
  const ids = new Set<string>();
  for (const v of visits) { if (v?.Retail_Store_Custom__c) ids.add(v.Retail_Store_Custom__c); }
  return [...ids];
}

export async function publishHomeView(app: App, slackUserId: string, client: any) {
  const userCtx = await resolveUser(slackUserId, client);
  if (!userCtx) {
    return client.views.publish({ user_id: slackUserId, view: { type: 'home', blocks: [B.section(':warning: *Unable to link to Salesforce.*')] } });
  }

  const { sfaUser, isManager } = userCtx;
  const sfUserName = sfaUser?.Name || 'User';
  const today = B.todayDateString();

  if (isManager) {
    const teamVisits = await getTeamVisits(userCtx.sfUserId, today);
    const storeIds = teamVisits.map((v: any) => v.Retail_Store_Custom__c).filter(Boolean);
    const storeMap = await getStoresByIds(storeIds);
    const totalOrders = teamVisits.reduce((sum: number, v: any) => sum + (v.Order_Value__c || 0), 0);
    const view = buildManagerHomeView(sfUserName, teamVisits, totalOrders, storeMap);
    return client.views.publish({ user_id: slackUserId, view });
  }

  const [dailyVisits, activeVisit, insights, attendance] = await Promise.all([
    getDailyVisits(userCtx.sfUserId, today),
    getActiveVisit(userCtx.sfUserId),
    getVisitInsights(userCtx.sfUserId),
    getTodayAttendance(userCtx.sfUserId, today),
  ]);

  const storeIds = await collectStoreIds(activeVisit, ...dailyVisits);
  const storeMap = await getStoresByIds(storeIds);

  const weekVisits = await getDailyVisits(userCtx.sfUserId, 'THIS_WEEK');
  const completed = weekVisits.filter((v: any) => v.Status__c === 'Completed').length;

  pageState.set(slackUserId, 'home');
  const view = buildRepHomeView(sfUserName, activeVisit, dailyVisits,
    { completed, total: weekVisits.length }, storeMap, insights, !!attendance);
  return client.views.publish({ user_id: slackUserId, view });
}

async function publishAttendanceView(app: App, slackUserId: string, client: any) {
  const userCtx = await resolveUser(slackUserId, client);
  if (!userCtx) return;

  const today = B.todayDateString();
  const [dailyVisits, activeVisit] = await Promise.all([
    getDailyVisits(userCtx.sfUserId, today),
    getActiveVisit(userCtx.sfUserId),
  ]);
  const storeIds = await collectStoreIds(activeVisit, ...dailyVisits);
  const storeMap = await getStoresByIds(storeIds);

  // Fetch location data for stores - don't break on failure
  try {
    for (const [sid] of storeMap) {
      const locStore = await getStoreWithLocation(sid);
      if (locStore?.Location__c) {
        const store = storeMap.get(sid) as any;
        store._hasLocation = true;
        store._lat = locStore.Location__r?.Location__Latitude__s;
        store._lng = locStore.Location__r?.Location__Longitude__s;
      }
    }
  } catch {} // swallow location errors

  pageState.set(slackUserId, 'attendance');
  const view = buildDailyVisitsView(dailyVisits, storeMap, activeVisit?.Id || null, true);
  return client.views.publish({ user_id: slackUserId, view });
}

export function registerAppHome(app: App) {
  app.event('app_home_opened', async ({ event, client }) => {
    const st = pageState.get(event.user) || 'home';
    if (st === 'attendance') return publishAttendanceView(app, event.user, client);
    await publishHomeView(app, event.user, client);
  });

  app.action('sfa_refresh_home', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    clearUserCache(uid);
    await publishHomeView(app, uid, client);
  });

  app.action('sfa_noop', async ({ ack }) => { await ack(); });

  // Mark Attendance
  app.action('sfa_mark_attendance', async ({ ack, body, client }) => {
    await ack();
    try {
      const modal = buildMarkAttendanceModal();
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // Past Visits
  app.action('sfa_open_past_visits', async ({ ack, body, client }) => {
    await ack();
    try {
      const modal = buildPastVisitsModal();
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // Retailer Onboarding
  app.action('sfa_open_onboarding', async ({ ack, body, client }) => {
    await ack();
    try {
      const modal = buildOnboardingStep1Modal();
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // Google Maps
  app.action('sfa_open_maps', async ({ ack, body, client }) => {
    await ack();
    try {
      const storeId = (body as any).actions[0].value;
      const store = await getStoreWithLocation(storeId);
      if (store?.Location__r) {
        const lat = store.Location__r.Location__Latitude__s;
        const lng = store.Location__r.Location__Longitude__s;
        const url = lat && lng ? `https://www.google.com/maps?q=${lat},${lng}` : `https://www.google.com/maps/search/${encodeURIComponent(store.Name)}`;
        await client.chat.postEphemeral({
          user: (body as any).user.id,
          channel: (body as any).user.id,
          text: `:round_pushpin: *${store.Name}* — ${url}`,
        });
        if (lat && lng) {
          const slackUserId = (body as any).user.id;
          const page = pageState.get(slackUserId);
          if (page === 'attendance') await publishAttendanceView(app, slackUserId, client);
        }
      } else {
        await client.chat.postEphemeral({
          user: (body as any).user.id,
          channel: (body as any).user.id,
          text: `:warning: No location data for this store.`,
        });
      }
    } catch (err: any) { console.error(err); }
  });

  // Past Visits Search Submit
  app.view('sfa_past_visits_search', async ({ ack, view, body, client }) => {
    try {
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);
      if (!userCtx) { await ack({ response_action: 'errors', errors: { error: 'Session expired.' } }); return; }

      const searchQuery = view.state.values.past_search?.past_search?.value || '';
      const visits = await getPastVisits(userCtx.sfUserId, searchQuery);
      const storeIds = visits.map(v => v.Retail_Store_Custom__c).filter(Boolean);
      const storeMap = await getStoresByIds(storeIds);

      await ack({
        response_action: 'update',
        view: buildPastVisitsResultsView(visits, storeMap, searchQuery),
      });
    } catch (err: any) {
      await ack({ response_action: 'errors', errors: { error: `Error: ${err.message}` } });
    }
  });

  // Onboarding Step 1 → Step 2
  app.view('sfa_onboarding_step1_submit', async ({ ack, view, body, client }) => {
    await ack({
      response_action: 'update',
      view: buildOnboardingStep2Modal(),
    });
  });

  // Onboarding Step 2 → Step 3
  app.view('sfa_onboarding_step2_submit', async ({ ack, view, body, client }) => {
    await ack({
      response_action: 'update',
      view: buildOnboardingStep3Modal(),
    });
  });

  // Mark Attendance Submit
  app.view('sfa_attendance_submit', async ({ ack, view, body, client }) => {
    const slackUserId = (body as any).user.id;
    await ack({ response_action: 'clear' });
    try {
      const values = view.state.values;
      const files = values.attendance_selfie?.attendance_selfie?.files;
      const userCtx = getCachedUser(slackUserId);
      const today = B.todayDateString();

      if (userCtx) {
        const todayVisits = await getDailyVisits(userCtx.sfUserId, today);
        const pendingVisit = todayVisits.find(v => v.Status__c === 'Planned');
        if (pendingVisit && files && files.length > 0) {
          try {
            const { updateRecord } = await import('../salesforce/connection');
            const url = files.map((f: any) => f.url_private || f.permalink_public).join('\n');
            await updateRecord('Visit__c', pendingVisit.Id, { Check_In_Selfie__c: url || 'Uploaded' });
          } catch (e: any) {
            console.error('[Attendance] Selfie update failed:', e.message);
          }
        }
      }
    } catch (err: any) {
      console.error('[Attendance] Error:', err.message);
    }
    // Always publish attendance view regardless of errors
    await publishAttendanceView(app, slackUserId, client);
  });

  // ─── Visit Intelligence ───
  app.action('sfa_visit_intel', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const visit = await getVisitById(visitId);
      if (!visit) return;
      const store = await getStoreById(visit.Retail_Store_Custom__c);
      const storeName = store?.Account__r?.Name || store?.Name || 'Unknown';

      const [history, orders] = await Promise.all([
        getStoreVisitHistory(visit.Retail_Store_Custom__c),
        getStoreOrders(visit.Retail_Store_Custom__c),
      ]);
      const topProducts = visit.AccountId__c ? await getFrequentlyBoughtProducts(visit.AccountId__c) : [];

      const modal = buildVisitIntelModal(history, orders, topProducts, storeName);
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // ─── Return ───
  app.action('sfa_open_return', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const modal = buildReturnModal(visitId);
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // ─── Claim ───
  app.action('sfa_open_claim', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const modal = buildClaimModal(visitId);
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // ─── Process Invoice ───
  app.action('sfa_open_invoice', async ({ ack, body, client }) => {
    await ack();
    try {
      const modal = buildProcessInvoiceModal();
      await client.views.open({ trigger_id: (body as any).trigger_id, view: modal });
    } catch (err: any) { console.error(err); }
  });

  // ─── Process Invoice Submit ───
  app.view('sfa_bulk_invoice_submit', async ({ ack, view, body, client }) => {
    try {
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);
      const values = view.state.values;
      let orderId = values.invoice_visit?.invoice_visit?.value || '';

      // If no order number provided, get from active visit
      if (!orderId && userCtx) {
        const activeVisit = await getActiveVisit(userCtx.sfUserId);
        if (activeVisit?.Order__c) orderId = activeVisit.Order__c;
      }
      if (!orderId) {
        await ack({ response_action: 'errors', errors: { error: 'No order found. Create an order first.' } });
        return;
      }

      const items = await getOrderItemsWithStock(orderId);
      if (items.length === 0) {
        await ack({ response_action: 'errors', errors: { error: 'No line items found in this order.' } });
        return;
      }

      let hasStock = false;
      let allStock = true;
      const stockResults: string[] = [];

      for (const item of items) {
        const stock = await getProductStock(item.Product2Id);
        if (stock >= item.Quantity) {
          hasStock = true;
          stockResults.push(`:white_check_mark: ${item.Product2?.Name || 'Unknown'} — ${stock} available (needs ${item.Quantity})`);
        } else if (stock > 0) {
          hasStock = true;
          allStock = false;
          stockResults.push(`:warning: ${item.Product2?.Name || 'Unknown'} — only ${stock}/${item.Quantity} available (PARTIAL)`);
        } else {
          allStock = false;
          stockResults.push(`:x: ${item.Product2?.Name || 'Unknown'} — OUT OF STOCK`);
        }
      }

      if (!hasStock) {
        await ack({ response_action: 'errors', errors: { error: 'No stock available for any product. Invoice blocked.' } });
        return;
      }

      // Create invoice
      const { insertRecord: insertRec } = await import('../salesforce/connection');
      const status = allStock ? 'Full' : 'Partial';
      const totalAmt = items.reduce((s: number, i: any) => s + (i.UnitPrice || 0) * i.Quantity, 0);
      await insertRec(SOBJECTS.INVOICE_CUSTOM, {
        Order__c: orderId,
        Invoice_Amount__c: totalAmt,
        Invoice_Date__c: B.todayDateString(),
        Full_Partial__c: status,
        Status__c: 'Generated',
      });

      const statusText = status === 'Full' ? ':white_check_mark: Fully Invoiced' : ':warning: Partially Invoiced';
      const stockMsg = stockResults.join('\n');
      await client.chat.postMessage({
        channel: slackUserId,
        text: `:receipt: *Invoice Generated (${status})*\nOrder: ${orderId}\nAmount: ₹${totalAmt}\n\n*Stock Check:*\n${stockMsg}`,
      });

      await ack({ response_action: 'clear' });
    } catch (err: any) {
      console.error('[Invoice]', err);
      await ack({ response_action: 'errors', errors: { error: `Error: ${err.message}` } });
    }
  });

  // ─── Return Submit ───
  app.view('sfa_return_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);
      const { insertRecord: insertRec } = await import('../salesforce/connection');

      const visit = await getVisitById(visitId);
      if (!visit) { await ack({ response_action: 'errors', errors: { error: 'Visit not found.' } }); return; }

      const returnType = values.return_type?.return_type?.selected_option?.value || 'Other';
      const description = values.return_desc?.return_desc?.value || '';

      const retId = await insertRec(SOBJECTS.RETURN_ORDER, {
        Account__c: visit.AccountId__c,
        Order__c: visit.Order__c,
        Status__c: 'New',
        Type__c: returnType,
        Description__c: description,
      });

      await ack({ response_action: 'clear' });
      await client.chat.postMessage({
        channel: slackUserId,
        text: `:white_check_mark: Return #${retId} created (${returnType}).`,
      });
    } catch (err: any) {
      await ack({ response_action: 'errors', errors: { error: `${err.message}` } });
    }
  });

  // ─── Claim Submit ───
  app.view('sfa_claim_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;
      const slackUserId = (body as any).user.id;
      const { insertRecord: insertRec } = await import('../salesforce/connection');

      const claimType = values.claim_type?.claim_type?.selected_option?.value || 'Other';
      const amount = parseFloat(values.claim_amount?.claim_amount?.value || '0');
      const description = values.claim_desc?.claim_desc?.value || '';

      const claimId = await insertRec(SOBJECTS.CLAIM, {
        Description__c: `${claimType}: ${description}`,
      });

      await ack({ response_action: 'clear' });
      await client.chat.postMessage({
        channel: slackUserId,
        text: `:white_check_mark: Claim #${claimId} filed (${claimType}) for ₹${amount}.`,
      });
    } catch (err: any) {
      await ack({ response_action: 'errors', errors: { error: `${err.message}` } });
    }
  });

  // ─── Noop Modal (visit intel close) ───
  app.view('sfa_noop_modal', async ({ ack }) => { await ack({ response_action: 'clear' }); });
}
