import * as B from '../../utils/blocks';

export function buildVisitInsightsView(
  storeName: string, history: any[], freqProducts: any[], lastOrder: any | null, logs: any[]
): any[] {
  const blocks: any[] = [];

  blocks.push(B.header('Visit 360 Insights'));
  blocks.push(B.actions(B.button(':arrow_left: Back to Visit Details', 'sfa_back_to_details')));
  blocks.push(B.divider());

  // Account name
  blocks.push(B.section(`*Store:* ${storeName}`));
  blocks.push(B.divider());

  // Metrics
  blocks.push(B.header('METRICS'));
  blocks.push(B.section(
    `:calendar: *Visits:* ${history.length} | :moneybag: *Last Total:* ${B.formatCurrency(lastOrder?.TotalAmount || 0)}`
  ));
  blocks.push(B.divider());

  // Frequently Ordered
  blocks.push(B.header(':star: FREQUENTLY ORDERED'));
  if (freqProducts.length === 0) {
    blocks.push(B.section('_No purchase history_'));
  }
  for (const p of freqProducts) {
    blocks.push(B.section(
      `*${p.Product2?.Name || 'Unknown'}* — ${B.formatCurrency(0)} — Min Order Qty (Sec): ${p.totalQty || 1}`
    ));
  }
  blocks.push(B.divider());

  // Last Order Summary
  if (lastOrder) {
    blocks.push(B.header('LAST ORDER SUMMARY'));
    blocks.push(B.section(
      `*Order Number:* #${lastOrder.OrderNumber}\n*Total Amount:* ${B.formatCurrency(lastOrder.TotalAmount || 0)}`
    ));
    if (lastOrder.items) {
      for (const item of lastOrder.items) {
        blocks.push(B.section(
          `*${item.Product2?.Name || 'Item'}* — Qty: ${item.Quantity} — ${B.formatCurrency(item.UnitPrice || 0)}`
        ));
      }
    }
    blocks.push(B.divider());
  }

  // Detailed Visit Logs
  blocks.push(B.header('DETAILED VISIT LOGS'));
  if (logs.length === 0) {
    blocks.push(B.section('_No visit logs_'));
  }
  for (const l of logs) {
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${l.Name}*\n${l.SFA_User__r?.Name || 'Unknown'} • ${l.Type__c || 'N/A'}\nStatus: ${l.Status__c || 'N/A'}\nScheduled: ${B.formatDate(l.Planned_Start_Time__c || l.Visit_Date__c)}\nActual: ${l.ActualStartTime__c ? B.formatDateTime(l.ActualStartTime__c) : 'Not started'}`,
      },
    });
    blocks.push(B.divider());
  }

  return blocks;
}
