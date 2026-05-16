import { VisitRecord, RetailStoreRecord } from '../../salesforce/soql';
import * as B from '../../utils/blocks';

export interface VisitInsights {
  totalVisits: number;
  thisWeekVisits: number;
  totalOrderValue: number;
  avgOrderValue: number;
  lastVisitDate: string | null;
  lastStore: string | null;
}

export function buildRepHomeView(
  sfaUserName: string,
  activeVisit: VisitRecord | null,
  dailyVisits: VisitRecord[],
  weeklyStats: { completed: number; total: number },
  storeMap: Map<string, RetailStoreRecord>,
  insights: VisitInsights | null,
  attendanceMarked: boolean
): any {
  const today = B.todayDateString();
  const todayVisits = dailyVisits.filter(v => v.Visit_Date__c === today || v.PlannedDate__c === today);
  const blocks: any[] = [];

  function storeName(visit: VisitRecord): string {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    if (!store) return 'N/A';
    return store.Account__r?.Name || store.Name;
  }

  blocks.push(B.header(`:wave: Hey ${sfaUserName}, welcome to SFA`));

  // Visit Insights
  if (insights) {
    const lines = [
      `*:chart_with_upwards_trend: Visit Insights*`,
      `:white_check_mark: Total: ${insights.totalVisits} | This week: ${insights.thisWeekVisits}`,
      `:moneybag: Total Orders: ${B.formatCurrency(insights.totalOrderValue)} | Avg: ${B.formatCurrency(insights.avgOrderValue)}`,
      insights.lastVisitDate ? `:calendar: Last: ${B.formatDate(insights.lastVisitDate)} at *${insights.lastStore || 'N/A'}*` : null,
    ].filter(Boolean).join('\n');
    blocks.push({ type: 'section', text: { type: 'mrkdwn', text: lines } });
  }

  blocks.push(B.context(`:calendar: ${B.formatDate(today)} | ${weeklyStats.completed}/${weeklyStats.total} visits this week`));
  blocks.push(B.divider());

  // Quick Actions Row
  const quickActions: any[] = [];

  if (!attendanceMarked) {
    quickActions.push(B.button(':camera: Mark Attendance', 'sfa_mark_attendance', undefined, 'primary'));
  }
  quickActions.push(B.button(':new: Retailer Onboarding', 'sfa_open_onboarding'));

  blocks.push(B.actions(...quickActions));
  blocks.push(B.divider());

  // Active Visit Section
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
      B.button(':moneybag: Expense', 'sfa_open_expense', activeVisit.Id),
      B.button(':white_check_mark: End Visit', 'sfa_end_visit', activeVisit.Id, 'danger'),
    ));
    blocks.push(B.divider());
  }

  // Today's Plan
  const pendingToday = todayVisits.filter(v => v.Status__c !== 'Completed');
  const completedToday = todayVisits.filter(v => v.Status__c === 'Completed');

  if (pendingToday.length > 0) {
    blocks.push(B.header(`:spiral_calendar_pad: Today's Plan (${pendingToday.length} pending)`));
    for (const visit of pendingToday) {
      const name = storeName(visit);
      const timeStr = visit.Planned_Start_Time__c ? B.formatTime(visit.Planned_Start_Time__c) : '--:--';
      const isInProgress = visit.Status__c === 'In Progress';

      const elements: any[] = [];
      if (attendanceMarked && !isInProgress) {
        if (!activeVisit) {
          elements.push(B.button('Start Visit', 'sfa_start_visit', visit.Id, 'primary'));
        } else {
          elements.push(B.button(':lock:', 'sfa_noop', undefined));
        }
      }

      blocks.push({
        type: 'section',
        text: {
          type: 'mrkdwn',
          text: `${isInProgress ? ':red_circle:' : ':black_circle:'} *${timeStr}* | ${name}`,
        },
        ...(elements.length > 0 ? { accessory: elements[0] } : {}),
      });
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
    B.button(':arrows_counterclockwise: Refresh', 'sfa_refresh_home')
  ));

  return { type: 'home' as const, blocks };
}
