import * as B from '../utils/blocks';

export function buildBeatPlanModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_beat_plan_submit',
    title: { type: 'plain_text', text: 'Plan Beat' },
    submit: { type: 'plain_text', text: 'Create Plan' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      B.datePicker('beat_date', 'Visit Date', 'Select date for the beat', false, B.todayDateString()),
      B.staticSelect(
        'beat_type',
        'Beat Type',
        [B.option('Daily', 'Daily'), B.option('Weekly', 'Weekly'), B.option('Ad-hoc', 'Ad-hoc')],
        'Select beat type'
      ),
      B.multiExternalSelect('beat_reps', ':bust_in_silhouette: Assign Reps', 'Search for reps...', false, 1),
      B.multiExternalSelect('beat_stores', ':convenience_store: Select Outlets', 'Search for stores...', false, 1),
      B.timePicker('beat_start_time', 'Start Time', 'E.g., 09:00', true),
      B.timePicker('beat_end_time', 'End Time', 'E.g., 18:00', true),
      {
        type: 'input',
        block_id: 'beat_notes',
        label: { type: 'plain_text', text: 'Notes (optional)' },
        element: { type: 'plain_text_input', action_id: 'beat_notes', multiline: true },
        optional: true,
      },
    ],
  };
}
