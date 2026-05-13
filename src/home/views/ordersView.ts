import * as B from '../../utils/blocks';

export function buildOrdersView(visits: any[], storeMap: Map<string, any>): any[] {
  const blocks: any[] = [];
  blocks.push(B.header('Orders'));
  blocks.push(B.divider());

  const visitsWithOrders = visits.filter((v: any) => v.Order_Value__c > 0 || v.Order__c);

  if (visitsWithOrders.length === 0) {
    blocks.push(B.section(':information_source: No orders found for your visits.'));
    return blocks;
  }

  for (const v of visitsWithOrders) {
    const store = storeMap.get(v.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'N/A';
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${storeName}*\nVisit: ${v.Name} | Order Value: ${B.formatCurrency(v.Order_Value__c || 0)}\nStatus: ${v.Status__c} | Date: ${B.formatDate(v.Visit_Date__c || v.PlannedDate__c)}`,
      },
    });
    blocks.push(B.divider());
  }

  return blocks;
}
