import { query, queryOne, esc, escLike, soqlDate, insertRecord, updateRecord } from './connection';
import { SOBJECTS } from '../config';

export interface SFAUser {
  Id: string;
  Name: string;
  email__c: string;
  IsActive__c: boolean;
}

export interface StoreSummary {
  Name: string;
}

export interface RetailStoreRecord {
  Id: string;
  Name: string;
  Store_Code__c: string;
  City__c?: string;
  Account__c: string;
  Account__r?: { Name: string };
}

export interface VisitRecord {
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
  Beat__r?: { Name: string };
  Retail_Store_Custom__c: string;
  AccountId__c: string;
  AccountId__r?: { Name: string; BillingStreet?: string; BillingCity?: string; BillingState?: string; Phone?: string };
  User__c: string;
  SFA_User__c: string;
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
}

export interface AccountContact {
  Name: string;
  Phone__c?: string;
  Email?: string;
}


export async function getSFUserByEmail(email: string): Promise<{ Id: string; Name: string; Email: string; UserRoleId: string } | null> {
  return queryOne<any>(
    `SELECT Id, Name, Email, UserRoleId FROM User WHERE Email = '${esc(email)}' AND IsActive = true LIMIT 1`
  );
}

export async function getSFAUserByEmail(email: string): Promise<SFAUser | null> {
  return queryOne<SFAUser>(
    `SELECT Id, Name, email__c, IsActive__c FROM ${SOBJECTS.SFA_USER} WHERE email__c = '${esc(email)}' AND IsActive__c = true LIMIT 1`
  );
}

export async function getSFAUserByUserId(userId: string): Promise<SFAUser | null> {
  const sfUser = await queryOne<any>(
    `SELECT Email FROM User WHERE Id = '${esc(userId)}' LIMIT 1`
  );
  if (!sfUser?.Email) return null;
  return getSFAUserByEmail(sfUser.Email);
}

export async function getManagerStatus(sfUserId: string): Promise<boolean> {
  const sfUser = await queryOne<{ UserRoleId: string }>(
    `SELECT UserRoleId FROM User WHERE Id = '${esc(sfUserId)}' LIMIT 1`
  );
  return !!sfUser?.UserRoleId;
}

export async function getDailyVisits(sfaUserId: string, date: string, ownerId?: string): Promise<VisitRecord[]> {
  const dateClause = soqlDate(date);
  const ownerClause = ownerId ? ` OR OwnerId = '${esc(ownerId)}'` : '';
  return query<VisitRecord>(
    `SELECT Id, Name, Status__c, PlannedDate__c, Visit_Date__c, Planned_Start_Time__c, Planned_End_Time__c,
            ActualStartTime__c, ActualEndTime__c, Beat__c, Beat__r.Name,
            Retail_Store_Custom__c,
            AccountId__c, AccountId__r.Name, User__c, SFA_User__c,
            Visit_Notes__c, Visit_Outcome__c, Order_Value__c, Total_Expense_Amount__c, Type__c, Purpose__c,
            CreatedDate
     FROM ${SOBJECTS.VISIT}
     WHERE (SFA_User__c = '${esc(sfaUserId)}'${ownerClause}) AND Visit_Date__c = ${dateClause}
     ORDER BY Planned_Start_Time__c ASC NULLS LAST`
  );
}

export async function getActiveVisit(sfaUserId: string): Promise<VisitRecord | null> {
  return queryOne<VisitRecord>(
    `SELECT Id, Name, Status__c, PlannedDate__c, Visit_Date__c, Planned_Start_Time__c, Planned_End_Time__c,
            ActualStartTime__c, ActualEndTime__c, Beat__c, Beat__r.Name,
            Retail_Store_Custom__c,
            AccountId__c, AccountId__r.Name, User__c, SFA_User__c,
            Visit_Notes__c, Visit_Outcome__c, Order_Value__c, Total_Expense_Amount__c, Type__c, Purpose__c
     FROM ${SOBJECTS.VISIT}
     WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'In Progress'
     LIMIT 1`
  );
}

