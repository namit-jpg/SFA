import { VisitRecord, RetailStoreRecord, AccountContact } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export function buildVisitDetailsView(
  visit: VisitRecord, store: RetailStoreRecord | undefined, contact: AccountContact | null,
  surveys?: any[], promotions?: any[], expenses?: any[]
): any[] {
  const blocks: any[] = [];
  const storeName = store?.Account__r?.Name || store?.Name || 'N/A';
  const isInProgress = visit.Status__c === 'In Progress';
  const isCompleted = visit.Status__c === 'Completed';

  blocks.push(B.header('Visit Details'));
  blocks.push(B.actions(B.button(':arrow_left: Back to Visits', 'sfa_nav_visits')));
  blocks.push(B.divider());

  // ─── Visit Summary ───
  const statusEmoji = isInProgress ? ':red_circle:' : isCompleted ? ':white_check_mark:' : ':orange_circle:';
  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: [
        `*${visit.Name}*  |  ${statusEmoji} *${visit.Status__c?.toUpperCase() || 'N/A'}*`,
        `*Store:* ${storeName}`,
        `*Type:* ${visit.Type__c || 'N/A'}  |  *Planned:* ${visit.PlannedDate__c || visit.Visit_Date__c || 'N/A'}`,
        visit.ActualStartTime__c ? `*Started:* ${B.formatDateTime(visit.ActualStartTime__c)}` : '',
        visit.ActualEndTime__c ? `*Ended:* ${B.formatDateTime(visit.ActualEndTime__c)}` : '',
      ].filter(Boolean).join('\n'),
    },
  });

  // ─── Financial summary ───
  const orderVal = visit.Order_Value__c || 0;
  const expenseAmt = visit.Total_Expense_Amount__c || 0;
  if (orderVal > 0 || expenseAmt > 0) {
    blocks.push(B.context(
      `Order Value: *${B.formatCurrency(orderVal)}*   |   Expenses: *${B.formatCurrency(expenseAmt)}*`
    ));
  }
  blocks.push(B.divider());

  // ─── Contact Person ───
  if (contact) {
    blocks.push(B.header('CONTACT PERSON'));
    const phone = (contact as any).Phone__c || (contact as any).Phone;
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*${contact.Name || 'N/A'}*${phone ? `  |  :phone: ${phone}` : ''}${contact.Email ? `  |  :email: ${contact.Email}` : ''}` },
    });
    blocks.push(B.actions(
      B.button(':phone: Call', 'sfa_open_call', visit.Id),
      B.button(':email: Email', 'sfa_open_email', visit.Id),
      B.button(':round_pushpin: Navigate', 'sfa_navigate_visit', visit.Id),
    ));
    blocks.push(B.divider());
  }

  // ─── Quick Actions (In Progress) ───
  if (isInProgress) {
    blocks.push(B.header('QUICK ACTIONS'));
    blocks.push(B.actions(
      B.button(':shopping_trolley: New Order', 'sfa_create_order', visit.Id, 'primary'),
      B.button(':clipboard: Survey', 'sfa_open_survey', visit.Id),
      B.button(':moneybag: Add Expense', 'sfa_open_expense', visit.Id),
      B.button(':memo: Competing Products', 'sfa_competing', visit.Id),
    ));
    blocks.push(B.actions(
      B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined),
      B.button(':white_check_mark: Check-Out', 'sfa_visit_check_out', visit.Id, 'danger'),
    ));
    blocks.push(B.divider());
  } else if (!isCompleted) {
    blocks.push(B.header('QUICK ACTIONS'));
    blocks.push(B.actions(
      B.button(':white_check_mark: Check In', 'sfa_visit_check_in', visit.Id, 'primary'),
      B.button(':calendar: Reschedule', 'sfa_reschedule_visit', visit.Id),
      B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined),
    ));
    blocks.push(B.divider());
  }

  // ─── Active Promotions / Schemes ───
  if (promotions && promotions.length > 0) {
    blocks.push(B.header(':gift: ACTIVE SCHEMES & PROMOTIONS'));
    for (const p of promotions) {
      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: [
            `*${p.Name}*  |  ${p.Scheme_Type__c || 'Scheme'}`,
            `Status: ${p.Status__c || 'N/A'}  |  Valid: ${p.Start_Date__c || '?'} → ${p.End_Date__c || '?'}`,
            p.Description__c ? `_${p.Description__c}_` : '',
          ].filter(Boolean).join('\n'),
        },
      });
    }
    blocks.push(B.divider());
  }

  // ─── Expenses ───
  if (expenses && expenses.length > 0) {
    blocks.push(B.header(':moneybag: EXPENSES'));
    for (const e of expenses) {
      const parts = [
        e.Travel_Expense__c ? `Travel: ${B.formatCurrency(e.Travel_Expense__c)}` : '',
        e.Food_Expense__c ? `Food: ${B.formatCurrency(e.Food_Expense__c)}` : '',
        e.Accommodation_Expense__c ? `Accommodation: ${B.formatCurrency(e.Accommodation_Expense__c)}` : '',
        e.Miscellaneous_Expense__c ? `Misc: ${B.formatCurrency(e.Miscellaneous_Expense__c)}` : '',
      ].filter(Boolean);
      blocks.push(B.context(`${B.formatCurrency(e.Amount__c || 0)}  —  ${parts.join(' | ') || 'General'}${e.Description__c ? `  |  ${e.Description__c}` : ''}`));
    }
    blocks.push(B.divider());
  }

  // ─── Survey Responses ───
  if (surveys && surveys.length > 0) {
    blocks.push(B.header(':clipboard: SURVEY RESPONSES'));
    for (const s of surveys) {
      blocks.push(B.section(`*${s.Question__c || 'Q'}*\n> ${s.Answer__c || '-'}`));
    }
    blocks.push(B.divider());
  }

  // ─── Notes ───
  blocks.push(B.header('NOTES'));
  blocks.push(B.section(visit.Visit_Notes__c || '_No notes yet_'));
  blocks.push(B.actions(
    B.button(':pencil2: Add Note', 'sfa_open_note', visit.Id),
    B.button(':chart_with_upwards_trend: Visit Insights', 'sfa_view_insights', visit.Id),
  ));

  return blocks;
}
