import * as B from '../utils/blocks';

export function buildCompetingProductsModal(visitId: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_competing_submit',
    title: { type: 'plain_text', text: 'Competing Products' },
    submit: { type: 'plain_text', text: 'Submit All Records' },
    close: { type: 'plain_text', text: 'Close' },
    private_metadata: visitId,
    blocks: [
      B.header(':memo: Competing Products'),
      B.context('Record competitor products observed during this visit.'),
      B.divider(),
      B.textInput('comp_name_1', 'Product Name*', 'e.g. Ultra Gloss Paint'),
      B.textInput('comp_brand_1', 'Brand', 'e.g. Asian Paints'),
      B.textInput('comp_price_1', 'Price (₹)', '0.00'),
      B.textInput('comp_remarks_1', 'Remarks', 'Any observations...', true, true),
      B.divider(),
      B.textInput('comp_name_2', 'Product Name', 'Another product...', true),
      B.textInput('comp_brand_2', 'Brand', '', true),
      B.textInput('comp_price_2', 'Price (₹)', '', true),
      B.textInput('comp_remarks_2', 'Remarks', '', true, true),
      B.divider(),
      B.textInput('comp_name_3', 'Product Name', 'Another product...', true),
      B.textInput('comp_brand_3', 'Brand', '', true),
      B.textInput('comp_price_3', 'Price (₹)', '', true),
      B.textInput('comp_remarks_3', 'Remarks', '', true, true),
    ],
  };
}

export function buildVisitNotesModal(visitId: string, currentNote: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_notes_submit',
    title: { type: 'plain_text', text: 'Visit Notes' },
    submit: { type: 'plain_text', text: 'Save Note' },
    close: { type: 'plain_text', text: 'Close' },
    private_metadata: visitId,
    blocks: [
      B.header(':pencil2: Visit Notes'),
      B.divider(),
      {
        type: 'input',
        block_id: 'note_text',
        label: { type: 'plain_text', text: 'Note' },
        element: {
          type: 'plain_text_input',
          action_id: 'note_text',
          multiline: true,
          initial_value: currentNote || '',
        },
      },
    ],
  };
}

export function buildRescheduleModal(visitId: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_reschedule_submit',
    title: { type: 'plain_text', text: 'Reschedule Visit' },
    submit: { type: 'plain_text', text: 'Reschedule' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks: [
      B.header(':calendar: Reschedule Visit'),
      B.divider(),
      B.datePicker('reschedule_date', 'New Date', 'Select date'),
      B.staticSelect('reschedule_reason', 'Reason', [
        B.option('Customer Unavailable', 'Customer Unavailable'),
        B.option('Store Closed', 'Store Closed'),
        B.option('Emergency', 'Emergency'),
        B.option('Other', 'Other'),
      ], 'Select reason'),
    ],
  };
}