export async function getVisitById(visitId: string): Promise<VisitRecord | null> {
  return queryOne<VisitRecord>(
    `SELECT Id, Name, Status__c, PlannedDate__c, Visit_Date__c, Planned_Start_Time__c, Planned_End_Time__c,
            ActualStartTime__c, ActualEndTime__c, Beat__c, Beat__r.Name,
            Retail_Store_Custom__c,
            AccountId__c, AccountId__r.Name, User__c, SFA_User__c,
            Visit_Notes__c, Visit_Outcome__c, Order_Value__c, Total_Expense_Amount__c, Type__c, Purpose__c
     FROM ${SOBJECTS.VISIT}
     WHERE Id = '${esc(visitId)}' LIMIT 1`
  );
}

export async function getBeatWithLineItems(beatId: string) {
  return queryOne<any>(
    `SELECT Id, Name, Beat_Type__c, Status__c, Start_Date__c, End_Date__c, Assigned_User__c,
            (SELECT Id, Name, Retail_Store_Custom__c, Visit_Date__c, Start_Time__c, End_Time__c, Status__c, Assigned_User__c
             FROM Beat_Plan_Line_Items__r ORDER BY Start_Time__c ASC)
     FROM ${SOBJECTS.BEAT}
     WHERE Id = '${esc(beatId)}' LIMIT 1`
  );
}

export async function searchStores(searchTerm: string): Promise<RetailStoreRecord[]> {
  const escaped = escLike(searchTerm);
  return query<RetailStoreRecord>(
    `SELECT Id, Name, Store_Code__c, Account__c, Account__r.Name
     FROM ${SOBJECTS.RETAIL_STORE}
     WHERE (Name LIKE '%${escaped}%' OR Store_Code__c LIKE '%${escaped}%' OR Account__r.Name LIKE '%${escaped}%')
       AND Account__r.RecordType.DeveloperName = 'Retailer'
     ORDER BY Name ASC LIMIT 25`
  );
}

export async function getStoreById(storeId: string): Promise<RetailStoreRecord | null> {
  return queryOne<RetailStoreRecord>(
    `SELECT Id, Name, Store_Code__c, Account__c, Account__r.Name
     FROM ${SOBJECTS.RETAIL_STORE}
     WHERE Id = '${esc(storeId)}' LIMIT 1`
  );
}

export async function getStoresByIds(storeIds: string[]): Promise<Map<string, RetailStoreRecord>> {
  const uniqueIds = [...new Set(storeIds.filter(Boolean))];
  if (uniqueIds.length === 0) return new Map();
  const idList = uniqueIds.map(id => `'${esc(id)}'`).join(',');
  const stores = await query<RetailStoreRecord>(
    `SELECT Id, Name, Store_Code__c, Account__c, Account__r.Name
     FROM ${SOBJECTS.RETAIL_STORE}
     WHERE Id IN (${idList})`
  );
  return new Map(stores.map(s => [s.Id, s]));
}

export async function getAllStores(): Promise<RetailStoreRecord[]> {
  return query<RetailStoreRecord>(
    `SELECT Id, Name, Store_Code__c, Account__c, Account__r.Name
     FROM ${SOBJECTS.RETAIL_STORE}
     ORDER BY Name ASC`
  );
}

export async function searchProducts(searchTerm: string): Promise<any[]> {
  const escaped = escLike(searchTerm);
  return query<any>(
    `SELECT Id, Name, ProductCode, Description, Family, IsActive
     FROM ${SOBJECTS.PRODUCT}
     WHERE IsActive = true AND (Name LIKE '%${escaped}%' OR ProductCode LIKE '%${escaped}%')
     ORDER BY Name ASC LIMIT 25`
  );
}

export async function getStandardPricebookId(): Promise<string | null> {
  const pb = await queryOne<{ Id: string }>(
    `SELECT Id FROM Pricebook2 WHERE IsStandard = true LIMIT 1`
  );
  return pb?.Id || null;
}

