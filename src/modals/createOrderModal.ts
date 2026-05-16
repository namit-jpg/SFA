import * as B from '../utils/blocks';

export function buildOrderSearchModal(visitId: string, currentItems: any[]): any {
  const blocks: any[] = [];

  blocks.push(B.header(':shopping_trolley: Create Order'));
  blocks.push(B.divider());

  // Current Order Summary
  if (currentItems.length > 0) {
    blocks.push(B.section(`*Current Order (${currentItems.length} items)*`));
    let total = 0;
    for (const item of currentItems) {
      const amt = (item.unitPrice || 0) * (item.quantity || 1);
      total += amt;
      blocks.push(B.section(`${item.name} - Qty: ${item.quantity} - ${B.formatCurrency(amt)}`));
    }
    blocks.push(B.context(`Total: ${B.formatCurrency(total)}`));
    blocks.push(B.divider());
  }

  // Search
  blocks.push(B.externalSelect('order_search_product', ':mag: Search Product', 'Type to search products...', currentItems.length === 0 ? false : true, 1));
  blocks.push(B.numberInput('order_search_qty', ':1234: Quantity', 'Enter quantity', true, '1'));

  // Action picker
  if (currentItems.length > 0) {
    blocks.push(B.divider());
    blocks.push(B.staticSelect('order_action', 'What would you like to do?', [
      B.option(':heavy_plus_sign: Add to cart & continue adding', 'add'),
      B.option(':white_check_mark: Review & place order - done adding', 'review'),
    ], 'Choose action'));
  }

  return {
    type: 'modal',
    callback_id: 'sfa_order_add_item',
    title: { type: 'plain_text', text: 'Create Order' },
    submit: { type: 'plain_text', text: currentItems.length > 0 ? 'Continue' : 'Add to Order' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks,
  };
}

export function buildOrderReviewModal(visitId: string, items: any[]): any {
  const blocks: any[] = [];
  blocks.push(B.header(':white_check_mark: Review Order'));
  blocks.push(B.divider());

  let total = 0;
  for (const item of items) {
    const amt = (item.unitPrice || 0) * (item.quantity || 1);
    total += amt;
    blocks.push(B.section(`*${item.name}*\nQty: ${item.quantity} | Unit Price: ${B.formatCurrency(item.unitPrice)} | Subtotal: ${B.formatCurrency(amt)}`));
  }
  blocks.push(B.divider());
  blocks.push(B.section(`*Total Amount: ${B.formatCurrency(total)}*`));
  blocks.push(B.divider());
  blocks.push(B.context(':information_source: Click Submit to place this order.'));

  return {
    type: 'modal',
    callback_id: 'sfa_order_place',
    title: { type: 'plain_text', text: 'Place Order' },
    submit: { type: 'plain_text', text: 'Place Order' },
    close: { type: 'plain_text', text: 'Go Back' },
    private_metadata: JSON.stringify({ visitId, items }),
    blocks,
  };
}
