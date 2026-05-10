import { App } from '@slack/bolt';
import { queryOne, insertRecord, updateRecord } from '../salesforce/connection';
import {
  getVisitById,
  getActiveVisit,
  getDailyVisits,
  getStandardPricebookId,
  getPriceForProduct,
  getStoreById,
} from '../salesforce/soql';
import { getCachedUser, clearUserCache, publishHomeView } from '../home/appHome';
import { SOBJECTS, VISIT_STATUS, VISIT_TYPE } from '../config';

function ref(app: any) { return app; }

export function registerViewSubmissions(app: App) {
  const self = ref(app);

  // ─── Start Visit Submission ───
  app.view('sfa_start_visit_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;

      const existing = await getVisitById(visitId);
      if (!existing) {
        await ack({ response_action: 'errors', errors: { error: 'Visit not found.' } });
        return;
      }

      if (existing.Status__c === 'In Progress') {
        await ack({ response_action: 'clear' });
        const slackUserId = (body as any).user.id;
        await client.chat.postEphemeral({
          user: slackUserId,
          channel: slackUserId,
          text: ':warning: This visit is already in progress.',
        });
        return;
      }

      await updateRecord(SOBJECTS.VISIT, visitId, {
        Status__c: VISIT_STATUS.IN_PROGRESS,
        ActualStartTime__c: new Date().toISOString(),
      });

      await ack({ response_action: 'clear' });
      const slackUserId = (body as any).user.id;
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] start_visit error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── End Visit Submission ───
  app.view('sfa_end_visit_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;

      const endNotes = values.end_notes?.end_notes?.value || '';
      const endReason = values.end_reason?.end_reason?.selected_option?.value || '';

      const updateData: any = {
        ActualEndTime__c: new Date().toISOString(),
        Visit_Outcome__c: endNotes,
      };

      if (endReason) {
        updateData.Status__c = 'Not Visited';
        updateData.Not_Visited_Reason__c = endReason;
      } else {
        updateData.Status__c = VISIT_STATUS.COMPLETED;
      }

      await updateRecord(SOBJECTS.VISIT, visitId, updateData);

      await ack({ response_action: 'clear' });
      const slackUserId = (body as any).user.id;
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] end_visit error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── Create Order Submission ───
  app.view('sfa_create_order_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);

      if (!userCtx) {
        await ack({ response_action: 'errors', errors: { error: 'Session expired. Refresh Home.' } });
        return;
      }

      const visit = await getVisitById(visitId);
      if (!visit) {
        await ack({ response_action: 'errors', errors: { error: 'Visit not found.' } });
        return;
      }

      let accountId = visit.AccountId__c || '';
      if (!accountId) {
        const store = await getStoreById(visit.Retail_Store_Custom__c);
        accountId = store?.Account__c || '';
      }
      if (!accountId) {
        await ack({ response_action: 'errors', errors: { error: 'No account linked to this visit. Cannot create order.' } });
        return;
      }

      const pbId = await getStandardPricebookId();
      if (!pbId) {
        await ack({ response_action: 'errors', errors: { error: 'No standard pricebook found.' } });
        return;
      }

      const lineItems: { productId: string; quantity: number; entryId: string; unitPrice: number }[] = [];
      for (let i = 1; i <= 5; i++) {
        const prodKey = `order_product_${i}`;
        const qtyKey = `order_qty_${i}`;
        const productId = values[prodKey]?.[prodKey]?.selected_option?.value;
        const qtyStr = values[qtyKey]?.[qtyKey]?.value || '';
        const qty = parseFloat(qtyStr);

        if (productId && !isNaN(qty) && qty > 0) {
          const priceInfo = await getPriceForProduct(productId, pbId);
          lineItems.push({
            productId,
            quantity: qty,
            entryId: priceInfo?.entryId || '',
            unitPrice: priceInfo?.unitPrice || 0,
          });
        }
      }

      if (lineItems.length === 0) {
        await ack({ response_action: 'errors', errors: { error: 'Add at least one product with quantity > 0.' } });
        return;
      }

      const orderId = await insertRecord(SOBJECTS.ORDER, {
        AccountId: accountId,
        Pricebook2Id: pbId,
        Status: 'Draft',
        EffectiveDate: new Date().toISOString().split('T')[0],
      });

      let totalValue = 0;
      for (const item of lineItems) {
        await insertRecord(SOBJECTS.ORDER_ITEM, {
          OrderId: orderId,
          Product2Id: item.productId,
          Quantity: item.quantity,
          UnitPrice: item.unitPrice,
          PricebookEntryId: item.entryId || undefined,
        });
        totalValue += item.unitPrice * item.quantity;
      }

      const existingOrderValue = visit.Order_Value__c || 0;
      const previousOrderId = visit.Order__c;

      await updateRecord(SOBJECTS.VISIT, visitId, {
        Order__c: orderId,
        Order_Value__c: existingOrderValue + totalValue,
      });

      await ack({ response_action: 'clear' });
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] create_order error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── Survey Submission ───
  app.view('sfa_survey_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;

      const surveyType = values.survey_type?.survey_type?.selected_option?.value || 'General Feedback';

      const questionMap: Record<string, string> = {
        survey_q1: 'Are shelves adequately stocked?',
        survey_q2: 'How engaged were the store staff?',
        survey_q3: 'Any competitor stock visible?',
        survey_q4: 'Any delivery/shipping concerns?',
        survey_q5: 'Rate store cleanliness (1-5)',
        survey_q6: 'Are promotional materials displayed?',
      };

      const responses: { question: string; answer: string }[] = [];

      for (const [key, question] of Object.entries(questionMap)) {
        const answer = values[key]?.[key]?.selected_option?.value;
        if (answer) {
          responses.push({ question, answer });
        }
      }

      const notes = values.survey_notes?.survey_notes?.value;
      if (notes) {
        responses.push({ question: 'Additional Notes', answer: notes });
      }

      if (responses.length === 0) {
        await ack({ response_action: 'errors', errors: { error: 'Please answer at least one question.' } });
        return;
      }

      for (const r of responses) {
        await insertRecord(SOBJECTS.VISIT_SURVEY_RESPONSE, {
          Visit_WD__c: visitId,
          Question__c: r.question,
          Answer__c: r.answer,
          Survey_Type__c: surveyType,
        });
      }

      await ack({ response_action: 'clear' });
      const slackUserId = (body as any).user.id;
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] survey error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── Expense Submission ───
  app.view('sfa_expense_submit', async ({ ack, view, body, client }) => {
    try {
      const visitId = view.private_metadata;
      const values = view.state.values;

      const category = values.expense_category?.expense_category?.selected_option?.value || 'Miscellaneous';
      const amount = parseFloat(values.expense_amount?.expense_amount?.value || '0') || 0;
      const description = values.expense_desc?.expense_desc?.value || '';
      const totalAmount = amount;

      if (totalAmount <= 0) {
        await ack({ response_action: 'errors', errors: { expense_amount: 'Enter an amount greater than 0.' } });
        return;
      }

      const visit = await getVisitById(visitId);
      if (!visit) {
        await ack({ response_action: 'errors', errors: { error: 'Visit not found.' } });
        return;
      }

      const categoryMap: Record<string, { travel: number; food: number; accommodation: number; misc: number }> = {
        'Travel': { travel: amount, food: 0, accommodation: 0, misc: 0 },
        'Food': { travel: 0, food: amount, accommodation: 0, misc: 0 },
        'Accommodation': { travel: 0, food: 0, accommodation: amount, misc: 0 },
        'Fuel': { travel: amount, food: 0, accommodation: 0, misc: 0 },
        'Parking': { travel: 0, food: 0, accommodation: 0, misc: amount },
        'Miscellaneous': { travel: 0, food: 0, accommodation: 0, misc: amount },
      };
      const c = categoryMap[category] || { travel: 0, food: 0, accommodation: 0, misc: amount };

      await insertRecord(SOBJECTS.EXPENSE, {
        Name: `Expense - ${visit.Name || visitId} - ${category}`,
        Visit_WD__c: visitId,
        Travel_Expense__c: c.travel,
        Food_Expense__c: c.food,
        Accommodation_Expense__c: c.accommodation,
        Miscellaneous_Expense__c: c.misc,
        Amount__c: totalAmount,
        Description__c: description,
        TransactionDate__c: new Date().toISOString().split('T')[0],
      });

      const existingTotal = visit.Total_Expense_Amount__c || 0;
      await updateRecord(SOBJECTS.VISIT, visitId, {
        Total_Expense_Amount__c: existingTotal + totalAmount,
      });

      await ack({ response_action: 'clear' });
      const slackUserId = (body as any).user.id;
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] expense error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── Ad-hoc Visit Submission ───
  app.view('sfa_adhoc_visit_submit', async ({ ack, view, body, client }) => {
    try {
      const values = view.state.values;
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);

      if (!userCtx) {
        await ack({ response_action: 'errors', errors: { error: 'Session expired. Refresh Home.' } });
        return;
      }

      const storeId = values.adhoc_store?.adhoc_store?.selected_option?.value;
      const visitDate = values.adhoc_date?.adhoc_date?.selected_date;
      const purpose = values.adhoc_purpose?.adhoc_purpose?.selected_option?.value || 'Other';
      const notes = values.adhoc_notes?.adhoc_notes?.value || '';

      if (!storeId || !visitDate) {
        await ack({ response_action: 'errors', errors: { error: 'Store and date are required.' } });
        return;
      }

      const store = await getStoreById(storeId);

      await insertRecord(SOBJECTS.VISIT, {
        Retail_Store_Custom__c: storeId,
        AccountId__c: store?.Account__c || null,
        SFA_User__c: userCtx.sfUserId,
        User__c: userCtx.sfUserRecordId,
        Visitor__c: userCtx.sfUserRecordId,
        Visit_Date__c: visitDate,
        PlannedDate__c: visitDate,
        Status__c: VISIT_STATUS.PLANNED,
        Type__c: VISIT_TYPE.AD_HOC,
        Purpose__c: purpose,
        Visit_Notes__c: notes,
      });

      await ack({ response_action: 'clear' });
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] adhoc_visit error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });

  // ─── Beat Plan Submission ───
  app.view('sfa_beat_plan_submit', async ({ ack, view, body, client }) => {
    try {
      const values = view.state.values;
      const slackUserId = (body as any).user.id;
      const userCtx = getCachedUser(slackUserId);

      if (!userCtx?.isManager) {
        await ack({ response_action: 'errors', errors: { error: 'Only managers can create beat plans.' } });
        return;
      }

      const beatDate = values.beat_date?.beat_date?.selected_date;
      const beatType = values.beat_type?.beat_type?.selected_option?.value;
      const repOptions = values.beat_reps?.beat_reps?.selected_options || [];
      const storeOptions = values.beat_stores?.beat_stores?.selected_options || [];
      const startTime = values.beat_start_time?.beat_start_time?.selected_time;
      const endTime = values.beat_end_time?.beat_end_time?.selected_time;
      const notes = values.beat_notes?.beat_notes?.value || '';

      if (!beatDate || !beatType || repOptions.length === 0 || storeOptions.length === 0) {
        await ack({ response_action: 'errors', errors: { error: 'Date, Beat Type, at least 1 Rep and 1 Store required.' } });
        return;
      }

      const repIds = repOptions.map((o: any) => o.value);
      const storeIds = storeOptions.map((o: any) => o.value);

      // Fetch all stores at once
      const storeDetails: Record<string, { Account__c: string | null }> = {};
      for (const storeId of storeIds) {
        const store = await getStoreById(storeId);
        storeDetails[storeId] = { Account__c: store?.Account__c || null };
      }

      // Create Beat header
      const beatId = await insertRecord(SOBJECTS.BEAT, {
        Start_Date__c: beatDate,
        End_Date__c: beatDate,
        Beat_Type__c: beatType,
        Status__c: 'Active',
        Notes__c: notes,
        Assigned_User__c: repIds[0],
        Preferred_Start_Time__c: startTime || null,
      });

      // Create Beat Stores + Beat Plan Line Items + Visits in sequence to maintain integrity
      try {
        for (const storeId of storeIds) {
          await insertRecord(SOBJECTS.BEAT_STORE, {
            Beat__c: beatId,
            Retail_Store__c: storeId,
            Name: `Beat Store - ${storeId}`,
          });
        }

        for (const repId of repIds) {
          for (const storeId of storeIds) {
            await insertRecord(SOBJECTS.BEAT_PLAN_LINE_ITEM, {
              Beat__c: beatId,
              Retail_Store_Custom__c: storeId,
              Assigned_User__c: repId,
              Visit_Date__c: beatDate,
              Start_Time__c: startTime || null,
              End_Time__c: endTime || null,
              Status__c: 'Planned',
            });

            const storeInfo = storeDetails[storeId];
            await insertRecord(SOBJECTS.VISIT, {
              Beat__c: beatId,
              Retail_Store_Custom__c: storeId,
              AccountId__c: storeInfo.Account__c || null,
              SFA_User__c: repId,
              User__c: userCtx.sfUserRecordId,
              Visitor__c: userCtx.sfUserRecordId,
              Visit_Date__c: beatDate,
              PlannedDate__c: beatDate,
              Planned_Start_Time__c: startTime || null,
              Planned_End_Time__c: endTime || null,
              Status__c: VISIT_STATUS.PLANNED,
              Type__c: beatType === 'Ad-hoc' ? VISIT_TYPE.AD_HOC : VISIT_TYPE.REGULAR,
            });
          }
        }
      } catch (innerErr) {
        console.error('[Submit] beat_plan inner error, beatId:', beatId, innerErr);
        await ack({
          response_action: 'errors',
          errors: { error: 'Partial beat plan created. Some records failed. Beat ID: ' + beatId },
        });
        return;
      }

      await ack({ response_action: 'clear' });
      clearUserCache(slackUserId);
      await publishHomeView(self, slackUserId, client);
    } catch (err: any) {
      console.error('[Submit] beat_plan error:', err);
      await ack({ response_action: 'errors', errors: { error: `Failed: ${err.message}` } });
    }
  });
}