export async function getPriceForProduct(productId: string, pricebookId: string): Promise<{ entryId: string; unitPrice: number } | null> {
  const entry = await queryOne<{ Id: string; UnitPrice: number }>(
    `SELECT Id, UnitPrice FROM PricebookEntry WHERE Pricebook2Id = '${esc(pricebookId)}' AND Product2Id = '${esc(productId)}' AND IsActive = true LIMIT 1`
  );
  if (!entry) return null;
  return { entryId: entry.Id, unitPrice: entry.UnitPrice };
}

export async function getVisitSurveyResponses(visitId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, Question__c, Answer__c, Survey_Type__c
     FROM ${SOBJECTS.VISIT_SURVEY_RESPONSE}
     WHERE Visit_WD__c = '${esc(visitId)}'
     ORDER BY CreatedDate ASC`
  );
}

export async function getVisitExpenses(visitId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, Amount__c, Description__c, Travel_Expense__c, Food_Expense__c,
            Accommodation_Expense__c, Miscellaneous_Expense__c, TransactionDate__c
     FROM ${SOBJECTS.EXPENSE}
     WHERE Visit_WD__c = '${esc(visitId)}'
     ORDER BY CreatedDate ASC`
  );
}

export async function getRepsList(): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, email__c, IsActive__c
     FROM ${SOBJECTS.SFA_USER}
     WHERE IsActive__c = true
     ORDER BY Name ASC`
  );
}

export async function getTeamVisits(managerSfUserId: string, date: string): Promise<any[]> {
  const dateClause = soqlDate(date);

  const reps = await query<any>(
    `SELECT Id FROM ${SOBJECTS.SFA_USER} WHERE IsActive__c = true`
  );
  if (reps.length === 0) return [];
  const repIds = reps.map((r: any) => `'${esc(r.Id)}'`).join(',');
  return query<any>(
    `SELECT Id, Name, Status__c, SFA_User__c, SFA_User__r.Name, ActualStartTime__c, ActualEndTime__c,
            Retail_Store_Custom__c, Order_Value__c
     FROM ${SOBJECTS.VISIT}
     WHERE SFA_User__c IN (${repIds}) AND Visit_Date__c = ${dateClause}
     ORDER BY SFA_User__r.Name ASC`
  );
}

export async function getVisitOrders(visitId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, OrderNumber, Status, TotalAmount
     FROM Order
     WHERE Id IN (SELECT Order__c FROM ${SOBJECTS.VISIT} WHERE Id = '${esc(visitId)}')
     ORDER BY CreatedDate DESC`
  );
}

