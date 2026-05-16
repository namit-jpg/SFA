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
          B.option('Order Taking', 'Order Taking'),
          B.option('Stock Check', 'Stock Check'),
          B.option('Payment Collection', 'Payment Collection'),
          B.option('Scheme Discussion', 'Scheme Discussion'),
          B.option('Asset Audit', 'Asset Audit'),
          B.option('New Product Launch', 'New Product Launch'),
          B.option('Complaint Resolution', 'Complaint Resolution'),
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
