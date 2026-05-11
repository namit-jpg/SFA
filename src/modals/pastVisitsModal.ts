import * as B from '../utils/blocks';

export function buildPastVisitsModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_past_visits_search',
    title: { type: 'plain_text', text: 'Past Visits' },
    submit: { type: 'plain_text', text: 'Search' },
    close: { type: 'plain_text', text: 'Close' },
    blocks: [
      B.header(':mag: Search Past Visits'),
      B.context('Search by store name or visit outcome.'),
      B.divider(),
      {
        type: 'input',
        block_id: 'past_search',
        label: { type: 'plain_text', text: 'Search' },
        element: {
          type: 'plain_text_input',
          action_id: 'past_search',
          placeholder: { type: 'plain_text', text: 'Store name or keyword...' },
        },
      },
    ],
  };
}

export function buildPastVisitsResultsView(
  visits: any[],
  storeMap: Map<string, any>,
  query: string
): any {
  const blocks: any[] = [];
  blocks.push(B.header(`:mag: Past Visits${query ? ` — "${query}"` : ''}`));
  blocks.push(B.context(`${visits.length} visit(s) found`));
  blocks.push(B.divider());

  if (visits.length === 0) {
    blocks.push(B.section(':information_source: No past visits found.'));
  }

  for (const visit of visits.slice(0, 20)) {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'Unknown';
    const dateStr = B.formatDate(visit.Visit_Date__c || visit.PlannedDate__c);

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *${dateStr}* | ${storeName}\nOrder: ${B.formatCurrency(visit.Order_Value__c || 0)} | Expenses: ${B.formatCurrency(visit.Total_Expense_Amount__c || 0)}${visit.Visit_Outcome__c ? `\n_${visit.Visit_Outcome__c}_` : ''}`,
      },
    });
    blocks.push(B.divider());
  }

  blocks.push(B.actions(
    B.button(':arrow_backward: Back', 'sfa_refresh_home'),
  ));

  return {
    type: 'modal',
    callback_id: 'sfa_past_visits_search',
    title: { type: 'plain_text', text: 'Past Visits' },
    submit: { type: 'plain_text', text: 'Search Again' },
    close: { type: 'plain_text', text: 'Close' },
    blocks,
  };
}
