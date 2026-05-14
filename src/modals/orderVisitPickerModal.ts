export function buildOrderVisitPickerModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_pick_visit_for_order_submit',
    title: { type: 'plain_text', text: 'Create Order' },
    submit: { type: 'plain_text', text: 'Next' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      {
        type: 'section',
        text: { type: 'mrkdwn', text: "Select a visit to create an order for. Only today's planned or in-progress visits are shown." },
      },
      {
        type: 'input',
        block_id: 'order_visit_picker',
        label: { type: 'plain_text', text: ':calendar: Select Visit' },
        element: {
          type: 'external_select',
          action_id: 'order_visit_picker',
          placeholder: { type: 'plain_text', text: 'Search visits by store name...' },
          min_query_length: 0,
        },
      },
    ],
  };
}
