import * as B from '../../utils/blocks';
import { config } from '../../config';

export function buildHomeView(
  userName: string, dailyVisits: any[], insights: any,
  completedWeek: number, totalWeek: number, attendanceMarked: boolean
): any[] {
  const blocks: any[] = [];
  const today = B.todayDateString();
  const weekDay = new Date().toLocaleDateString('en-US', { weekday: 'long' });
  const dateStr = new Date().toLocaleDateString('en-US', { weekday: 'long', day: 'numeric', month: 'long', year: 'numeric' });

  blocks.push(B.header(`Good Morning, ${userName}`));
  blocks.push(B.context(`:calendar: ${dateStr}`));
  blocks.push(B.section(
    config.demoMode
      ? ':test_tube: Online • Demo mode (local data)'
      : ':large_green_circle: Online • SFA synced'
  ));
  blocks.push(B.divider());

  // Attendance
  blocks.push(B.header('Mark Attendance'));
  blocks.push(B.context('Start your day'));
  if (!attendanceMarked) {
    blocks.push(B.actions(B.button(':white_check_mark: Check In', 'sfa_check_in_attendance', undefined, 'primary')));
  } else {
    blocks.push(B.section(':white_check_mark: Already checked in for today'));
  }
  blocks.push(B.divider());

  // Performance
  blocks.push(B.header("TODAY'S PERFORMANCE"));
  const pendingToday = dailyVisits.filter((v: any) => v.Status__c !== 'Completed').length;
  const completedToday = dailyVisits.filter((v: any) => v.Status__c === 'Completed').length;
  const totalOrders = dailyVisits.reduce((s: number, v: any) => s + (v.Order_Value__c || 0), 0);

  blocks.push({
    type: 'section',
    text: {
      type: 'mrkdwn',
      text: `*Today's Orders:* ${totalOrders === 0 ? '0 Orders' : B.formatCurrency(totalOrders)}\n*Today's Sales:* ${B.formatCurrency(totalOrders)}\n*Total Visits:* ${dailyVisits.length} | *Completed:* ${completedToday} | *Pending:* ${pendingToday}`,
    },
  });
  blocks.push(B.divider());

  // Insights
  if (insights) {
    blocks.push(B.section(
      `:chart_with_upwards_trend: *Weekly Progress*\n` +
      `Completed: ${completedWeek}/${totalWeek} | Total All-Time: ${insights.totalVisits} | Total Orders: ${B.formatCurrency(insights.totalOrderValue)}`
    ));
    blocks.push(B.divider());
  }

  return blocks;
}
