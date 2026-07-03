import { App } from '@slack/bolt';
import { getSFUserByEmail, getSFAUserByEmail, getSFAUserByUserId,
  getDailyVisits, getActiveVisit, getVisitById, getStoreById,
  getVisitInsights, getTodayAttendance, getStoresByIds,
  getStoreVisitHistory, getStoreOrders, getFrequentlyBoughtProducts,
  getAccountContact, getLastOrderSummary, getStoreVisitLogs,
  getPastVisits, searchProducts, getRepsList, searchStores,
  getStandardPricebookId, getPriceForProduct,
  updateVisitNotes, rescheduleVisit, createCompetingProduct,
  getActivePromotions, getVisitExpenses,
} from '../salesforce/soql';
import { publishView, setState, setFlash, clearState } from './router';
import { buildVisitsView } from './views/visitsView';
import { buildVisitDetailsView } from './views/visitDetailsView';
import { buildVisitInsightsView } from './views/visitInsightsView';
import { buildHomeView } from './views/homeView';
import { buildOrdersView } from './views/ordersView';
import { buildAccountsView } from './views/accountsView';
import { buildProfileView } from './views/profileView';
import { buildOrderSearchModal, buildOrderReviewModal } from '../modals/createOrderModal';
import { buildSurveyModal } from '../modals/surveyModal';
import { buildExpenseModal } from '../modals/expenseModal';
import { buildAdhocVisitModal } from '../modals/adhocVisitModal';
import { buildBeatPlanModal } from '../modals/beatPlanModal';
import { buildStartVisitModal } from '../modals/startVisitModal';
import { buildEndVisitModal } from '../modals/endVisitModal';
import { buildOnboardingStep1Modal, buildOnboardingStep2Modal, buildOnboardingStep3Modal } from '../modals/retailerOnboardingModal';
import { buildCompetingProductsModal, buildVisitNotesModal, buildRescheduleModal } from '../modals/competingNotesModals';
import { buildOrderVisitPickerModal } from '../modals/orderVisitPickerModal';
import * as B from '../utils/blocks';
import { SOBJECTS, VISIT_STATUS, VISIT_TYPE, SF_CONSTANTS } from '../config';
import { insertRecord, updateRecord } from '../salesforce/connection';

const USER_CACHE_TTL_MS = 30 * 60 * 1000; // 30 minutes
const sfUserCache = new Map<string, { data: { sfUserId: string; sfaUser: any; sfUserRecordId: string; isManager: boolean }; ts: number }>();
const orderState = new Map<string, any[]>();

async function resolveUser(slackUserId: string, client: any) {
  const cached = sfUserCache.get(slackUserId);
  if (cached && Date.now() - cached.ts < USER_CACHE_TTL_MS) return cached.data;
  if (cached) sfUserCache.delete(slackUserId); // expired

  const slackUser = await client.users.info({ user: slackUserId });
  const email = slackUser.user?.profile?.email;
  if (!email) return null;

  const sfaUser = await getSFAUserByEmail(email);
  const sfUser = await getSFUserByEmail(email);
  const r = {
    sfUserId: sfaUser?.Id || sfUser?.Id || '',
    sfaUser: sfaUser || null,
    sfUserRecordId: sfUser?.Id || '',
    isManager: !!sfUser?.UserRoleId,
  };
  sfUserCache.set(slackUserId, { data: r, ts: Date.now() });
  return r;
}