export async function getVisitOrdersCustom(visitId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, Order_Number__c, Order_Number__r.OrderNumber, Order_Number__r.Status, Order_Number__r.TotalAmount,
            Promotions__c, Promotions__r.Name
     FROM ${SOBJECTS.ORDER_WITH_PROMOTION}
      WHERE Order_Number__c IN (SELECT Order__c FROM ${SOBJECTS.VISIT} WHERE Id = '${esc(visitId)}')`
  );
}

export async function getStoreWithLocation(storeId: string): Promise<any | null> {
  try {
    return await queryOne<any>(
      `SELECT Id, Name, Location__c, Location__r.Name, Location__r.Location__Latitude__s, Location__r.Location__Longitude__s
       FROM ${SOBJECTS.RETAIL_STORE}
       WHERE Id = '${esc(storeId)}' LIMIT 1`
    );
  } catch { return null; }
}

export async function getPastVisits(sfaUserId: string, search?: string, limit: number = 50): Promise<VisitRecord[]> {
  const searchClause = search ? `AND (Retail_Store_Custom__r.Name LIKE '%${escLike(search)}%' OR Visit_Outcome__c LIKE '%${escLike(search)}%')` : '';
  return query<VisitRecord>(
    `SELECT Id, Name, Status__c, PlannedDate__c, Visit_Date__c, Planned_Start_Time__c,
            ActualStartTime__c, ActualEndTime__c, Beat__c, Beat__r.Name,
            Retail_Store_Custom__c,
            AccountId__c, AccountId__r.Name, User__c, SFA_User__c,
            Visit_Notes__c, Visit_Outcome__c, Order_Value__c, Total_Expense_Amount__c, Type__c, Purpose__c
     FROM ${SOBJECTS.VISIT}
     WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'Completed'
     ${searchClause}
     ORDER BY Visit_Date__c DESC
     LIMIT ${limit}`
  );
}

export async function getVisitInsights(sfaUserId: string): Promise<{
  totalVisits: number; thisWeekVisits: number; totalOrderValue: number; avgOrderValue: number;
  lastVisitDate: string | null; lastStore: string | null;
}> {
  const [total, thisWeek, orderTotal, last] = await Promise.all([
    query<any>(`SELECT COUNT(Id) FROM ${SOBJECTS.VISIT} WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'Completed'`),
    query<any>(`SELECT COUNT(Id) FROM ${SOBJECTS.VISIT} WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'Completed' AND Visit_Date__c = THIS_WEEK`),
    query<any>(`SELECT SUM(Order_Value__c) FROM ${SOBJECTS.VISIT} WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'Completed'`),
    queryOne<{ Visit_Date__c: string; Retail_Store_Custom__r: { Name: string } }>(
      `SELECT Visit_Date__c, Retail_Store_Custom__r.Name FROM ${SOBJECTS.VISIT} WHERE SFA_User__c = '${esc(sfaUserId)}' AND Status__c = 'Completed' ORDER BY Visit_Date__c DESC LIMIT 1`
    ),
  ]);
  const n = total?.[0]?.expr0 || 0;
  const v = orderTotal?.[0]?.expr0 || 0;
  return {
    totalVisits: n, thisWeekVisits: thisWeek?.[0]?.expr0 || 0,
    totalOrderValue: v, avgOrderValue: n > 0 ? Math.round(v / n) : 0,
    lastVisitDate: last?.Visit_Date__c || null, lastStore: last?.Retail_Store_Custom__r?.Name || null,
  };
}

export async function getTodayAttendance(sfaUserId: string, date: string): Promise<{ Id: string; Check_In_Selfie__c: string } | null> {
  const dateClause = soqlDate(date);
  return queryOne<any>(
    `SELECT Id, Check_In_Selfie__c FROM ${SOBJECTS.VISIT}
     WHERE SFA_User__c = '${esc(sfaUserId)}' AND Visit_Date__c = ${dateClause}
     AND Status__c IN ('In Progress', 'Completed')
     ORDER BY CreatedDate DESC LIMIT 1`
  );
}

export async function insertPartnerRequest(data: Record<string, any>): Promise<string> {
  return insertRecord(SOBJECTS.PARTNER_REQUEST, data);
}

export { esc, escLike, soqlDate, insertRecord };

// Visit Intelligence
export async function getStoreVisitHistory(storeId: string, limit: number = 5): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, Visit_Date__c, Status__c, Order_Value__c, Visit_Outcome__c
     FROM ${SOBJECTS.VISIT}
     WHERE Retail_Store_Custom__c = '${esc(storeId)}' AND Status__c = 'Completed'
     ORDER BY Visit_Date__c DESC LIMIT ${limit}`
  );
}

export async function getStoreOrders(storeId: string, limit: number = 5): Promise<any[]> {
  return query<any>(
    `SELECT Id, OrderNumber, Status, TotalAmount, EffectiveDate
     FROM Order
     WHERE AccountId IN (SELECT Account__c FROM ${SOBJECTS.RETAIL_STORE} WHERE Id = '${esc(storeId)}')
     AND Status != 'Cancelled'
     ORDER BY EffectiveDate DESC LIMIT ${limit}`
  );
}

