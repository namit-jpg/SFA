export interface DemoStore {
  Id: string;
  Name: string;
  Store_Code__c: string;
  Account__c: string;
  AccountName: string;
  City?: string;
  Phone?: string;
  Email?: string;
}

export interface DemoVisit {
  Id: string;
  Name: string;
  Status__c: string;
  PlannedDate__c: string;
  Visit_Date__c: string;
  Planned_Start_Time__c: string;
  Planned_End_Time__c: string;
  ActualStartTime__c: string | null;
  ActualEndTime__c: string | null;
  Beat__c: string;
  Retail_Store_Custom__c: string;
  AccountId__c: string;
  AccountName: string;
  User__c: string;
  SFA_User__c: string;
  OwnerEmail: string;
  Visit_Notes__c: string;
  Visit_Outcome__c: string;
  Order_Value__c: number;
  Total_Expense_Amount__c: number;
  Type__c: string;
  Purpose__c: string;
  Order__c: string;
  Visitor__c?: string;
  Check_In_Time__c?: string;
  Check_Out_Time__c?: string;
  CreatedDate?: string;
  Not_Visited_Reason__c?: string;
}

export interface DemoExpense {
  Id: string;
  Visit_WD__c: string;
  Name: string;
  Amount__c: number;
  Description__c: string;
  TransactionDate__c: string;
  Category: string;
}

export interface DemoSurvey {
  Id: string;
  Visit_WD__c: string;
  Question__c: string;
  Answer__c: string;
  Survey_Type__c: string;
}

export interface DemoCompeting {
  Id: string;
  Name: string;
  Visit_WD__c: string;
  Brand__c?: string | null;
  Price__c?: number | null;
  Remarks__c?: string | null;
  Retail_Store__c?: string | null;
}

export interface DemoProduct {
  Id: string;
  Name: string;
  ProductCode: string;
  Description?: string;
  Family?: string;
  IsActive: boolean;
  UnitPrice: number;
}

export interface DemoOnboarding {
  Id: string;
  enterprise: string;
  status: string;
  data: Record<string, any>;
  submittedBy: string;
  createdAt: string;
}

export interface DemoDb {
  version: number;
  stores: DemoStore[];
  visits: DemoVisit[];
  expenses: DemoExpense[];
  surveys: DemoSurvey[];
  competing: DemoCompeting[];
  products: DemoProduct[];
  onboardings: DemoOnboarding[];
  seq: number;
}
