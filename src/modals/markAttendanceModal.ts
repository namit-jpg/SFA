import * as B from '../utils/blocks';

export function buildMarkAttendanceModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_attendance_submit',
    title: { type: 'plain_text', text: 'Mark Attendance' },
    submit: { type: 'plain_text', text: 'Check In' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      B.header(':camera: Mark Attendance'),
      B.context('Upload a selfie to mark your attendance for today.'),
      B.divider(),
      {
        type: 'input',
        block_id: 'attendance_selfie',
        label: { type: 'plain_text', text: ':camera_with_flash: Upload Selfie' },
        element: {
          type: 'file_input',
          action_id: 'attendance_selfie',
          filetypes: ['jpg', 'jpeg', 'png'],
          max_files: 1,
        },
      },
      B.divider(),
      B.context(':lock: Your selfie is stored securely for verification purposes.'),
    ],
  };
}

export function buildDailyVisitsView(
  visits: any[],
  storeMap: Map<string, any>,
  activeVisitId: string | null,
  attendanceMarked: boolean
): any {
  const blocks: any[] = [];
  blocks.push(B.header(':spiral_calendar_pad: Your Visits for Today'));
  if (!attendanceMarked) {
    blocks.push(B.context(':warning: Mark attendance first to enable visits.'));
  }
  blocks.push(B.divider());

  for (const visit of visits) {
    const store = storeMap.get(visit.Retail_Store_Custom__c);
    const storeName = store?.Account__r?.Name || store?.Name || 'Unknown';
    const timeStr = visit.Planned_Start_Time__c ? B.formatTime(visit.Planned_Start_Time__c) : '--:--';
    const isActive = visit.Id === activeVisitId;
    const isPending = visit.Status__c !== 'Completed';

    const elements: any[] = [];

    if (store?.Location__c) {
      elements.push(
        B.button(':round_pushpin: Maps', 'sfa_open_maps', store.Id)
      );
    }
    if (isPending) {
      if (isActive) {
        elements.push(B.button(':red_circle: Active', 'sfa_noop', undefined));
      } else if (attendanceMarked && !activeVisitId) {
        elements.push(B.button('Start Visit', 'sfa_start_visit', visit.Id, 'primary'));
      } else {
        elements.push(B.button(':lock: Locked', 'sfa_noop', undefined));
      }
    }

    const emoji = isActive ? ':red_circle:' : (visit.Status__c === 'Completed' ? ':white_check_mark:' : ':black_circle:');
    blocks.push({
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${timeStr}* | ${storeName}${visit.Status__c === 'Completed' ? ` | ${B.formatCurrency(visit.Order_Value__c || 0)}` : ''}`,
      },
      ...(elements.length > 0 ? { accessory: elements[0] } : {}),
    });

    if (elements.length > 1) {
      blocks.push(B.actions(...elements));
    }
  }

  blocks.push(B.divider());
  blocks.push(B.actions(
    B.button(':arrow_backward: Back to Home', 'sfa_refresh_home'),
  ));

  return { type: 'home' as const, blocks };
}
