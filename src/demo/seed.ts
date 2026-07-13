import { DemoDb } from './types';

function today(): string {
  return new Date().toISOString().slice(0, 10);
}

export function buildSeedDb(): DemoDb {
  const t = today();
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
    { Id: 'dprod_rice', Name: 'Premium Basmati Rice 5kg', ProductCode: 'RICE-5', Description: 'Long grain basmati', Family: 'Staples', IsActive: true, UnitPrice: 450 },
    { Id: 'dprod_oil', Name: 'Sunflower Oil 1L', ProductCode: 'OIL-1L', Description: 'Refined sunflower oil', Family: 'Staples', IsActive: true, UnitPrice: 160 },
    { Id: 'dprod_soap', Name: 'Herbal Soap Pack', ProductCode: 'SOAP-6', Description: '6-bar multipack', Family: 'Personal Care', IsActive: true, UnitPrice: 120 },
    { Id: 'dprod_tea', Name: 'Assam Tea 500g', ProductCode: 'TEA-500', Description: 'CTC tea', Family: 'Beverages', IsActive: true, UnitPrice: 210 },
    { Id: 'dprod_det', Name: 'Detergent Powder 1kg', ProductCode: 'DET-1K', Description: 'Front-load detergent', Family: 'Home Care', IsActive: true, UnitPrice: 185 },
  ];

  // OwnerEmail empty = visible to any demo user (seed visits)
  const visits = [
    {
      Id: 'dvis_001', Name: 'V-DEMO-001', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_blue_mart', AccountId__c: 'dacc_blue', AccountName: 'Blue Mart Retailer',
      User__c: 'demo_user', SFA_User__c: 'demo_sfa_user', OwnerEmail: '',
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Regular', Purpose__c: 'Order Taking', Order__c: '', CreatedDate: new Date().toISOString(),
    },
    {
      Id: 'dvis_002', Name: 'V-DEMO-002', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_kate', AccountId__c: 'dacc_kate', AccountName: 'Kate Sharma shop',
      User__c: 'demo_user', SFA_User__c: 'demo_sfa_user', OwnerEmail: '',
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Regular', Purpose__c: 'Relationship Building', Order__c: '', CreatedDate: new Date().toISOString(),
    },
    {
      Id: 'dvis_003', Name: 'V-DEMO-003', Status__c: 'Planned', PlannedDate__c: t, Visit_Date__c: t,
      Planned_Start_Time__c: '', Planned_End_Time__c: '', ActualStartTime__c: null, ActualEndTime__c: null,
      Beat__c: '', Retail_Store_Custom__c: 'dst_fresh', AccountId__c: 'dacc_fresh', AccountName: 'Fresh Mart',
      User__c: 'demo_user', SFA_User__c: 'demo_sfa_user', OwnerEmail: '',
      Visit_Notes__c: '', Visit_Outcome__c: '', Order_Value__c: 0, Total_Expense_Amount__c: 0,
      Type__c: 'Ad hoc', Purpose__c: 'Order Taking', Order__c: '', CreatedDate: new Date().toISOString(),
    },
  ];

  return {
    version: 1,
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
