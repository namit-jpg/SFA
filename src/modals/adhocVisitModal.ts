import * as B from '../utils/blocks';

export function buildAdhocVisitModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_adhoc_visit_submit',
    title: { type: 'plain_text', text: 'New Ad-hoc Visit' },
    submit: { type: 'plain_text', text: 'Create Visit' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      B.header(':heavy_plus_sign: Create Unplanned Visit'),
      B.context('Quickly create a visit to a store not in your planned beat.'),
      B.divider(),
      B.externalSelect('adhoc_store', ':convenience_store: Select Outlet', 'Search for store by name...', false, 1),
      B.datePicker('adhoc_date', ':calendar: Visit Date', 'Select date', false, B.todayDateString()),
      B.staticSelect(
        'adhoc_purpose',
        ':dart: Purpose',
        [
          B.option('Sales Visit', 'Sales Visit'),
          B.option('Delivery', 'Delivery'),
          B.option('Merchandising', 'Merchandising'),
          B.option('Complaint Resolution', 'Complaint Resolution'),
          B.option('Collection', 'Collection'),
          B.option('Relationship Building', 'Relationship Building'),
          B.option('Other', 'Other'),
        ],
        'Select purpose'
      ),
      {
        type: 'input',
        block_id: 'adhoc_notes',
        label: { type: 'plain_text', text: 'Notes (optional)' },
        element: { type: 'plain_text_input', action_id: 'adhoc_notes', multiline: true },
        optional: true,
      },
    ],
  };
}
