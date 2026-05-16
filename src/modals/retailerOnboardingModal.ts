import * as B from '../utils/blocks';

export function buildOnboardingStep1Modal(): any {
  return {
    type: 'modal',
    callback_id: 'sfa_onboarding_step1_submit',
    title: { type: 'plain_text', text: 'Retailer Onboarding' },
    submit: { type: 'plain_text', text: 'Next' },
    close: { type: 'plain_text', text: 'Cancel' },
    blocks: [
      B.header(':new: Retailer Onboarding - Step 1/3'),
      B.context('Business & Contact Information'),
      B.divider(),
      B.textInput('onb_first_name', 'First Name', 'First name'),
      B.textInput('onb_last_name', 'Last Name', 'Last name'),
      B.textInput('onb_enterprise', 'Enterprise / Company Name', 'Business name'),
      B.textInput('onb_phone', 'Phone', 'e.g. +91-9876543210'),
      B.textInput('onb_email', 'Email', 'email@example.com'),
      B.textInput('onb_website', 'Company Website (optional)', 'https://...', true),
      B.textInput('onb_year_est', 'Year Established', 'e.g. 2015', true),
      B.divider(),
      B.staticSelect('onb_biz_type', 'Business Type', [
        B.option('Individual', 'Individual'), B.option('Partnership', 'Partnership'),
        B.option('Private', 'Private'), B.option('Public', 'Public'), B.option('Other', 'Other'),
      ], 'Select type'),
    ],
  };
}

export function buildOnboardingStep2Modal(existingData?: string): any {
  const blocks: any[] = [
    B.header(':house: Step 2/3 - Store Details'),
    B.divider(),
    B.textInput('onb_street', 'Street Address', '123 Main St'),
    B.textInput('onb_city', 'City', 'Mumbai'),
    B.textInput('onb_state', 'State', 'Maharashtra'),
    B.textInput('onb_postal', 'Postal Code', '400001'),
    B.textInput('onb_country', 'Country', 'India'),
    B.textInput('onb_store_area', 'Store Area (sq ft)', 'e.g. 500', true),
    B.staticSelect('onb_store_type', 'Store Type', [
      B.option('Regular Store', 'Regular Store'), B.option('Flagship Store', 'Flagship Store'),
      B.option('Virtual Store', 'Virtual Store'), B.option('Van Store', 'Van Store'),
    ], 'Select store type', true),
    B.divider(),
    B.textInput('onb_opening_date', 'Expected Opening Date (YYYY-MM-DD)', '2026-06-01', true),
  ];
  return {
    type: 'modal', callback_id: 'sfa_onboarding_step2_submit',
    title: { type: 'plain_text', text: 'Retailer Onboarding' },
    submit: { type: 'plain_text', text: 'Next' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: existingData || '{}',
    blocks,
  };
}

export function buildOnboardingStep3Modal(existingData?: string): any {
  const blocks: any[] = [
    B.header(':page_facing_up: Step 3/3 - Documents & Banking'),
    B.divider(),
    B.textInput('onb_pan', 'PAN Card Number', 'ABCDE1234F'),
    B.textInput('onb_gst', 'GST Number', '22AAAAA0000A1Z5'),
    B.textInput('onb_aadhar', 'Aadhar Number', '123456789012', true),
    B.divider(),
    B.textInput('onb_bank_name', 'Bank Name', 'State Bank of India'),
    B.textInput('onb_bank_ac', 'Bank Account Number', '12345678901'),
    B.textInput('onb_ifsc', 'IFSC Code', 'SBIN0001234'),
    B.divider(),
    B.context(':information_source: All documents will be verified by the finance team.'),
  ];
  return {
    type: 'modal', callback_id: 'sfa_onboarding_step3_submit',
    title: { type: 'plain_text', text: 'Retailer Onboarding' },
    submit: { type: 'plain_text', text: 'Submit' },
    close: { type: 'plain_text', text: 'Cancel' },
    private_metadata: existingData || '{}',
    blocks,
  };
}
