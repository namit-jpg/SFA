import * as B from '../utils/blocks';

export function buildExpenseModal(visitId: string): any {
  return {
    type: 'modal',
    callback_id: 'sfa_expense_submit',
    title: { type: 'plain_text', text: 'Log Expense' },
    submit: { type: 'plain_text', text: 'Save Expense' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks: [
      B.header(':moneybag: Log Visit Expense'),
      B.divider(),
      B.staticSelect(
        'expense_category',
        ':label: Expense Category',
        [
          B.option('Travel', 'Travel'),
          B.option('Food & Beverage', 'Food'),
          B.option('Accommodation', 'Accommodation'),
          B.option('Fuel', 'Fuel'),
          B.option('Parking / Toll', 'Parking'),
          B.option('Miscellaneous', 'Miscellaneous'),
        ],
        'Select category'
      ),
      B.numberInput('expense_amount', ':heavy_dollar_sign: Amount (INR)', 'Enter amount', false, '0'),
      B.divider(),
      {
        type: 'input',
        block_id: 'expense_desc',
        label: { type: 'plain_text', text: 'Description (optional)' },
        element: { type: 'plain_text_input', action_id: 'expense_desc', multiline: true },
        optional: true,
      },
      B.divider(),
      {
        type: 'input',
        block_id: 'expense_receipt',
        label: { type: 'plain_text', text: ':receipt: Upload Receipt (image/PDF)' },
        element: {
          type: 'file_input',
          action_id: 'expense_receipt',
          filetypes: ['jpg', 'jpeg', 'png', 'pdf'],
          max_files: 1,
        },
        optional: true,
      },
      B.context(':information_source: Upload a photo or PDF of your receipt for this expense.'),
    ],
  };
}
