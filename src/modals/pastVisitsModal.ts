import * as B from '../utils/blocks';

export function buildPastVisitsListView(
  visits: any[], storeMap: Map<string, any>, storeName: string
): any {
  const blocks: any[] = [];
  blocks.push(B.header(`:calendar: Past Visits — ${storeName}`));
  blocks.push(B.context(`${visits.length} completed visit(s)`));
  blocks.push(B.divider());

  if (visits.length === 0) {
    blocks.push(B.section(':information_source: No past visits to this store.'));
  }

  for (const v of visits.slice(0, 15)) {
    const store = storeMap.get(v.Retail_Store_Custom__c);
    const loc = store?.City__c || store?.Street__c || '';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:white_check_mark: *${B.formatDate(v.Visit_Date__c)}*${loc ? ` — ${loc}` : ''}\nOrder: ${B.formatCurrency(v.Order_Value__c || 0)} | Expenses: ${B.formatCurrency(v.Total_Expense_Amount__c || 0)}${v.Visit_Outcome__c ? `\n_${v.Visit_Outcome__c}_` : ''}`,
      },
    });
    blocks.push(B.divider());
  }

  return {
    type: 'modal', callback_id: 'sfa_noop_modal',
    title: { type: 'plain_text', text: 'Past Visits' },
    close: { type: 'plain_text', text: 'Close' },
    blocks,
  };
}

export function buildPastOrdersListView(
  orders: any[], storeName: string
): any {
  const blocks: any[] = [];
  blocks.push(B.header(`:package: Past Orders — ${storeName}`));
  blocks.push(B.context(`${orders.length} order(s)`));
  blocks.push(B.divider());

  if (orders.length === 0) {
    blocks.push(B.section(':information_source: No orders for this store.'));
  }

  for (const o of orders.slice(0, 15)) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*#${o.OrderNumber}* | ${B.formatDate(o.EffectiveDate)} | ${B.formatCurrency(o.TotalAmount)}\nStatus: ${o.Status}`,
      },
    });
    blocks.push(B.divider());
  }

  return {
    type: 'modal', callback_id: 'sfa_noop_modal',
    title: { type: 'plain_text', text: 'Past Orders' },
    close: { type: 'plain_text', text: 'Close' },
    blocks,
  };
}