export async function getFrequentlyBoughtProducts(accountId: string, limit: number = 5): Promise<any[]> {
  return query<any>(
    `SELECT Product2Id, Product2.Name, Product2.ProductCode, COUNT(Id) cnt, SUM(Quantity) totalQty
     FROM OrderItem
     WHERE OrderId IN (SELECT Id FROM Order WHERE AccountId = '${esc(accountId)}' AND Status != 'Cancelled')
     GROUP BY Product2Id, Product2.Name, Product2.ProductCode
     ORDER BY COUNT(Id) DESC LIMIT ${limit}`
  );
}

// Stock Check
export async function getProductStock(productId: string): Promise<number> {
  const r = await queryOne<any>(
    `SELECT SUM(Quantity_Available__c) total FROM ${SOBJECTS.INVENTORY} WHERE Product__c = '${esc(productId)}' AND Is_Active__c = true`
  );
  return r?.total || 0;
}

// Invoice Processing
export async function getVisitOrdersForInvoice(visitId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, OrderNumber, Status, TotalAmount, AccountId
     FROM Order
     WHERE Id = (SELECT Order__c FROM ${SOBJECTS.VISIT} WHERE Id = '${esc(visitId)}')
     AND Status = 'Draft'
     LIMIT 1`
  );
}

export async function getOrderItemsWithStock(orderId: string): Promise<any[]> {
  return query<any>(
    `SELECT Id, Product2Id, Product2.Name, Product2.ProductCode, Quantity, UnitPrice, TotalPrice
     FROM OrderItem
     WHERE OrderId = '${esc(orderId)}'`
  );
}

// Account Contact
export async function getAccountContact(accountId: string): Promise<AccountContact | null> {
  return queryOne<any>(
    `SELECT Name, Phone, Email FROM Contact WHERE AccountId = '${esc(accountId)}' LIMIT 1`
  );
}

// Visit Insights 360
export async function getLastOrderSummary(accountId: string): Promise<any | null> {
  const order = await queryOne<any>(
    `SELECT Id, OrderNumber, TotalAmount, EffectiveDate FROM Order
     WHERE AccountId = '${esc(accountId)}' AND Status != 'Cancelled'
     ORDER BY EffectiveDate DESC LIMIT 1`
  );
  if (!order) return null;
  const items = await query<any>(
    `SELECT Id, Product2.Name, Quantity, UnitPrice, TotalPrice FROM OrderItem WHERE OrderId = '${esc(order.Id)}' ORDER BY Quantity DESC LIMIT 5`
  );
  return { ...order, items };
}

export async function getStoreVisitLogs(storeId: string, limit: number = 10): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, Visit_Date__c, Status__c, Type__c, SFA_User__r.Name, Planned_Start_Time__c, ActualStartTime__c
     FROM ${SOBJECTS.VISIT}
     WHERE Retail_Store_Custom__c = '${esc(storeId)}'
     ORDER BY Visit_Date__c DESC LIMIT ${limit}`
  );
}

// Competing Products
export async function createCompetingProduct(data: Record<string, any>): Promise<string> {
  return insertRecord(SOBJECTS.COMPETING_PRODUCT, data);
}

// Active Promotions / Schemes
export async function getActivePromotions(): Promise<any[]> {
  return query<any>(
    `SELECT Id, Name, Scheme_Type__c, Scheme_Category__c, Status__c, Start_Date__c, End_Date__c, Description__c
     FROM ${SOBJECTS.PROMOTION}
     WHERE Scheme_Enabled__c = true AND Scheme_Category__c = 'Secondary'
     AND Start_Date__c <= TODAY AND End_Date__c >= TODAY
     ORDER BY Name ASC`
  );
}

// Visit Notes
export async function updateVisitNotes(visitId: string, notes: string): Promise<void> {
  return updateRecord(SOBJECTS.VISIT, visitId, { Visit_Notes__c: notes });
}

export async function rescheduleVisit(visitId: string, newDate: string, reason: string): Promise<void> {
  return updateRecord(SOBJECTS.VISIT, visitId, {
    Visit_Date__c: newDate,
    PlannedDate__c: newDate,
    Not_Visited_Reason__c: reason,
  });
}
