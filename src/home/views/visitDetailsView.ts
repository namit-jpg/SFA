import { VisitRecord, RetailStoreRecord, AccountContact } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export function buildVisitDetailsView(
  visit: VisitRecord, store: RetailStoreRecord | undefined, contact: AccountContact | null, surveys?: any[]
): any[] {
  const blocks: any[] = [];
  const storeName = store?.Account__r?.Name || store?.Name || 'N/A';

  blocks.push(B.header('Visit Details'));
  blocks.push(B.actions(
    B.button(':arrow_left: Back to Visits', 'sfa_nav_visits'),
  ));
  blocks.push(B.divider());

  // ─── Visit Information Card ───
  blocks.push(B.header('VISIT INFORMATION'));
  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*DISTRIBUTOR ACCOUNT NAME*\n${storeName}` } });
  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*PLANNED DATE*\n${visit.PlannedDate__c || visit.Visit_Date__c || 'N/A'}` } });
  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*ACTUAL START DATE AND TIME*\n${B.formatDateTime(visit.ActualStartTime__c) || 'Not Started'}` } });
  blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*VISIT TYPE*\n${visit.Type__c || 'N/A'}` } });

  const addr = visit.AccountId__r?.BillingStreet || '';
  const city = visit.AccountId__r?.BillingCity || '';
  const state = visit.AccountId__r?.BillingState || '';
  const fullAddr = [addr, city, state].filter(Boolean).join(', ');
  if (fullAddr) {
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*ADDRESS*\n${fullAddr}` } });
  }
  blocks.push(B.divider());

  // ─── Contact Person ───
  if (contact) {
    blocks.push(B.header('CONTACT PERSON'));
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*NAME:* ${contact.Name || 'N/A'}` } });
    if (contact.Phone__c || (contact as any).Phone) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*PHONE:* ${contact.Phone__c || (contact as any).Phone || 'N/A'}` } });
    }
    if (contact.Email) {
      blocks.push({ type: 'section', text: { type: 'mrkdwn', text: `*EMAIL:* ${contact.Email}` } });
    }
    blocks.push(B.actions(
      B.button(':phone: Call', 'sfa_open_call', visit.Id),
      B.button(':email: Email', 'sfa_open_email', visit.Id),
      B.button(':round_pushpin: Navigate', 'sfa_navigate_visit', visit.Id),
    ));
    blocks.push(B.divider());
  }

  // ─── Notes ───
  blocks.push(B.header('NOTES'));
  blocks.push(B.section(visit.Visit_Notes__c || '_No notes_'));
  blocks.push(B.actions(
    B.button(':pencil2: Add Note', 'sfa_open_note', visit.Id),
  ));
  blocks.push(B.divider());

  // ─── Survey Responses ───
  if (surveys && surveys.length > 0) {
    blocks.push(B.header('SURVEY RESPONSES'));
    for (const s of surveys) {
      blocks.push(B.section(`*${s.Question__c || 'Q'}*\n> ${s.Answer__c || '-'}`));
    }
    blocks.push(B.divider());
  }

  // ─── Visit Insights ───
  blocks.push(B.actions(
    B.button(':chart_with_upwards_trend: Visit Insights', 'sfa_view_insights', visit.Id),
  ));
  blocks.push(B.divider());

  // ─── Quick Actions ───
  blocks.push(B.header('QUICK ACTIONS'));

  const isInProgress = visit.Status__c === 'In Progress';
  const isCompleted = visit.Status__c === 'Completed';

  if (isInProgress) {
    blocks.push(B.actions(
      B.button(':shopping_trolley: New Order', 'sfa_create_order', visit.Id, 'primary'),
      B.button(':clipboard: Survey', 'sfa_open_survey', visit.Id),
      B.button(':moneybag: Add Expense', 'sfa_open_expense', visit.Id),
      B.button(':memo: Competing Product', 'sfa_competing', visit.Id),
    ));
    blocks.push(B.actions(
      B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined),
      B.button(':white_check_mark: Check-Out', 'sfa_visit_check_out', visit.Id, 'danger'),
    ));
  } else if (!isCompleted) {
    blocks.push(B.actions(
      B.button(':white_check_mark: Check In', 'sfa_visit_check_in', visit.Id, 'primary'),
      B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined),
    ));
  } else {
    blocks.push(B.section(':white_check_mark: This visit has been completed.'));
  }

  return blocks;
}
