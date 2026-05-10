import { VisitRecord, RetailStoreRecord } from '../salesforce/soql';
import * as B from '../utils/blocks';

export function buildEndVisitModal(visit: VisitRecord, store: RetailStoreRecord | null): any {
  const name = store?.Name || 'Unknown';
  const startTime = visit.ActualStartTime__c;
  const duration = startTime ? B.formatDuration(startTime, new Date().toISOString()) : 'N/A';

  return {
    type: 'modal',
    callback_id: 'sfa_end_visit_submit',
    title: { type: 'plain_text', text: 'End Visit' },
    submit: { type: 'plain_text', text: 'Complete Visit' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visit.Id,
    blocks: [
      B.header(`:white_check_mark: End Visit \u2014 ${name}`),
      B.divider(),
      B.section(`*Started:* ${B.formatTime(visit.ActualStartTime__c || '')} | *Duration:* ${duration}`),
      B.section(`*Order Value:* ${B.formatCurrency(visit.Order_Value__c || 0)} | *Expenses:* ${B.formatCurrency(visit.Total_Expense_Amount__c || 0)}`),
      B.divider(),
      {
        type: 'input',
        block_id: 'end_notes',
        label: { type: 'plain_text', text: 'Visit Outcome / Summary' },
        element: { type: 'plain_text_input', action_id: 'end_notes', multiline: true },
      },
      {
        type: 'input',
        block_id: 'end_reason',
        label: { type: 'plain_text', text: 'Not Visited Reason (only if incomplete)' },
        element: {
          type: 'static_select',
          action_id: 'end_reason',
          options: [
            { text: { type: 'plain_text', text: 'Store closed' }, value: 'Store closed' },
            { text: { type: 'plain_text', text: 'Manager unavailable' }, value: 'Manager unavailable' },
            { text: { type: 'plain_text', text: 'Stock not needed' }, value: 'Stock not needed' },
            { text: { type: 'plain_text', text: 'Other' }, value: 'Other' },
          ],
          placeholder: { type: 'plain_text', text: 'Select reason...' },
        },
        optional: true,
      },
      B.context('This will mark the visit as completed. Make sure you\'ve logged orders and expenses.'),
    ],
  };
}
