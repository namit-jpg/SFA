import * as B from '../../utils/blocks';

export function buildOrdersView(
  visits: any[], storeMap: Map<string, any>, sort: 'latest' | 'oldest' = 'latest'
): any[] {
  const blocks: any[] = [];

  blocks.push(B.header('Orders'));

  // ─── Top action buttons ───
  blocks.push(B.actions(
    B.button(':package: Create Order', 'sfa_open_order_visit_picker', undefined, 'primary'),
    B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined),
  ));
  blocks.push(B.divider());

  const visitsWithOrders = visits.filter((v: any) => v.Order_Value__c > 0 || v.Order__c);

  if (visitsWithOrders.length === 0) {
    blocks.push(B.section(':information_source: No orders found for your visits today.'));
    return blocks;
  }

  // ─── Sort control ───
  blocks.push(B.actions(
    B.button(sort === 'latest' ? ':arrow_down: Latest First' : ':arrow_up: Oldest First', 'sfa_toggle_order_sort', sort),
  ));

  const sorted = [...visitsWithOrders].sort((a, b) => {
    const dateA = new Date(a.CreatedDate || a.Visit_Date__c || a.PlannedDate__c || 0).getTime();
    const dateB = new Date(b.CreatedDate || b.Visit_Date__c || b.PlannedDate__c || 0).getTime();
    return sort === 'latest' ? dateB - dateA : dateA - dateB;
  });

  blocks.push(B.context(`${sorted.length} order(s) — sorted by ${sort === 'latest' ? 'newest first' : 'oldest first'}`));
  blocks.push(B.divider());

  for (const v of sorted) {
    const store = storeMap.get(v.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'N/A';
    const createdAt = v.CreatedDate ? B.formatDateTime(v.CreatedDate) : B.formatDate(v.Visit_Date__c || v.PlannedDate__c);
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${storeName}*  |  Visit: *${v.Name}*`,
          `Order Value: *${B.formatCurrency(v.Order_Value__c || 0)}*  |  Status: ${v.Status__c}`,
          `Created: ${createdAt}`,
        ].join('\n'),
      },
      accessory: B.button(':package: New Order', 'sfa_create_order', v.Id),
    });
    blocks.push(B.divider());
  }

  return blocks;
}
