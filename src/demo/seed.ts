import { DemoDb } from './types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

function dateOffset(days: number): string {
  const date = new Date();
  date.setDate(date.getDate() + days);
  return date.toISOString().slice(0, 10);
}

export function buildSeedDb(): DemoDb {
  const t = today();
  const pranavEmail = 'pranav.sharma@warpdrivetech.in';
  const pranavSfaUserId = 'demo_sfa_7072616e6176';
  const pranavSfUserId = 'demo_user_7072616e6176';
  const stores = [
    { Id: 'dst_blue_mart', Name: 'Blue Mart Jayanagar', Store_Code__c: 'BLU-001', Account__c: 'dacc_blue', AccountName: 'Blue Mart Retailer', City: 'Bengaluru', Phone: '+91 98765 43210', Email: 'blue@demo.local' },
    { Id: 'dst_kate', Name: 'Kitty & Fur Dog Shop Unit 1', Store_Code__c: 'KAT-001', Account__c: 'dacc_kate', AccountName: 'Kate Sharma shop', City: 'Mumbai', Phone: '+91 91234 56780', Email: 'kate@demo.local' },
    { Id: 'dst_fresh', Name: 'Fresh Mart Main', Store_Code__c: 'FRS-001', Account__c: 'dacc_fresh', AccountName: 'Fresh Mart', City: 'Pune', Phone: '+91 99887 76655', Email: 'fresh@demo.local' },
    { Id: 'dst_konkan', Name: 'Konkan Mart Outlet', Store_Code__c: 'KON-001', Account__c: 'dacc_konkan', AccountName: 'Konkan Mart', City: 'Goa', Phone: '+91 90000 11111', Email: 'konkan@demo.local' },
    { Id: 'dst_khasi', Name: 'Khasi Hills Mart', Store_Code__c: 'KHA-001', Account__c: 'dacc_khasi', AccountName: 'Khasi Hills Mart', City: 'Shillong', Phone: '+91 90000 22222', Email: 'khasi@demo.local' },
    { Id: 'dst_sun', Name: 'Sun Traders Store', Store_Code__c: 'SUN-001', Account__c: 'dacc_sun', AccountName: 'Sun Traders Retailer', City: 'Jaipur', Phone: '+91 90000 33333', Email: 'sun@demo.local' },
    { Id: 'dst_wb', Name: 'WB Mart Flagship', Store_Code__c: 'WBM-001', Account__c: 'dacc_wb', AccountName: 'WB Mart', City: 'Kolkata', Phone: '+91 90000 44444', Email: 'wb@demo.local' },
    { Id: 'dst_tripura', Name: 'Tripura Daily Mart', Store_Code__c: 'TRI-001', Account__c: 'dacc_tripura', AccountName: 'Tripura Daily Mart', City: 'Agartala', Phone: '+91 90000 55555', Email: 'tripura@demo.local' },
  ];

  const products = [
    { Id: 'dprod_bwire', Name: 'Binding Wire', ProductCode: 'PM-BWIRE', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 3250 },
    { Id: 'dprod_roof', Name: 'Galvanized Roofing Sheet', ProductCode: 'PM-ROOF', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 3050 },
    { Id: 'dprod_pipe_2', Name: 'GI Pipe 2 Inch', ProductCode: 'PM-PIPE-2', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 1890 },
    { Id: 'dprod_hr_2', Name: 'HR Sheet 2mm', ProductCode: 'PM-HR-2', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 3550 },
    { Id: 'dprod_beam_150', Name: 'ISMB 150 Beam', ProductCode: 'PM-BEAM-150', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 62000 },
    { Id: 'dprod_beam_200', Name: 'ISMB 200 Beam', ProductCode: 'PM-BEAM-200', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 63500 },
    { Id: 'dprod_angle_50', Name: 'MS Angle 50x50', ProductCode: 'PM-ANGLE-50', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 60000 },
    { Id: 'dprod_tmt_10', Name: 'Pulkit TMT Bar 10mm', ProductCode: 'PM-TMT-10', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 56300 },
    { Id: 'dprod_tmt_12', Name: 'Pulkit TMT Bar 12mm', ProductCode: 'PM-TMT-12', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 56700 },
    { Id: 'dprod_tmt_16', Name: 'Pulkit TMT Bar 16mm', ProductCode: 'PM-TMT-16', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 57200 },
    { Id: 'dprod_tmt_20', Name: 'Pulkit TMT Bar 20mm', ProductCode: 'PM-TMT-20', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 57800 },
    { Id: 'dprod_tmt_08', Name: 'Pulkit TMT Bar 8mm', ProductCode: 'PM-TMT-08', Description: '', Family: 'Metals', IsActive: true, UnitPrice: 56000 },
  ];

  // Demo identities are derived from the Slack profile email in src/data/index.ts.
  const visits = [
    {
      Id: 'dvis_001', Name: 'V-DEMO-001', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_blue_mart', AccountId__c: 'dacc_blue', AccountName: 'Blue Mart Retailer',
      User__c: pranavSfUserId, SFA_User__c: pranavSfaUserId, OwnerEmail: pranavEmail,
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Regular', Purpose__c: 'Order Taking', Order__c: '', CreatedDate: new Date().toISOString(),
    },
    {
      Id: 'dvis_002', Name: 'V-DEMO-002', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_kate', AccountId__c: 'dacc_kate', AccountName: 'Kate Sharma shop',
      User__c: pranavSfUserId, SFA_User__c: pranavSfaUserId, OwnerEmail: pranavEmail,
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Regular', Purpose__c: 'Relationship Building', Order__c: '', CreatedDate: new Date().toISOString(),
    },
    {
      Id: 'dvis_003', Name: 'V-DEMO-003', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_fresh', AccountId__c: 'dacc_fresh', AccountName: 'Fresh Mart',
      User__c: pranavSfUserId, SFA_User__c: pranavSfaUserId, OwnerEmail: pranavEmail,
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Ad hoc', Purpose__c: 'Order Taking', Order__c: '', CreatedDate: new Date().toISOString(),
    },
    {
      Id: 'dvis_004', Name: 'V-DEMO-004', Status__c: 'Completed', PlannedDate__c: dateOffset(-1), Visit_Date__c: dateOffset(-1),
      Planned_Start_Time__c: '10:00', Planned_End_Time__c: '11:00', ActualStartTime__c: `${dateOffset(-1)}T10:08:00.000Z`, ActualEndTime__c: `${dateOffset(-1)}T10:52:00.000Z`,
      Beat__c: 'Bengaluru Central', Retail_Store_Custom__c: 'dst_konkan', AccountId__c: 'dacc_konkan', AccountName: 'Konkan Mart',
      User__c: pranavSfUserId, SFA_User__c: pranavSfaUserId, OwnerEmail: pranavEmail,
      Visit_Notes__c: 'Discussed TMT bar and binding wire requirements.', Visit_Outcome__c: 'Order confirmed', Order_Value__c: 115100, Total_Expense_Amount__c: 450,
      Type__c: 'Regular', Purpose__c: 'Order Taking', Order__c: 'DORD-DEMO-004', Visitor__c: pranavSfUserId,
      Check_In_Time__c: `${dateOffset(-1)}T10:08:00.000Z`, Check_Out_Time__c: `${dateOffset(-1)}T10:52:00.000Z`, CreatedDate: `${dateOffset(-1)}T09:00:00.000Z`,
    },
    {
      Id: 'dvis_005', Name: 'V-DEMO-005', Status__c: 'Completed', PlannedDate__c: dateOffset(-3), Visit_Date__c: dateOffset(-3),
      Planned_Start_Time__c: '14:00', Planned_End_Time__c: '15:00', ActualStartTime__c: `${dateOffset(-3)}T14:05:00.000Z`, ActualEndTime__c: `${dateOffset(-3)}T14:48:00.000Z`,
      Beat__c: 'Pune West', Retail_Store_Custom__c: 'dst_sun', AccountId__c: 'dacc_sun', AccountName: 'Sun Traders Retailer',
      User__c: pranavSfUserId, SFA_User__c: pranavSfaUserId, OwnerEmail: pranavEmail,
      Visit_Notes__c: 'Presented GI pipe and roofing sheet assortment.', Visit_Outcome__c: 'Follow-up quotation requested', Order_Value__c: 0, Total_Expense_Amount__c: 300,
      Type__c: 'Promotional', Purpose__c: 'Product Demonstration', Order__c: '', Visitor__c: pranavSfUserId,
      Check_In_Time__c: `${dateOffset(-3)}T14:05:00.000Z`, Check_Out_Time__c: `${dateOffset(-3)}T14:48:00.000Z`, CreatedDate: `${dateOffset(-3)}T13:00:00.000Z`,
    },
  ];

  return {
    version: 3,
    stores,
    visits,
    expenses: [],
    surveys: [],
    competing: [],
    products,
    onboardings: [],
    seq: 100,
  };
}
