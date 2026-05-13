import { RetailStoreRecord } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export function buildAccountsView(stores: RetailStoreRecord[]): any[] {
  const blocks: any[] = [];
  blocks.push(B.header('Accounts'));
  blocks.push(B.context(`${stores.length} stores`));
  blocks.push(B.divider());

  if (stores.length === 0) {
    blocks.push(B.section(':information_source: No accounts found.'));
    return blocks;
  }

  for (const s of stores.slice(0, 25)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${s.Account__r?.Name || s.Name}*${s.Store_Code__c ? '\n_Code: ' + s.Store_Code__c + '_' : ''}`,
      },
    });
    blocks.push(B.divider());
  }

  return blocks;
}
