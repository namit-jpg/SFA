import * as B from '../utils/blocks';

export function buildCreateOrderModal(visitId: string, isSecondary: boolean = false): any {
  const title = isSecondary ? 'Additional Order' : 'Create Order';
  const callback = isSecondary ? 'sfa_create_order_submit' : 'sfa_create_order_submit';

  return {
    type: 'modal',
    callback_id: callback,
    title: { type: 'plain_text', text: title },
    submit: { type: 'plain_text', text: 'Place Order' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks: [
      B.header(`:shopping_trolley: *${isSecondary ? 'Create Additional Order' : 'Add products to order'}*`),
      B.divider(),
      B.externalSelect('order_product_1', 'Product 1', 'Search for a product...', true, 1),
      B.numberInput('order_qty_1', 'Quantity', 'Enter quantity', true, '1'),
      B.divider(),
      B.externalSelect('order_product_2', 'Product 2', 'Search for a product...', true, 1),
      B.numberInput('order_qty_2', 'Quantity', 'Enter quantity', true),
      B.divider(),
      B.externalSelect('order_product_3', 'Product 3', 'Search for a product...', true, 1),
      B.numberInput('order_qty_3', 'Quantity', 'Enter quantity', true),
      B.divider(),
      B.externalSelect('order_product_4', 'Product 4', 'Search for a product...', true, 1),
      B.numberInput('order_qty_4', 'Quantity', 'Enter quantity', true),
      B.divider(),
      B.externalSelect('order_product_5', 'Product 5', 'Search for a product...', true, 1),
      B.numberInput('order_qty_5', 'Quantity', 'Enter quantity', true),
      B.divider(),
      {
        type: 'input',
        block_id: 'order_notes',
        label: { type: 'plain_text', text: 'Order Notes (optional)' },
        element: { type: 'plain_text_input', action_id: 'order_notes', multiline: true },
        optional: true,
      },
    ],
  };
}
