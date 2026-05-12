import * as B from '../utils/blocks';

export function buildVisitIntelModal(
  history: any[], orders: any[], topProducts: any[], storeName: string
): any {
  const blocks: any[] = [];

  blocks.push(B.header(`:bulb: Store Insights — ${storeName}`));
  blocks.push(B.divider());

  // Previous Visits
  blocks.push(B.header(':calendar: Previous Visits'));
  if (history.length === 0) {
    blocks.push(B.section(':information_source: No previous visits to this store.'));
  }
  for (const v of history) {
    blocks.push(B.section(
      `*${B.formatDate(v.Visit_Date__c)}* | Order: ${B.formatCurrency(v.Order_Value__c || 0)}${v.Visit_Outcome__c ? '\n_' + v.Visit_Outcome__c + '_' : ''}`
    ));
  }
  blocks.push(B.divider());

  // Previous Orders
  blocks.push(B.header(':package: Recent Orders'));
  if (orders.length === 0) {
    blocks.push(B.section(':information_source: No recent orders.'));
  }
  for (const o of orders) {
    blocks.push(B.section(`*${o.OrderNumber}* | ${B.formatDate(o.EffectiveDate)} | ${B.formatCurrency(o.TotalAmount)} | ${o.Status}`));
  }

  blocks.push(B.divider());

  // Top Products
  blocks.push(B.header(':star: Frequently Bought'));
  if (topProducts.length === 0) {
    blocks.push(B.section(':information_source: No purchase history.'));
  }
  for (const p of topProducts) {
    blocks.push(B.section(`*${p.Product2?.Name || 'Unknown'}* (${p.Product2?.ProductCode || 'N/A'}) | ${p.totalQty} units ordered`));
  }
  blocks.push(B.divider());

  blocks.push(B.context(':bulb: Use this intelligence to suggest relevant products.'));

  return {
    type: 'modal',
    callback_id: 'sfa_noop_modal',
    title: { type: 'plain_text', text: 'Visit Intelligence' },
    close: { type: 'plain_text', text: 'Close' },
    blocks,
  };
}
