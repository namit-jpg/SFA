import * as B from '../utils/blocks';

const DEFAULT_QUESTIONS = [
  { id: 'survey_q1', label: 'Are shelves adequately stocked?', options: ['Yes', 'Partially', 'No'] },
  { id: 'survey_q2', label: 'How engaged were the store staff?', options: ['Highly', 'Moderately', 'Low'] },
  { id: 'survey_q3', label: 'Any competitor stock visible?', options: ['Yes', 'No'] },
  { id: 'survey_q4', label: 'Any delivery/shipping concerns?', options: ['Yes', 'No'] },
  { id: 'survey_q5', label: 'Rate store cleanliness (1-5)', options: ['5 - Excellent', '4 - Good', '3 - Average', '2 - Poor', '1 - Very Poor'] },
  { id: 'survey_q6', label: 'Are promotional materials displayed?', options: ['Yes, prominently', 'Yes, partially', 'No'] },
];

export function buildSurveyModal(visitId: string): any {
  const blocks: any[] = [
    B.header(':clipboard: Visit Survey'),
    B.context('Answer the questions below to capture store insights.'),
    B.divider(),
  B.staticSelect(
    'survey_type',
    'Survey Type',
    [
      B.option('Retailer Feedback', 'Retailer Feedback'),
      B.option('Market Survey', 'Market Survey'),
      B.option('Competitor Info', 'Competitor Info'),
    ],
    'Select survey type'
  ),
    B.divider(),
  ];

  for (const q of DEFAULT_QUESTIONS) {
    blocks.push({
      type: 'input',
      block_id: q.id,
      label: { type: 'plain_text', text: q.label },
      element: {
        type: 'static_select',
        action_id: q.id,
        options: q.options.map(opt => ({
          text: { type: 'plain_text', text: opt, emoji: true },
          value: opt,
        })),
        placeholder: { type: 'plain_text', text: 'Select...' },
      },
      optional: true,
    });
  }

  blocks.push(B.divider());
  blocks.push({
    type: 'input',
    block_id: 'survey_notes',
    label: { type: 'plain_text', text: 'Additional Notes' },
    element: { type: 'plain_text_input', action_id: 'survey_notes', multiline: true },
    optional: true,
  });

  return {
    type: 'modal',
    callback_id: 'sfa_survey_submit',
    title: { type: 'plain_text', text: 'Visit Survey' },
    submit: { type: 'plain_text', text: 'Submit Survey' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: visitId,
    blocks,
  };
}
