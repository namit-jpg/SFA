import { VisitRecord, RetailStoreRecord } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export function buildRepHomeView(
  sfaUserName: string,
  activeVisit: VisitRecord | null,
  dailyVisits: VisitRecord[],
  weeklyStats: { completed: number; total: number },
  storeMap: Map<string, RetailStoreRecord>
): any {
  const today = B.todayDateString();
  const todayVisits = dailyVisits.filter(v => v.Visit_Date__c === today || v.PlannedDate__c === today);
  const blocks: any[] = [];

  function storeName(visit: VisitRecord): string {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    return store?.Name || 'Unknown Store';
  }

  blocks.push(B.header(`:wave: Hey ${sfaUserName}, welcome to SFA`));
  blocks.push(B.context(`:calendar: ${B.formatDate(today)} | ${weeklyStats.completed}/${weeklyStats.total} visits done this week`));
  blocks.push(B.divider());

  if (activeVisit) {
    const name = storeName(activeVisit);
    const startTime = activeVisit.ActualStartTime__c;
    const duration = startTime ? B.formatDuration(startTime, new Date().toISOString()) : '';

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:red_circle: *ACTIVE VISIT*\n*${name}*${duration ? ` | :stopwatch: ${duration}` : ''}`,
      },
    });

    blocks.push(B.actions(
      B.button(':shopping_trolley: Create Order', 'sfa_create_order', activeVisit.Id, 'primary'),
      B.button(':clipboard: Fill Survey', 'sfa_open_survey', activeVisit.Id),
      B.button(':moneybag: Log Expense', 'sfa_open_expense', activeVisit.Id),
      B.button(':white_check_mark: End Visit', 'sfa_end_visit', activeVisit.Id, 'danger')
    ));
    blocks.push(B.divider());
  }

  const pendingToday = todayVisits.filter(v => v.Status__c !== 'Completed');
  const completedToday = todayVisits.filter(v => v.Status__c === 'Completed');

  if (pendingToday.length > 0) {
    blocks.push(B.header(`:spiral_calendar_pad: Today's Plan (${pendingToday.length} pending)`));
    for (const visit of pendingToday) {
      const name = storeName(visit);
      const timeStr = visit.Planned_Start_Time__c ? B.formatTime(visit.Planned_Start_Time__c) : '--:--';
      const statusEmoji = visit.Status__c === 'In Progress' ? ':red_circle:' : ':black_circle:';

      blocks.push(B.section(
        `${statusEmoji} *${timeStr}* | ${name}`,
        visit.Status__c !== 'In Progress'
          ? B.button('Start Visit', 'sfa_start_visit', visit.Id, 'primary')
          : undefined
      ));
    }
    blocks.push(B.divider());
  }

  if (completedToday.length > 0) {
    blocks.push(B.section(`:white_check_mark: *Completed (${completedToday.length})*`));
    for (const visit of completedToday) {
      blocks.push(B.section(`:white_check_mark: ${storeName(visit)} | :moneybag: ${B.formatCurrency(visit.Order_Value__c)}`));
    }
    blocks.push(B.divider());
  }

  blocks.push(B.section(`:bar_chart: *This Week:* ${weeklyStats.completed}/${weeklyStats.total} visits completed`));

  blocks.push(B.actions(
    B.button(':heavy_plus_sign: New Ad-hoc Visit', 'sfa_open_adhoc_visit', undefined, 'primary'),
    B.button(':arrows_counterclockwise: Refresh', 'sfa_refresh_home')
  ));

  return { type: 'home' as const, blocks };
}
