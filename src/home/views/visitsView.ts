import * as B from '../../utils/blocks';

export function buildVisitsView(
  visits: any[], storeMap: Map<string, any>, filter: 'today' | 'all', activeVisitId: string | null
): any[] {
  const blocks: any[] = [];

  blocks.push(B.header('Visits'));

  const filterActions = [
    B.button("Today's Visits", 'sfa_filter_today', undefined, filter === 'today' ? 'primary' : undefined),
    B.button('All Visits', 'sfa_filter_all', undefined, filter === 'all' ? 'primary' : undefined),
    B.button(':arrows_counterclockwise: Optimize', 'sfa_optimize_route'),
  ];
  blocks.push(B.actions(...filterActions));

  const displayed = filter === 'today' ? visits.filter((v: any) => {
    const today = B.todayDateString();
    return v.Visit_Date__c === today || v.PlannedDate__c === today;
  }) : visits;

  if (displayed.length === 0) {
    blocks.push(B.divider());
    blocks.push(B.section(':information_source: No visits found.'));
    return blocks;
  }

  blocks.push(B.context(`${displayed.length} visit(s)`));
  blocks.push(B.divider());

  for (const visit of displayed) {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'N/A';
    const statusEmoji = visit.Status__c === 'In Progress' ? ':red_circle:' : visit.Status__c === 'Completed' ? ':white_check_mark:' : ':orange_circle:';
    const isActive = visit.Id === activeVisitId;

    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `*${visit.Name}*\n*${storeName}*\n_Planned: ${visit.PlannedDate__c || visit.Visit_Date__c || 'N/A'}_\n${statusEmoji} *${visit.Status__c?.toUpperCase() || 'N/A'}*`,
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
