import * as B from '../utils/blocks';

export function buildCreateOrderModal(visitId: string, isSecondary: boolean = false): any {
  const blocks: any[] = [
    B.header(`:shopping_trolley: ${isSecondary ? 'Additional Order' : 'Create Order'}`),
    B.divider(),
  ];

  for (let i = 1; i <= 8; i++) {
    blocks.push({
      type: 'section',
      text: { type: 'mrkdwn', text: `*Product ${i}*` },
    });
    blocks.push(B.externalSelect(`order_product_${i}`, `Product ${i}`, 'Search for a product...', true, 1));
    blocks.push(B.numberInput(`order_qty_${i}`, 'Quantity', 'Enter quantity', true, i === 1 ? '1' : undefined));
    if (i < 8) blocks.push(B.divider());
  }

  blocks.push(B.divider());
  blocks.push({
    type: 'input', block_id: 'order_notes',
    label: { type: 'plain_text', text: 'Order Notes (optional)' },
    element: { type: 'plain_text_input', action_id: 'order_notes', multiline: true },
    optional: true,
  });

  return {
    type: 'modal',
    callback_id: 'sfa_create_order_submit',
    title: { type: 'plain_text', text: isSecondary ? 'Additional Order' : 'Create Order' },
    submit: { type: 'plain_text', text: 'Place Order' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks,
  };
}
