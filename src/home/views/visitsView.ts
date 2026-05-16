import * as B from '../../utils/blocks';

export function buildVisitsView(
  visits: any[], storeMap: Map<string, any>, filter: 'today' | 'all',
  activeVisitId: string | null, sort: 'latest' | 'oldest' = 'latest'
): any[] {
  const blocks: any[] = [];

  blocks.push(B.header('Visits'));

  // Top action buttons
  blocks.push(B.actions(
    B.button(':heavy_plus_sign: Create Visit', 'sfa_open_adhoc_visit', undefined, 'primary'),
    B.button(':package: Create Order', 'sfa_open_order_visit_picker', undefined),
  ));
  blocks.push(B.divider());

  // Filter + sort controls
  blocks.push(B.actions(
    B.button("Today's Visits", 'sfa_filter_today', undefined, filter === 'today' ? 'primary' : undefined),
    B.button('All Visits', 'sfa_filter_all', undefined, filter === 'all' ? 'primary' : undefined),
    B.button(':arrows_counterclockwise: Optimize', 'sfa_optimize_route'),
    B.button(sort === 'latest' ? ':arrow_down: Latest First' : ':arrow_up: Oldest First', 'sfa_toggle_visit_sort', sort),
  ));

  const displayed = filter === 'today' ? visits.filter((v: any) => {
    const today = B.todayDateString();
    return v.Visit_Date__c === today || v.PlannedDate__c === today;
  }) : visits;

  const sorted = [...displayed].sort((a, b) => {
    const dateA = new Date(a.CreatedDate || a.Visit_Date__c || a.PlannedDate__c || 0).getTime();
    const dateB = new Date(b.CreatedDate || b.Visit_Date__c || b.PlannedDate__c || 0).getTime();
    return sort === 'latest' ? dateB - dateA : dateA - dateB;
  });

  if (sorted.length === 0) {
    blocks.push(B.context(`0 visits`));
    blocks.push(B.section(':information_source: No visits found.'));
    return blocks;
  }

  blocks.push(B.context(`${sorted.length} visit(s) - sorted by ${sort === 'latest' ? 'newest first' : 'oldest first'}`));
  blocks.push(B.divider());

  for (const visit of sorted) {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'N/A';
    const statusEmoji = visit.Status__c === 'In Progress' ? ':red_circle:' : visit.Status__c === 'Completed' ? ':white_check_mark:' : ':orange_circle:';
    const isActive = visit.Id === activeVisitId;
    const createdAt = visit.CreatedDate ? B.formatDateTime(visit.CreatedDate) : null;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          `*${visit.Name}* - *${storeName}*`,
          `_Planned: ${visit.PlannedDate__c || visit.Visit_Date__c || 'N/A'}_${createdAt ? `  |  Created: ${createdAt}` : ''}`,
          `${statusEmoji} *${visit.Status__c?.toUpperCase() || 'N/A'}*`,
        ].join('\n'),
      },
    });

    const btns: any[] = [];
    btns.push(B.button(':round_pushpin: Navigate', 'sfa_navigate_visit', visit.Id));
    btns.push(B.button(':calendar: Reschedule', 'sfa_reschedule_visit', visit.Id));
    if (!isActive && visit.Status__c !== 'Completed') {
      btns.push(B.button(':white_check_mark: Check In', 'sfa_visit_check_in', visit.Id, 'primary'));
    }
    btns.push(B.button(':eye: Details', 'sfa_view_details', visit.Id));

    if (btns.length > 0) blocks.push(B.actions(...btns.slice(0, 5)));
    if (btns.length > 5) blocks.push(B.actions(...btns.slice(5)));
    blocks.push(B.divider());
  }

  return blocks;
}
