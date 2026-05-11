import { RetailStoreRecord } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export function buildManagerHomeView(
  sfUserName: string,
  teamVisits: any[],
  totalOrdersValue: number,
  storeMap: Map<string, RetailStoreRecord>
): any {
  const today = B.todayDateString();
  const blocks: any[] = [];

  function storeName(visit: any): string {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    if (!store) return 'Unknown';
    return store.Account__r?.Name || store.Name;
  }

  blocks.push(B.header(`:office: Manager Dashboard \u2014 ${sfUserName}`));
  blocks.push(B.context(`:calendar: ${B.formatDate(today)}`));
  blocks.push(B.divider());

  blocks.push(B.section(':clipboard: *Beat Planning* \u2014 Assign visits to your team'));
  blocks.push(B.actions(
    B.button(':calendar: Plan Beat', 'sfa_open_beat_plan', undefined, 'primary')
  ));
  blocks.push(B.divider());

  blocks.push(B.header(`:busts_in_silhouette: Team Today (${teamVisits.length} visits)`));

  const activeReps = teamVisits.filter((v: any) => v.Status__c === 'In Progress');
  const completedReps = teamVisits.filter((v: any) => v.Status__c === 'Completed');
  const pendingReps = teamVisits.filter((v: any) =>
    v.Status__c !== 'In Progress' && v.Status__c !== 'Completed'
  );

  if (activeReps.length > 0) {
    const lines = activeReps.map((v: any) => {
      const startTime = v.ActualStartTime__c ? B.formatDuration(v.ActualStartTime__c, new Date().toISOString()) : '';
      const name = storeName(v);
      return `:red_circle: *${v.SFA_User__r?.Name || 'Unknown'}* at *${name}*${startTime ? ` (${startTime})` : ''}`;
    }).join('\n');
    blocks.push(B.section(lines));
  }

  if (completedReps.length > 0) {
    const lines = completedReps.map((v: any) =>
      `:white_check_mark: *${v.SFA_User__r?.Name || 'Unknown'}* \u2014 ${storeName(v)} | :moneybag: ${B.formatCurrency(v.Order_Value__c || 0)}`
    ).join('\n');
    blocks.push(B.section(lines));
  }

  if (pendingReps.length > 0) {
    const pendingByRep: Record<string, number> = {};
    for (const v of pendingReps) {
      const name = v.SFA_User__r?.Name || 'Unknown';
      pendingByRep[name] = (pendingByRep[name] || 0) + 1;
    }
    const lines = Object.entries(pendingByRep)
      .map(([name, count]) => `:black_circle: *${name}* \u2014 ${count} pending`)
      .join('\n');
    blocks.push(B.section(lines));
  }
  blocks.push(B.divider());

  const activeCount = activeReps.length;
  const repSet = new Set(teamVisits.map((v: any) => v.SFA_User__c));
  const totalReps = repSet.size;
  blocks.push(B.section(
    `:chart_with_upwards_trend: *Today's Stats*\n` +
    `\u2022 Reps active: ${activeCount} | Orders: ${B.formatCurrency(totalOrdersValue)}\n` +
    `\u2022 Visits: ${completedReps.length}/${teamVisits.length} done | ${totalReps} reps assigned`
  ));

  blocks.push(B.actions(
    B.button(':arrows_counterclockwise: Refresh', 'sfa_refresh_home')
  ));

  return { type: 'home' as const, blocks };
}
