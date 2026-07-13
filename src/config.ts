import dotenv from 'dotenv';
dotenv.config();

export const config = {
  slack: {
    botToken: process.env.SLACK_BOT_TOKEN || '',
    signingSecret: process.env.SLACK_SIGNING_SECRET || '',
    appToken: process.env.SLACK_APP_TOKEN || '',
  },
  salesforce: {
    loginUrl: process.env.SF_LOGIN_URL || 'https://login.salesforce.com',
    clientId: process.env.SF_CLIENT_ID || '',
    clientSecret: process.env.SF_CLIENT_SECRET || '',
    username: process.env.SF_USERNAME || '',
    password: process.env.SF_PASSWORD || '',
    accessToken: process.env.SF_ACCESS_TOKEN || '',
    instanceUrl: process.env.SF_INSTANCE_URL || '',
  },
  port: parseInt(process.env.PORT || '3000', 10),
  nodeEnv: process.env.NODE_ENV || 'development',
  /**
   * When true, all app data uses the local demo store (optional Slack Lists proof).
   * Salesforce is not used. Restart bot after changing this flag.
   */
  demoMode: (process.env.DEMO_MODE || '').toLowerCase() === 'true',
  /**
   * When true (and DEMO_MODE is false), retailer onboarding never writes Partner_Request__c.
   * Slack approval channel flow still runs. Demo-friendly; no org changes required.
   */
  onboardingSkipSalesforce: (process.env.ONBOARDING_SKIP_SALESFORCE || '').toLowerCase() === 'true',
  /** Optional channel for demo write proof messages (e.g. C0123...). */
  demoProofChannel: process.env.DEMO_PROOF_CHANNEL || '',
  /** Optional path for demo JSON store (default: ./data/demo-store.json). */
  demoStorePath: process.env.DEMO_STORE_PATH || '',
  /** Optional Slack List IDs for client-visible proof (paid Slack plans). */
  demoLists: {
    visits: process.env.DEMO_LIST_VISITS || '',
    stores: process.env.DEMO_LIST_STORES || '',
    expenses: process.env.DEMO_LIST_EXPENSES || '',
    surveys: process.env.DEMO_LIST_SURVEYS || '',
    onboarding: process.env.DEMO_LIST_ONBOARDING || '',
  },
};

export const SOBJECTS = {
  BEAT: 'Beat__c',
  BEAT_PLAN_LINE_ITEM: 'Beat_Plan_Line_Item__c',
  BEAT_STORE: 'Beat_Store__c',
  VISIT: 'Visit__c',
  VISIT_TASK: 'Visit_Task__c',
  VISIT_SURVEY_RESPONSE: 'Visit_Survey_Response__c',
  EXPENSE: 'Expense__c',
  SFA_USER: 'SFA_User__c',
  PARTNER_REQUEST: 'Partner_Request__c',
  RETAIL_STORE: 'RetailStore__c',
  RETAIL_STORE_STANDARD: 'RetailStore',
  ORDER: 'Order',
  ORDER_ITEM: 'OrderItem',
  ORDER_WITH_PROMOTION: 'OrderWithPromotion__c',
  PRODUCT: 'Product2',
  PRICEBOOK_ENTRY: 'PricebookEntry',
  ACCOUNT: 'Account',
  USER: 'User',
  RETURN_ORDER: 'Return_Order__c',
  CLAIM: 'Claim__c',
  BULK_CLAIM: 'BulkClaim__c',
  INVOICE_CUSTOM: 'Invoice__c',
  INVENTORY: 'Inventory__c',
  COMPETING_PRODUCT: 'Competing_Product__c',
  PROMOTION: 'Promotion__c',
};

export const SF_CONSTANTS = {
  WD_DISTRIBUTOR_ID: '001am00001kjEdKAAU',
  ORDER_RECORD_TYPE_SECONDARY: '012am0000045cFFAAY',
  DEFAULT_OWNER_ID: '005am00000AN7xWAAT',
};

export function validateConfig(): void {
  const requiredSlack: [string, string][] = [
    ['SLACK_BOT_TOKEN', config.slack.botToken],
    ['SLACK_SIGNING_SECRET', config.slack.signingSecret],
    ['SLACK_APP_TOKEN', config.slack.appToken],
  ];
  for (const [name, val] of requiredSlack) {
    if (!val) throw new Error(`Missing required env var: ${name}`);
  }
  if (!config.demoMode) {
    if (!config.salesforce.accessToken && (!config.salesforce.username || !config.salesforce.password)) {
      throw new Error('Must set either SF_ACCESS_TOKEN (+ SF_INSTANCE_URL) or both SF_USERNAME and SF_PASSWORD');
    }
  }
  if (isNaN(config.port) || config.port < 1 || config.port > 65535) {
    throw new Error(`Invalid PORT: ${process.env.PORT}`);
  }
}

export const VISIT_STATUS = {
  PLANNED: 'Planned',
  IN_PROGRESS: 'In Progress',
  COMPLETED: 'Completed',
  CANCELLED: 'Cancelled',
} as const;

export const VISIT_TYPE = {
  REGULAR: 'Regular',
  AD_HOC: 'Ad hoc',
  PROMOTIONAL: 'Promotional',
} as const;
