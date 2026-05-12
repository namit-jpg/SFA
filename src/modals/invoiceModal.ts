import * as B from '../utils/blocks';

export function buildProcessInvoiceModal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_bulk_invoice_submit',
    title: { type: 'plain_text', text: 'Process Invoice' },
    submit: { type: 'plain_text', text: 'Check & Process' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      B.header(':receipt: Bulk Invoice Processing'),
      B.divider(),
      {
        type: 'input', block_id: 'invoice_visit',
        label: { type: 'plain_text', text: 'Visit ID or Order Number' },
        element: {
          type: 'plain_text_input', action_id: 'invoice_visit',
          placeholder: { type: 'plain_text', text: 'Enter order number or leave blank for active visit' },
        },
        optional: true,
      },
      B.divider(),
      B.context(':information_source: System will check stock availability for all line items.\nPartial processing if some items are out of stock.\nBlocked if no stock available.'),
    ],
  };
}
