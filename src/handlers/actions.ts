import { App } from '@slack/bolt';
import {
  getVisitById,
  getStoreById,
  searchStores,
  searchProducts,
  getRepsList,
} from '../salesforce/soql';
import { buildStartVisitModal } from '../modals/startVisitModal';
import { buildCreateOrderModal } from '../modals/createOrderModal';
import { buildSurveyModal } from '../modals/surveyModal';
import { buildExpenseModal } from '../modals/expenseModal';
import { buildEndVisitModal } from '../modals/endVisitModal';
import { buildAdhocVisitModal } from '../modals/adhocVisitModal';
import { buildBeatPlanModal } from '../modals/beatPlanModal';
import { getCachedUser } from '../home/appHome';

function showError(ack: any, message: string) {
  ack({ response_action: 'errors', errors: { error: message } }).catch(() => {});
  console.error(`[Action] ${message}`);
}

export function registerActions(app: App) {
  // ─── Start Visit ───
  app.action('sfa_start_visit', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const visit = await getVisitById(visitId);

      if (!visit) {
        return;
      }

      if (visit.Status__c === 'In Progress') {
        await client.chat.postEphemeral({
          user: (body as any).user.id,
          channel: (body as any).channel?.id || (body as any).user.id,
          text: ':warning: This visit is already in progress.',
        });
        return;
      }

      const store = visit.Retail_Store_Custom__c ? await getStoreById(visit.Retail_Store_Custom__c) : null;
      const modal = buildStartVisitModal(visit, store);
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] start_visit error:', err);
      await showError(ack, `Error: ${err.message}`);
    }
  });

  // ─── Create Order ───
  app.action('sfa_create_order', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const modal = buildCreateOrderModal(visitId);
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] create_order error:', err);
    }
  });

  // ─── Open Survey ───
  app.action('sfa_open_survey', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const modal = buildSurveyModal(visitId);
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] open_survey error:', err);
    }
  });

  // ─── Open Expense ───
  app.action('sfa_open_expense', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const modal = buildExpenseModal(visitId);
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] open_expense error:', err);
    }
  });

  // ─── End Visit ───
  app.action('sfa_end_visit', async ({ ack, body, client }) => {
    await ack();
    try {
      const visitId = (body as any).actions[0].value;
      const visit = await getVisitById(visitId);
      if (!visit) return;

      const store = visit.Retail_Store_Custom__c ? await getStoreById(visit.Retail_Store_Custom__c) : null;
      const modal = buildEndVisitModal(visit, store);
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] end_visit error:', err);
    }
  });

  // ─── Ad-hoc Visit ───
  app.action('sfa_open_adhoc_visit', async ({ ack, body, client }) => {
    await ack();
    try {
      const modal = buildAdhocVisitModal();
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] adhoc_visit error:', err);
    }
  });

  // ─── Beat Plan ───
  app.action('sfa_open_beat_plan', async ({ ack, body, client }) => {
    await ack();
    try {
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);
      if (!userCtx?.isManager) {
        await client.chat.postEphemeral({
          user: slackUserId,
          channel: (body as any).channel?.id || slackUserId,
          text: ':lock: Only managers can create beat plans.',
        });
        return;
      }
      const modal = buildBeatPlanModal();
      await client.views.open({
        trigger_id: (body as any).trigger_id,
        view: modal,
      });
    } catch (err: any) {
      console.error('[Action] beat_plan error:', err);
    }
  });

  // ─── External Select: Reps ───
  app.options('beat_reps', async ({ ack, payload }) => {
    try {
      const query = (payload as any).value || '';
      const reps = await getRepsList();
      const filtered = reps.filter((r: any) =>
        r.Name.toLowerCase().includes(query.toLowerCase())
      );
      const options = filtered.map((r: any) => ({
        text: { type: 'plain_text' as const, text: r.Name },
        value: r.Id,
      }));
      await ack({ options });
    } catch (err) {
      console.error('[Options] beat_reps error:', err);
      await ack({ options: [] });
    }
  });

  // ─── External Select: Stores ───
  app.options('beat_stores', async ({ ack, payload }) => {
    try {
      const query = (payload as any).value || '';
      const stores = query ? await searchStores(query) : [];
      const options = stores.map((s: any) => ({
        text: { type: 'plain_text' as const, text: s.Name },
        value: s.Id,
      }));
      await ack({ options });
    } catch (err) {
      console.error('[Options] beat_stores error:', err);
      await ack({ options: [] });
    }
  });

  // ─── External Select: Ad-hoc Store ───
  app.options('adhoc_store', async ({ ack, payload }) => {
    try {
      const query = (payload as any).value || '';
      const stores = query ? await searchStores(query) : [];
      const options = stores.map((s: any) => ({
        text: { type: 'plain_text' as const, text: s.Name },
        value: s.Id,
      }));
      await ack({ options });
    } catch (err) {
      console.error('[Options] adhoc_store error:', err);
      await ack({ options: [] });
    }
  });

  // ─── External Select: Products (5 slots) ───
  const productActions = ['order_product_1', 'order_product_2', 'order_product_3', 'order_product_4', 'order_product_5'];
  for (const actionId of productActions) {
    app.options(actionId, async ({ ack, payload }) => {
      try {
        const query = (payload as any).value || '';
        const products = query ? await searchProducts(query) : [];
        const options = products.map((p: any) => ({
          text: { type: 'plain_text' as const, text: `${p.Name} (${p.ProductCode || 'N/A'})` },
          value: p.Id,
        }));
        await ack({ options });
      } catch (err) {
        console.error(`[Options] ${actionId} error:`, err);
        await ack({ options: [] });
      }
    });
  }
}
