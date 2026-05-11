import { VisitRecord, RetailStoreRecord } from '../salesforce/soql';
import * as B from '../utils/blocks';

export function buildStartVisitModal(visit: VisitRecord, store: RetailStoreRecord | null): any {
  const name = store?.Account__r?.Name || store?.Name || 'Unknown Store';
  const timeStr = visit.Planned_Start_Time__c
    ? B.formatTime(visit.Planned_Start_Time__c)
    : 'Flexible';

  return {
    type: 'modal',
    callback_id: 'sfa_start_visit_submit',
    title: { type: 'plain_text', text: 'Start Visit' },
    submit: { type: 'plain_text', text: 'Begin Visit' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visit.Id,
    blocks: [
      B.header(`:convenience_store: ${name}`),
      B.section(`*Scheduled:* ${B.formatTime(visit.Planned_Start_Time__c || '')} - ${B.formatTime(visit.Planned_End_Time__c || '')}`),
      B.section(`*Beat:* ${visit.Beat__r?.Name || 'N/A'} | *Type:* ${visit.Type__c || 'N/A'}`),
      B.divider(),
      B.context('Click "Begin Visit" to check in and start your visit.'),
    ].filter(Boolean),
  };
}
