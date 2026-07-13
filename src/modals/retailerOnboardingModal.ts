import * as B from '../utils/blocks';

/** Slack channel that receives onboarding approval requests (demo). */
export const ONBOARDING_APPROVAL_CHANNEL = 'C0BGS8SN4CV';

export type OnboardingFormData = Record<string, any>;

function field(label: string, value: string | undefined | null): string {
  const v = (value ?? '').toString().trim();
  return `*${label}:* ${v || '—'}`;
}

function maskAccount(account: string | undefined): string {
  const a = (account || '').trim();
  if (a.length <= 4) return a || '—';
  return `${'•'.repeat(Math.min(a.length - 4, 8))}${a.slice(-4)}`;
}

/** Compact payload stored on Approve/Reject button values (Slack 2000 char limit). */
export function buildOnboardingApprovalValue(data: OnboardingFormData, submittedBy: string): string {
  return JSON.stringify({
    enterprise: data.onb_enterprise || 'Unknown',
    name: [data.onb_first_name, data.onb_last_name].filter(Boolean).join(' ') || 'N/A',
    phone: data.onb_phone || '',
    email: data.onb_email || '',
    city: data.onb_city || '',
    submittedBy,
  });
}

export function parseOnboardingApprovalValue(raw: string | undefined): {
  enterprise: string;
  name: string;
  phone: string;
  email: string;
  city: string;
  submittedBy: string;
} {
  try {
    const p = JSON.parse(raw || '{}');
    return {
      enterprise: p.enterprise || 'Unknown',
      name: p.name || 'N/A',
      phone: p.phone || '',
      email: p.email || '',
      city: p.city || '',
      submittedBy: p.submittedBy || '',
    };
  } catch {
    return { enterprise: 'Unknown', name: 'N/A', phone: '', email: '', city: '', submittedBy: '' };
  }
}

/**
 * Rich Block Kit message for the approval channel after a retailer submits onboarding.
 * Includes Approve / Reject actions (Slack-only demo flow).
 */
export function buildOnboardingApprovalMessage(data: OnboardingFormData, submittedBy: string): any[] {
  const fullName = [data.onb_first_name, data.onb_last_name].filter(Boolean).join(' ') || 'N/A';
  const enterprise = data.onb_enterprise || 'N/A';
  const address = [data.onb_street, data.onb_city, data.onb_state, data.onb_postal, data.onb_country || 'India']
    .filter(Boolean)
    .join(', ');
  const buttonValue = buildOnboardingApprovalValue(data, submittedBy);

  return [
    {
      type: 'header',
      text: { type: 'plain_text', text: 'New Retailer Onboarding Request', emoji: true },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `:store: *${enterprise}*\nSubmitted by <@${submittedBy}>  ·  Pending approval`,
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: field('Contact', fullName) },
        { type: 'mrkdwn', text: field('Business Type', data.onb_biz_type) },
        { type: 'mrkdwn', text: field('Phone', data.onb_phone) },
        { type: 'mrkdwn', text: field('Email', data.onb_email) },
        { type: 'mrkdwn', text: field('Year Established', data.onb_year_est) },
        { type: 'mrkdwn', text: field('Website', data.onb_website) },
      ],
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: [
          field('Address', address),
          field('Store Type', data.onb_store_type),
          field('Store Area', data.onb_store_area ? `${data.onb_store_area} sq ft` : undefined),
          field('Expected Opening', data.onb_opening_date),
        ].join('\n'),
      },
    },
    { type: 'divider' },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: field('PAN', data.onb_pan) },
        { type: 'mrkdwn', text: field('GST', data.onb_gst) },
        { type: 'mrkdwn', text: field('Bank', data.onb_bank_name) },
        { type: 'mrkdwn', text: field('Account', maskAccount(data.onb_bank_ac)) },
        { type: 'mrkdwn', text: field('IFSC', data.onb_ifsc) },
        { type: 'mrkdwn', text: field('Aadhar', data.onb_aadhar ? `••••${String(data.onb_aadhar).slice(-4)}` : undefined) },
      ],
    },
    { type: 'divider' },
    {
      type: 'actions',
      block_id: 'onboarding_approval_actions',
      elements: [
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Approve', emoji: true },
          style: 'primary',
          action_id: 'sfa_onboarding_approve',
          value: buttonValue,
          confirm: {
            title: { type: 'plain_text', text: 'Approve retailer?' },
            text: { type: 'mrkdwn', text: `Approve *${enterprise}* for onboarding?` },
            confirm: { type: 'plain_text', text: 'Approve' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        },
        {
          type: 'button',
          text: { type: 'plain_text', text: 'Reject', emoji: true },
          style: 'danger',
          action_id: 'sfa_onboarding_reject',
          value: buttonValue,
          confirm: {
            title: { type: 'plain_text', text: 'Reject retailer?' },
            text: { type: 'mrkdwn', text: `Reject *${enterprise}* onboarding request?` },
            confirm: { type: 'plain_text', text: 'Reject' },
            deny: { type: 'plain_text', text: 'Cancel' },
          },
        },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: ':information_source: Demo approval — Slack only. Does not update Salesforce status.',
        },
      ],
    },
  ];
}

/** Blocks after Approve/Reject — original message updated so buttons cannot be reused. */
export function buildOnboardingResolvedBlocks(
  originalBlocks: any[],
  decision: 'approved' | 'rejected',
  decidedBy: string
): any[] {
  const emoji = decision === 'approved' ? ':white_check_mark:' : ':x:';
  const label = decision === 'approved' ? 'Approved' : 'Rejected';
  const filtered = (originalBlocks || []).filter(
    (b: any) => b.block_id !== 'onboarding_approval_actions' && b.type !== 'actions'
  );
  // Drop the demo context footer if present; replace with resolution context
  const withoutContext = filtered.filter((b: any) => b.type !== 'context');
  return [
    ...withoutContext,
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: `${emoji} *${label}* by <@${decidedBy}>  ·  ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
      },
    },
  ];
}

export function buildOnboardingDecisionMessage(
  meta: ReturnType<typeof parseOnboardingApprovalValue>,
  decision: 'approved' | 'rejected',
  decidedBy: string
): any[] {
  const approved = decision === 'approved';
  return [
    {
      type: 'header',
      text: {
        type: 'plain_text',
        text: approved ? 'Retailer Approved' : 'Retailer Rejected',
        emoji: true,
      },
    },
    {
      type: 'section',
      text: {
        type: 'mrkdwn',
        text: approved
          ? `:white_check_mark: *${meta.enterprise}* has been *approved* for onboarding.`
          : `:x: *${meta.enterprise}* onboarding request has been *rejected*.`,
      },
    },
    {
      type: 'section',
      fields: [
        { type: 'mrkdwn', text: `*Contact:*\n${meta.name}` },
        { type: 'mrkdwn', text: `*City:*\n${meta.city || '—'}` },
        { type: 'mrkdwn', text: `*Phone:*\n${meta.phone || '—'}` },
        { type: 'mrkdwn', text: `*Email:*\n${meta.email || '—'}` },
      ],
    },
    {
      type: 'context',
      elements: [
        {
          type: 'mrkdwn',
          text: [
            `Decided by <@${decidedBy}>`,
            meta.submittedBy ? `· Submitted by <@${meta.submittedBy}>` : '',
            `· ${new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' })} IST`,
          ]
            .filter(Boolean)
            .join(' '),
        },
      ],
    },
  ];
}

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