export function registerAppHome(app: App) {
  // App Home Opened
  app.event('app_home_opened', async ({ event, client }) => {
    const userCtx = await resolveUser(event.user, client);
    if (!userCtx) {
      await client.views.publish({ user_id: event.user, view: { type: 'home', blocks: [B.section(':warning: Cannot link to Salesforce.')] } });
      return;
    }
    await publishView(app, event.user, client, userCtx);
  });

  // Navigation
  const navActions: Record<string, any> = {
    sfa_nav_home: { page: 'home' },
    sfa_nav_visits: { page: 'visits' },
    sfa_nav_orders: { page: 'orders' },
    sfa_nav_accounts: { page: 'accounts' },
    sfa_nav_profile: { page: 'profile' },
    sfa_back_to_details: { page: 'visit_details' },
  };
  for (const [actionId, nav] of Object.entries(navActions)) {
    app.action(actionId, async ({ ack, body, client }) => {
      await ack();
      const uid = (body as any).user.id;
      setState(uid, { page: nav.page, selectedVisitId: undefined });
      const userCtx = await resolveUser(uid, client);
      if (userCtx) await publishView(app, uid, client, userCtx);
    });
  }

  app.action('sfa_refresh_home', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    sfUserCache.delete(uid);
    const userCtx = await resolveUser(uid, client);
    if (userCtx) await publishView(app, uid, client, userCtx);
  });

  // Visit List Filters
  app.action('sfa_filter_today', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; setState(uid, { visitFilter: 'today' }); const u = await resolveUser(uid, client); if (u) await publishView(app, uid, client, u); });
  app.action('sfa_filter_all', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; setState(uid, { visitFilter: 'all' }); const u = await resolveUser(uid, client); if (u) await publishView(app, uid, client, u); });
  app.action('sfa_optimize_route', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    setFlash(uid, ':arrows_counterclockwise: Route optimization triggered.');
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  // Sort Toggles
  app.action('sfa_toggle_visit_sort', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const current = (body as any).actions[0].value as 'latest' | 'oldest';
    setState(uid, { visitSort: current === 'latest' ? 'oldest' : 'latest' });
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  app.action('sfa_toggle_order_sort', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const current = (body as any).actions[0].value as 'latest' | 'oldest';
    setState(uid, { orderSort: current === 'latest' ? 'oldest' : 'latest' });
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  // Visit Detail Navigation
  app.action('sfa_view_details', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    setState(uid, { page: 'visit_details', selectedVisitId: visitId });
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  app.action('sfa_view_insights', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    setState(uid, { page: 'visit_insights', selectedVisitId: visitId });
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  // Navigate (Maps)
  app.action('sfa_navigate_visit', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    const visit = await getVisitById(visitId);
    const addr = visit?.AccountId__r?.BillingStreet || '';
    const city = visit?.AccountId__r?.BillingCity || '';
    const query = encodeURIComponent([addr, city].filter(Boolean).join(', ') || 'store');
    setFlash(uid, `:round_pushpin: https://www.google.com/maps/search/${query}`);
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  // Call / Email
  app.action('sfa_open_call', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    const visit = await getVisitById(visitId);
    const contact = visit?.AccountId__c ? await getAccountContact(visit.AccountId__c) : null;
    const phone = contact?.Phone__c || (contact as any)?.Phone || 'N/A';
    setFlash(uid, `:phone: ${phone}`);
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  app.action('sfa_open_email', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    const visit = await getVisitById(visitId);
    const contact = visit?.AccountId__c ? await getAccountContact(visit.AccountId__c) : null;
    const email = contact?.Email || 'N/A';
    setFlash(uid, `:email: ${email}`);
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  // Check In (Attendance)
  app.action('sfa_check_in_attendance', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const userCtx = await resolveUser(uid, client);
    if (!userCtx) return;
    const now = new Date().toISOString();
    const today = B.todayDateString();
    const visits = await getDailyVisits(userCtx.sfUserId, today);
    const pending = visits.find((v: any) => v.Status__c === 'Planned');
    if (pending) {
      await updateRecord(SOBJECTS.VISIT, pending.Id, { Check_In_Time__c: now });
    }
    setFlash(uid, `:white_check_mark: Checked in for today - ${B.formatDateTime(now)}`);
    await publishView(app, uid, client, userCtx);
  });

  // Visit Check In
  app.action('sfa_visit_check_in', async ({ ack, body, client }) => {
    await ack();
    const visitId = (body as any).actions[0].value;
    const uid = (body as any).user.id;
    const userCtx = await resolveUser(uid, client);
    const visit = await getVisitById(visitId);
    if (!visit) return;
    if (visit.Status__c === 'In Progress') {
      setFlash(uid, ':warning: This visit is already in progress.');
      if (userCtx) await publishView(app, uid, client, userCtx);
      return;
    }
    const active = await getActiveVisit(userCtx?.sfUserId || '');
    if (active && active.Id !== visitId) {
      setFlash(uid, ':lock: Please end your current active visit before starting a new one.');
      if (userCtx) await publishView(app, uid, client, userCtx);
      return;
    }
    await updateRecord(SOBJECTS.VISIT, visitId, { Status__c: VISIT_STATUS.IN_PROGRESS, ActualStartTime__c: new Date().toISOString() });
    setState(uid, { page: 'visit_details', selectedVisitId: visitId });
    if (userCtx) await publishView(app, uid, client, userCtx);
  });

  // Visit Check Out
  app.action('sfa_visit_check_out', async ({ ack, body, client }) => {
    await ack();
    const visitId = (body as any).actions[0].value;
    const uid = (body as any).user.id;
    await updateRecord(SOBJECTS.VISIT, visitId, { Status__c: VISIT_STATUS.COMPLETED, ActualEndTime__c: new Date().toISOString() });
    setFlash(uid, ':white_check_mark: Visit completed successfully.');
    setState(uid, { page: 'visits' });
    const u = await resolveUser(uid, client);
    if (u) await publishView(app, uid, client, u);
  });

  async function notifyError(uid: string, client: any, e: unknown) {
    console.error(e);
    setFlash(uid, ':warning: Something went wrong. Please try again.');
    const u = await resolveUser(uid, client).catch(() => null);
    if (u) await publishView(app, uid, client, u).catch(() => {});
  }

  // Existing Action Handlers
  app.action('sfa_create_order', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    const visitId = (body as any).actions[0].value;
    orderState.delete(uid); // fresh order
    try {
      const m = buildOrderSearchModal(visitId, []);
      await client.views.open({ trigger_id: (body as any).trigger_id, view: m });
    } catch (e) { console.error(e); }
  });
  app.action('sfa_open_survey', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildSurveyModal((body as any).actions[0].value) }); } catch (e) { await notifyError(uid, client, e); } });
  app.action('sfa_open_expense', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildExpenseModal((body as any).actions[0].value) }); } catch (e) { await notifyError(uid, client, e); } });
  app.action('sfa_open_adhoc_visit', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildAdhocVisitModal() }); } catch (e) { await notifyError(uid, client, e); } });
  app.action('sfa_open_beat_plan', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildBeatPlanModal() }); } catch (e) { await notifyError(uid, client, e); } });

  // External Select Options (Products, Stores, Reps)
  const productActions: string[] = ['order_search_product'];
  for (let i = 1; i <= 8; i++) productActions.push(`order_product_${i}`);
  productActions.push('return_product_1', 'return_product_2');
  for (const actionId of productActions) {
    app.options(actionId, async ({ ack, payload }: any) => {
      try {
        const q = payload.value || '';
        const products = q ? await searchProducts(q) : [];
        const options = products.map((p: any) => ({
          text: { type: 'plain_text' as const, text: `${p.Name} (${p.ProductCode || 'N/A'})` },
          value: p.Id,
        }));
        await ack({ options });
      } catch { await ack({ options: [] }); }
    });
  }

  app.options('beat_reps', async ({ ack, payload }: any) => {
    try {
      const reps = await getRepsList();
      const filtered = reps.filter((r: any) => r.Name.toLowerCase().includes((payload.value || '').toLowerCase()));
      await ack({ options: filtered.map((r: any) => ({ text: { type: 'plain_text' as const, text: r.Name }, value: r.Id })) });
    } catch { await ack({ options: [] }); }
  });

  app.options('beat_stores', async ({ ack, payload }: any) => {
    try {
      const stores = payload.value ? await searchStores(payload.value) : [];
      await ack({ options: stores.map((s: any) => ({ text: { type: 'plain_text' as const, text: s.Account__r?.Name || s.Name }, value: s.Id })) });
    } catch { await ack({ options: [] }); }
  });

  app.options('adhoc_store', async ({ ack, payload }: any) => {
    try {
      const stores = payload.value ? await searchStores(payload.value) : [];
      await ack({ options: stores.map((s: any) => ({ text: { type: 'plain_text' as const, text: s.Account__r?.Name || s.Name }, value: s.Id })) });
    } catch { await ack({ options: [] }); }
  });

  // Create Order from list (visit picker -> order modal)
  app.action('sfa_open_order_visit_picker', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    try {
      await client.views.open({ trigger_id: (body as any).trigger_id, view: buildOrderVisitPickerModal() });
    } catch (e) { await notifyError(uid, client, e); }
  });

  app.options('order_visit_picker', async ({ ack, payload, client }: any) => {
    try {
      const slackUserId = payload.user?.id || payload.user;
      const userCtx = await resolveUser(slackUserId, client);
      if (!userCtx) { await ack({ options: [] }); return; }
      const today = B.todayDateString();
      const visits = await getDailyVisits(userCtx.sfUserId, today);
      const active = visits.filter((v: any) => [VISIT_STATUS.PLANNED, VISIT_STATUS.IN_PROGRESS].includes(v.Status__c));
      const search = (payload.value || '').toLowerCase();
      const filtered = search
        ? active.filter((v: any) => v.Name?.toLowerCase().includes(search) || v.AccountId__r?.Name?.toLowerCase().includes(search))
        : active;
      await ack({
        options: filtered.map((v: any) => ({
          text: { type: 'plain_text', text: `${v.Name} - ${v.AccountId__r?.Name || 'N/A'}` },
          value: v.Id,
        })),
      });
    } catch { await ack({ options: [] }); }
  });

  app.view('sfa_pick_visit_for_order_submit', async ({ ack, view }) => {
    const visitId = view.state.values?.order_visit_picker?.order_visit_picker?.selected_option?.value;
    if (!visitId) {
      await ack({ response_action: 'errors', errors: { order_visit_picker: 'Please select a visit' } });
      return;
    }
    await ack({ response_action: 'push', view: buildOrderSearchModal(visitId, []) });
  });

  // Competing Products
  app.action('sfa_competing', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildCompetingProductsModal((body as any).actions[0].value) }); } catch (e) { await notifyError(uid, client, e); } });

  // Add Note
  app.action('sfa_open_note', async ({ ack, body, client }) => {
    await ack();
    const uid = (body as any).user.id;
    try {
      const visitId = (body as any).actions[0].value;
      const visit = await getVisitById(visitId);
      await client.views.open({ trigger_id: (body as any).trigger_id, view: buildVisitNotesModal(visitId, visit?.Visit_Notes__c || '') });
    } catch (e) { await notifyError(uid, client, e); }
  });

  // Reschedule
  app.action('sfa_reschedule_visit', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildRescheduleModal((body as any).actions[0].value) }); } catch (e) { await notifyError(uid, client, e); } });

  // Noop
  app.action('sfa_noop', async ({ ack }) => { await ack(); });

  // View Submissions
  app.view('sfa_start_visit_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata!;
      const existing = await getVisitById(visitId);
      if (existing?.Status__c === 'In Progress') { await ack({ response_action: 'clear' }); return; }
      const active = await getActiveVisit((await resolveUser((body as any).user.id, client))?.sfUserId || '');
      if (active && active.Id !== visitId) { await ack({ response_action: 'errors', errors: { error: 'End current visit first.' } }); return; }
      await updateRecord(SOBJECTS.VISIT, visitId, { Status__c: VISIT_STATUS.IN_PROGRESS, ActualStartTime__c: new Date().toISOString() });
      await ack({ response_action: 'clear' });
      const u = await resolveUser((body as any).user.id, client);
      if (u) await publishView(app, (body as any).user.id, client, u);
    } catch (e: any) { await ack({ response_action: 'errors', errors: { error: e.message } }); }
  });

  app.view('sfa_end_visit_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata!;
      const vals = view.state.values;
      const reason = (vals as any).end_reason?.end_reason?.selected_option?.value;
      const status = reason ? VISIT_STATUS.CANCELLED : VISIT_STATUS.COMPLETED;
      await updateRecord(SOBJECTS.VISIT, visitId, { Status__c: status, ActualEndTime__c: new Date().toISOString(), Visit_Outcome__c: (vals as any).end_notes?.end_notes?.value || '', Not_Visited_Reason__c: reason || null });
      await ack({ response_action: 'clear' });
      const u = await resolveUser((body as any).user.id, client);
      if (u) await publishView(app, (body as any).user.id, client, u);
    } catch (e: any) { await ack({ response_action: 'errors', errors: { error: e.message } }); }
  });

  // Create Order: Add Item (search -> add to cart)
  app.view('sfa_order_add_item', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata!;
      const uid = (body as any).user.id;
      const vals = view.state.values as any;
      const pid = vals.order_search_product?.order_search_product?.selected_option?.value;
      const qty = parseFloat(vals.order_search_qty?.order_search_qty?.value || '1') || 1;
      const action = vals.order_action?.order_action?.selected_option?.value || 'add';

      let items = orderState.get(uid) || [];

      // If user chose "Review & Place Order", switch to review modal
      if (action === 'review') {
        if (items.length === 0) {
          await ack({ response_action: 'errors', errors: { error: 'Add at least one product first.' } });
          return;
        }
        const reviewModal = buildOrderReviewModal(visitId, items);
        await ack({ response_action: 'update', view: reviewModal });
        return;
      }

      // Add product to cart
      if (pid) {
        const pbId = await getStandardPricebookId();
        const pinfo = pbId ? await getPriceForProduct(pid, pbId) : null;
        // Get product name from selected option text (avoids a full searchProducts query)
        const optionText = vals.order_search_product?.order_search_product?.selected_option?.text?.text || 'Product';
        items.push({
          productId: pid,
          name: optionText,
          quantity: qty,
          unitPrice: pinfo?.unitPrice || 0,
          entryId: pinfo?.entryId || '',
        });
        orderState.set(uid, items);
        const updatedModal = buildOrderSearchModal(visitId, items);
        await ack({ response_action: 'update', view: updatedModal });
      } else {
        await ack({ response_action: 'errors', errors: { error: 'Search and select a product, then click Continue.' } });
      }
    } catch (e: any) { await ack({ response_action: 'errors', errors: { error: e.message } }); }
  });

  // Create Order: Place Order (from accumulated items)
  app.view('sfa_order_place', async ({ ack, view, body, client }) => {
    const uid = (body as any).user.id;
    const meta = JSON.parse(view.private_metadata || '{}');
    const visitId = meta.visitId;
    const items: any[] = orderState.get(uid) || meta.items || [];
    if (items.length === 0) { await ack({ response_action: 'errors', errors: { error: 'No items in cart' } }); return; }
    await ack();
    await afterAck(uid, client, async () => {
      const userCtx = await resolveUser(uid, client);
      if (!userCtx) { setFlash(uid, ':warning: Session expired. Please refresh.'); return; }
      const visit = await getVisitById(visitId);
      if (!visit) { setFlash(uid, ':warning: Visit not found.'); return; }
      let accountId = visit.AccountId__c;
      if (!accountId) { const s = await getStoreById(visit.Retail_Store_Custom__c); accountId = s?.Account__c || ''; }
      if (!accountId) { setFlash(uid, ':warning: No account linked to this visit.'); return; }
      const pbId = await getStandardPricebookId();
      if (!pbId) { setFlash(uid, ':warning: No pricebook found in Salesforce.'); return; }

      const orderId = await insertRecord(SOBJECTS.ORDER, {
        AccountId: accountId,
        Pricebook2Id: pbId,
        Status: 'Draft',
        EffectiveDate: B.todayDateString(),
        RecordTypeId: SF_CONSTANTS.ORDER_RECORD_TYPE_SECONDARY,
        Retailer_Account__c: accountId,
        Distributor_Account__c: SF_CONSTANTS.WD_DISTRIBUTOR_ID,
        Visit__c: visitId,
      });
      let total = 0;
      for (const item of items) {
        if (!item.entryId) continue;
        await insertRecord(SOBJECTS.ORDER_ITEM, {
          OrderId: orderId, Product2Id: item.productId, Quantity: item.quantity,
          UnitPrice: item.unitPrice, PricebookEntryId: item.entryId,
        });
        total += item.unitPrice * item.quantity;
      }
      await updateRecord(SOBJECTS.VISIT, visitId, { Order__c: orderId, Order_Value__c: (visit.Order_Value__c || 0) + total });
      orderState.delete(uid);
      setFlash(uid, `:white_check_mark: Order placed! Total: *${B.formatCurrency(total)}*`);
    });
  });

  // Helper: ack-first async handler
  // Pattern: ack immediately, do SF work after, show result via flash message
  async function afterAck(uid: string, client: any, work: () => Promise<void>) {
    try {
      await work();
    } catch (e: any) {
      console.error('[SFA]', e);
      setFlash(uid, `:warning: ${(e as any)?.data?.message || e.message || 'Something went wrong.'}`);
    }
    const u = await resolveUser(uid, client).catch(() => null);
    if (u) await publishView(app, uid, client, u).catch(() => {});
  }

  app.view('sfa_survey_submit', async ({ ack, view, body }) => {
    const visitId = view.private_metadata!;
    const vals = view.state.values as any;
    const uid = (body as any).user.id;
    const responses: any[] = [];
    for (let i = 1; i <= 6; i++) {
      const a = vals[`survey_q${i}`]?.[`survey_q${i}`]?.selected_option?.value;
      if (a) responses.push({ question: `Question ${i}`, answer: a });
    }
    const notes = vals.survey_notes?.survey_notes?.value;
    if (notes) responses.push({ question: 'Additional Notes', answer: notes });
    if (responses.length === 0) { await ack({ response_action: 'errors', errors: { survey_q1: 'Answer at least one question' } }); return; }
    await ack();
    const surveyType = vals.survey_type?.survey_type?.selected_option?.value || 'Retailer Feedback';
    for (const r of responses) {
      await insertRecord(SOBJECTS.VISIT_SURVEY_RESPONSE, { Visit_WD__c: visitId, Question__c: r.question, Answer__c: r.answer, Survey_Type__c: surveyType }).catch(console.error);
    }
    setFlash(uid, `:white_check_mark: Survey submitted (${responses.length} response(s)).`);
  });

  app.view('sfa_expense_submit', async ({ ack, view, body, client }) => {
    const visitId = view.private_metadata!;
    const vals = view.state.values as any;
    const uid = (body as any).user.id;
    const cat = vals.expense_category?.expense_category?.selected_option?.value || 'Miscellaneous';
    const amt = parseFloat(vals.expense_amount?.expense_amount?.value || '0') || 0;
    if (amt <= 0) { await ack({ response_action: 'errors', errors: { expense_amount: 'Enter a valid amount greater than 0' } }); return; }
    await ack();
    await afterAck(uid, client, async () => {
      const catMap: Record<string, any> = { Travel: { Travel_Expense__c: amt }, Food: { Food_Expense__c: amt }, Accommodation: { Accommodation_Expense__c: amt }, Fuel: { Travel_Expense__c: amt }, Parking: { Miscellaneous_Expense__c: amt }, Miscellaneous: { Miscellaneous_Expense__c: amt } };
      await insertRecord(SOBJECTS.EXPENSE, { Name: `Exp - ${visitId}`, Visit_WD__c: visitId, Amount__c: amt, ...(catMap[cat] || {}), Description__c: vals.expense_desc?.expense_desc?.value || '', TransactionDate__c: B.todayDateString() });
      const v = await getVisitById(visitId);
      await updateRecord(SOBJECTS.VISIT, visitId, { Total_Expense_Amount__c: (v?.Total_Expense_Amount__c || 0) + amt });
      setFlash(uid, `:white_check_mark: Expense of ${B.formatCurrency(amt)} recorded.`);
    });
  });

  app.view('sfa_adhoc_visit_submit', async ({ ack, view, body, client }) => {
    const vals = view.state.values as any;
    const uid = (body as any).user.id;
    const storeId = vals.adhoc_store?.adhoc_store?.selected_option?.value;
    const storeName = vals.adhoc_store?.adhoc_store?.selected_option?.text?.text || 'Store';
    const date = vals.adhoc_date?.adhoc_date?.selected_date;
    if (!storeId || !date) { await ack({ response_action: 'errors', errors: { adhoc_store: 'Select a store and date' } }); return; }
    await ack();
    await afterAck(uid, client, async () => {
      const userCtx = await resolveUser(uid, client);
      if (!userCtx) { setFlash(uid, ':warning: Session expired. Please refresh.'); return; }
      const store = await getStoreById(storeId);
      const retailerName = store?.Account__r?.Name || store?.Name || storeName;
      const visitPayload: Record<string, any> = {
        Retail_Store_Custom__c: storeId,
        AccountId__c: store?.Account__c || null,
        SFA_User__c: userCtx.sfUserId,
        Visit_Date__c: date,
        PlannedDate__c: date,
        Status__c: VISIT_STATUS.PLANNED,
        Type__c: VISIT_TYPE.AD_HOC,
        Purpose__c: vals.adhoc_purpose?.adhoc_purpose?.selected_option?.value || 'Order Taking',
      };
      const ownerId = userCtx.sfUserRecordId || SF_CONSTANTS.DEFAULT_OWNER_ID;
      visitPayload.OwnerId = ownerId;
      if (userCtx.sfUserRecordId) {
        visitPayload.User__c = userCtx.sfUserRecordId;
        visitPayload.Visitor__c = userCtx.sfUserRecordId;
      } else {
        visitPayload.User__c = SF_CONSTANTS.DEFAULT_OWNER_ID;
        visitPayload.Visitor__c = SF_CONSTANTS.DEFAULT_OWNER_ID;
      }
      await insertRecord(SOBJECTS.VISIT, visitPayload);
      setFlash(uid, `:white_check_mark: Visit created for *${retailerName}* on ${date}.`);
    });
  });

  // New Submissions
  app.view('sfa_competing_submit', async ({ ack, view, body, client }) => {
    const visitId = view.private_metadata!;
    const vals = view.state.values as any;
    const uid = (body as any).user.id;
    await ack();
    await afterAck(uid, client, async () => {
      const visit = await getVisitById(visitId);
      let accountId = visit?.AccountId__c || null;
      if (!accountId && visit?.Retail_Store_Custom__c) {
        const store = await getStoreById(visit.Retail_Store_Custom__c);
        accountId = store?.Account__c || null;
      }
      let count = 0;
      for (let i = 1; i <= 3; i++) {
        const name = vals[`comp_name_${i}`]?.[`comp_name_${i}`]?.value?.trim();
        if (!name) continue;
        const price = parseFloat(vals[`comp_price_${i}`]?.[`comp_price_${i}`]?.value || '0') || null;
        await createCompetingProduct({
          Name: name,
          Visit_WD__c: visitId,
          Brand__c: vals[`comp_brand_${i}`]?.[`comp_brand_${i}`]?.value || null,
          Price__c: price,
          Remarks__c: vals[`comp_remarks_${i}`]?.[`comp_remarks_${i}`]?.value || null,
          Retail_Store__c: accountId,
        });
        count++;
      }
      if (count > 0) setFlash(uid, `:white_check_mark: ${count} competing product(s) recorded.`);
    });
  });

  app.view('sfa_notes_submit', async ({ ack, view, body, client }) => {
    const visitId = view.private_metadata!;
    const note = (view.state.values as any).note_text?.note_text?.value || '';
    const uid = (body as any).user.id;
    await ack();
    await afterAck(uid, client, async () => {
      await updateVisitNotes(visitId, note);
      setFlash(uid, ':white_check_mark: Notes saved.');
    });
  });

  app.view('sfa_reschedule_submit', async ({ ack, view, body, client }) => {
    const visitId = view.private_metadata!;
    const vals = view.state.values as any;
    const uid = (body as any).user.id;
    const date = vals.reschedule_date?.reschedule_date?.selected_date;
    const reason = vals.reschedule_reason?.reschedule_reason?.selected_option?.value || 'Other';
    if (!date) { await ack({ response_action: 'errors', errors: { reschedule_date: 'Select a new date' } }); return; }
    await ack();
    await afterAck(uid, client, async () => {
      await rescheduleVisit(visitId, date, reason);
      setFlash(uid, `:white_check_mark: Visit rescheduled to ${date} (${reason}).`);
    });
  });

  // Onboarding (3-step)
  app.action('sfa_open_onboarding', async ({ ack, body, client }) => { await ack(); const uid = (body as any).user.id; try { await client.views.open({ trigger_id: (body as any).trigger_id, view: buildOnboardingStep1Modal() }); } catch (e) { await notifyError(uid, client, e); } });

  function parseViewState(values: any): Record<string, any> {
    const data: Record<string, any> = {};
    for (const [key, block] of Object.entries(values)) {
      const el = (block as any)[key];
      if (el?.value !== undefined && el.value !== null && el.value !== '') data[key] = el.value;
      else if (el?.selected_option?.value) data[key] = el.selected_option.value;
    }
    return data;
  }

  app.view('sfa_onboarding_step1_submit', async ({ ack, view }) => {
    const data = parseViewState(view.state.values);
    await ack({ response_action: 'update', view: buildOnboardingStep2Modal(JSON.stringify(data)) });
  });

  app.view('sfa_onboarding_step2_submit', async ({ ack, view }) => {
    const prev = JSON.parse(view.private_metadata || '{}');
    const curr = parseViewState(view.state.values);
    await ack({ response_action: 'update', view: buildOnboardingStep3Modal(JSON.stringify({ ...prev, ...curr })) });
  });

  app.view('sfa_onboarding_step3_submit', async ({ ack, view, body, client }) => {
    const uid = (body as any).user.id;
    const prev = JSON.parse(view.private_metadata || '{}');
    const curr = parseViewState(view.state.values);
    const data = { ...prev, ...curr };
    await ack();
    await afterAck(uid, client, async () => {
      await insertRecord(SOBJECTS.PARTNER_REQUEST, {
        First_Name__c: data.onb_first_name || '', Last_Name__c: data.onb_last_name || '',
        Enterprise_Name__c: data.onb_enterprise || '', Company_Name__c: data.onb_enterprise || '',
        Phone__c: data.onb_phone || '', Email__c: data.onb_email || '',
        ...(data.onb_year_est ? { Year_Established__c: parseInt(data.onb_year_est) } : {}),
        Business_Type__c: data.onb_biz_type || 'Individual',
        Street__c: data.onb_street || '', City__c: data.onb_city || '',
        State__c: data.onb_state || '', Postal_Code__c: data.onb_postal || '',
        Country__c: data.onb_country || 'India',
        Store_Footage_in_sqft__c: parseFloat(data.onb_store_area || '0') || null,
        Store_Type__c: data.onb_store_type || null,
        Expected_Opening_date__c: data.onb_opening_date || null,
        PAN_Card_Numer__c: data.onb_pan || '', GST_Number__c: data.onb_gst || '',
        Aadhar_Number__c: data.onb_aadhar || null,
        Bank_Name__c: data.onb_bank_name || '', Bank_Account_Number__c: data.onb_bank_ac || '',
        IFSC_Code__c: data.onb_ifsc || '', Onboarding_Stage__c: 'Submitted', Status__c: 'Submitted',
      });
      sfUserCache.delete(uid);
      setFlash(uid, ':white_check_mark: Retailer onboarding submitted successfully!');
    });
  });

  app.view('sfa_noop_modal', async ({ ack }) => { await ack({ response_action: 'clear' }); });
}

// Backward compat stubs for old action/submission files (no longer used)
export function getCachedUser(_uid: string): any { return null; }
export function clearUserCache(_uid: string): void {}
export async function publishHomeView(_app: any, _uid: string, _client: any): Promise<void> {}
