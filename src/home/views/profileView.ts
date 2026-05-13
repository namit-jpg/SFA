import * as B from '../../utils/blocks';

export function buildProfileView(userName: string, insights: any): any[] {
  const blocks: any[] = [];
  blocks.push(B.header('Profile'));
  blocks.push(B.divider());

  blocks.push(B.section(`:bust_in_silhouette: *${userName}*`));
  blocks.push(B.section(
    `:chart_with_upwards_trend: *Stats*\n` +
    `Total Visits: ${insights?.totalVisits || 0}\n` +
    `This Week: ${insights?.thisWeekVisits || 0}\n` +
    `Total Orders: ${B.formatCurrency(insights?.totalOrderValue || 0)}\n` +
    `Avg Order: ${B.formatCurrency(insights?.avgOrderValue || 0)}`
  ));
  blocks.push(B.divider());
  blocks.push(B.actions(
    B.button(':arrows_counterclockwise: Refresh', 'sfa_refresh_home'),
  ));

  return blocks;
}
