import * as B from '../utils/blocks';

export function buildReturnModal(visitId: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_return_submit',
    title: { type: 'plain_text', text: 'Create Return' },
    submit: { type: 'plain_text', text: 'Submit Return' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks: [
      B.header(':leftwards_arrow_with_hook: Create Return Order'),
      B.divider(),
      B.externalSelect('return_product_1', 'Product 1', 'Search product...', true, 1),
      B.numberInput('return_qty_1', 'Return Quantity', 'Qty', true, '1'),
      B.textInput('return_reason_1', 'Reason', 'e.g. Damaged', true),
      B.divider(),
      B.externalSelect('return_product_2', 'Product 2', 'Search product...', true, 1),
      B.numberInput('return_qty_2', 'Return Quantity', 'Qty', true),
      B.textInput('return_reason_2', 'Reason', 'e.g. Expired', true),
      B.divider(),
      B.staticSelect('return_type', 'Return Type', [
        B.option('Primary', 'Primary'), B.option('Secondary', 'Secondary'),
      ], 'Select type'),
      B.divider(),
      {
        type: 'input', block_id: 'return_desc',
        label: { type: 'plain_text', text: 'Description' },
        element: { type: 'plain_text_input', action_id: 'return_desc', multiline: true },
        optional: true,
      },
    ],
  };
}

export function buildClaimModal(visitId: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_claim_submit',
    title: { type: 'plain_text', text: 'File Claim' },
    submit: { type: 'plain_text', text: 'Submit Claim' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks: [
      B.header(':memo: File a Claim'),
      B.divider(),
      B.staticSelect('claim_type', 'Claim Type', [
        B.option('Scheme Claims', 'Scheme Claims'),
        B.option('Purchase Return Claims', 'Purchase Return Claims'),
        B.option('Sales Return Claims', 'Sales Return Claims'),
        B.option('Marketing Support Claims', 'Marketing Support Claims'),
      ], 'Select claim type'),
      B.numberInput('claim_amount', ':moneybag: Claim Amount (INR)', 'Enter amount', false, '0'),
      B.divider(),
      {
        type: 'input', block_id: 'claim_desc',
        label: { type: 'plain_text', text: 'Description' },
        element: { type: 'plain_text_input', action_id: 'claim_desc', multiline: true },
        optional: true,
      },
      B.context(':information_source: Claims will be reviewed by the finance team.'),
    ],
  };
}
