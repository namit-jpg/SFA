/**
 * Data facade — routes to Salesforce (production) or demo store (DEMO_MODE=true).
 * Handlers/views import from here so production SF path stays isolated.
 */
import { config, SOBJECTS, SF_CONSTANTS } from '../config';
import * as sf from '../salesforce/soql';
import { insertRecord, updateRecord } from '../salesforce/connection';
import * as demo from '../demo/store';
import { demoProof } from '../demo/proof';

export type {
  SFAUser, StoreSummary, RetailStoreRecord, VisitRecord, AccountContact,
} from '../salesforce/soql';

export { esc, escLike, soqlDate } from '../salesforce/soql';

let proofClient: any = null;

/** Call once from app startup so demo writes can post channel/list proof. */
export function setProofClient(client: any) {
  proofClient = client;
}

function asRetailStore(s: demo.DemoStore | null | undefined): any | null {
  if (!s) return null;
  return {
    Id: s.Id,
    Name: s.Name,
    Store_Code__c: s.Store_Code__c,
    City__c: s.City,
    Account__c: s.Account__c,
    Account__r: { Name: s.AccountName },
  };
}

function asVisit(v: demo.DemoVisit | null | undefined): any | null {
  if (!v) return null;
  return {
    ...v,
    AccountId__r: {
      Name: v.AccountName,
      BillingStreet: '',
      BillingCity: '',
      BillingState: '',
      Phone: '',
    },
    Beat__r: v.Beat__c ? { Name: v.Beat__c } : undefined,
    Retail_Store_Custom__r: { Name: v.AccountName },
  };
}

// ── Identity ────────────────────────────────────────────

export async function getSFUserByEmail(email: string) {
  if (config.demoMode) {
    return {
      Id: `demo_user_${Buffer.from(email).toString('hex').slice(0, 12)}`,
      Name: email.split('@')[0] || 'Demo User',
      Email: email,
      UserRoleId: '',
    };
  }
  return sf.getSFUserByEmail(email);
}

export async function getSFAUserByEmail(email: string) {
  if (config.demoMode) {
    return {
      Id: `demo_sfa_${Buffer.from(email).toString('hex').slice(0, 12)}`,
      Name: email.split('@')[0] || 'Demo Rep',
      email__c: email,
      IsActive__c: true,
    };
  }
  return sf.getSFAUserByEmail(email);
}

export async function getSFAUserByUserId(userId: string) {
  if (config.demoMode) return null;
  return sf.getSFAUserByUserId(userId);
}

// ── Visits ──────────────────────────────────────────────

export async function getDailyVisits(sfaUserId: string, date: string, ownerId?: string) {
  if (config.demoMode) {
    return demo.demoGetDailyVisits(sfaUserId, date, ownerId).map((v) => asVisit(v)!);
  }
  return sf.getDailyVisits(sfaUserId, date, ownerId);
}

export async function getActiveVisit(sfaUserId: string) {
  if (config.demoMode) return asVisit(demo.demoGetActiveVisit(sfaUserId));
  return sf.getActiveVisit(sfaUserId);
}

export async function getVisitById(visitId: string) {
  if (config.demoMode) return asVisit(demo.demoGetVisitById(visitId));
  return sf.getVisitById(visitId);
}

export async function getVisitInsights(sfaUserId: string) {
  if (config.demoMode) return demo.demoGetVisitInsights(sfaUserId);
  return sf.getVisitInsights(sfaUserId);
}

export async function getTodayAttendance(sfaUserId: string, date: string) {
  if (config.demoMode) return demo.demoGetTodayAttendance(sfaUserId, date);
  return sf.getTodayAttendance(sfaUserId, date);
}

export async function getPastVisits(sfaUserId: string, search?: string, limit: number = 50) {
  if (config.demoMode) {
    let rows = demo.demoGetDailyVisits(sfaUserId, 'LAST_MONTH').map((v) => asVisit(v)!);
    if (search) {
      const q = search.toLowerCase();
      rows = rows.filter((v: any) =>
        (v.Name || '').toLowerCase().includes(q) || (v.AccountName || v.AccountId__r?.Name || '').toLowerCase().includes(q)
      );
    }
    return rows.slice(0, limit);
  }
  return sf.getPastVisits(sfaUserId, search, limit);
}

// ── Stores ──────────────────────────────────────────────

export async function searchStores(term: string) {
  if (config.demoMode) return demo.demoSearchStores(term).map((s) => asRetailStore(s)!);
  return sf.searchStores(term);
}

export async function getStoreById(storeId: string) {
  if (config.demoMode) return asRetailStore(demo.demoGetStoreById(storeId));
  return sf.getStoreById(storeId);
}

export async function getStoresByIds(ids: string[]) {
  if (config.demoMode) {
    const map = demo.demoGetStoresByIds(ids);
    const out = new Map<string, any>();
    for (const [k, v] of map) out.set(k, asRetailStore(v)!);
    return out;
  }
  return sf.getStoresByIds(ids);
}

export async function getAllStores() {
  if (config.demoMode) return demo.demoGetAllStores().map((s) => asRetailStore(s)!);
  return sf.getAllStores();
}

export async function resolveCustomStoreForVisit(storeId: string) {
  if (config.demoMode) {
    const s = demo.demoGetStoreById(storeId);
    if (!s) throw new Error(`Store not found: ${storeId}`);
    return {
      customStoreId: s.Id,
      accountId: s.Account__c,
      retailerName: s.AccountName || s.Name,
    };
  }
  return sf.resolveCustomStoreForVisit(storeId);
}

// ── Products / pricing ──────────────────────────────────

export async function searchProducts(term: string) {
  if (config.demoMode) {
    const rows = demo.demoSearchProducts(term || '');
    console.log(`[Demo] searchProducts("${term}") → ${rows.length} product(s)`);
    return rows.map((p) => ({
      Id: p.Id, Name: p.Name, ProductCode: p.ProductCode,
      Description: p.Description, Family: p.Family, IsActive: p.IsActive,
    }));
  }
  return sf.searchProducts(term);
}

export async function getStandardPricebookId() {
  if (config.demoMode) return 'demo_pricebook';
  return sf.getStandardPricebookId();
}

export async function getPriceForProduct(productId: string, _pricebookId: string) {
  if (config.demoMode) {
    const p = demo.demoGetProduct(productId);
    if (!p) return null;
    return { entryId: `dpbe_${p.Id}`, unitPrice: p.UnitPrice };
  }
  return sf.getPriceForProduct(productId, _pricebookId);
}

// ── Related reads ───────────────────────────────────────

export async function getVisitSurveyResponses(visitId: string) {
  if (config.demoMode) return demo.demoGetVisitSurveys(visitId);
  return sf.getVisitSurveyResponses(visitId);
}

export async function getVisitExpenses(visitId: string) {
  if (config.demoMode) return demo.demoGetVisitExpenses(visitId);
  return sf.getVisitExpenses(visitId);
}

export async function getRepsList() {
  if (config.demoMode) return demo.demoGetRepsList();
  return sf.getRepsList();
}

export async function getStoreVisitHistory(storeId: string, limit?: number) {
  if (config.demoMode) return demo.demoGetStoreVisitHistory(storeId, limit);
  return sf.getStoreVisitHistory(storeId, limit);
}

export async function getStoreOrders(storeId: string, limit?: number) {
  if (config.demoMode) return [];
  return sf.getStoreOrders(storeId, limit);
}

export async function getFrequentlyBoughtProducts(accountId: string, limit?: number) {
  if (config.demoMode) {
    return demo.demoSearchProducts('').slice(0, limit || 5).map((p) => ({
      Product2Id: p.Id,
      Name: p.Name,
      Product2: { Name: p.Name, ProductCode: p.ProductCode },
      cnt: 3,
      totalQty: 10,
    }));
  }
  return sf.getFrequentlyBoughtProducts(accountId, limit);
}

export async function getAccountContact(accountId: string) {
  if (config.demoMode) {
    const store = demo.demoGetAllStores().find((s) => s.Account__c === accountId);
    return store
      ? { Name: store.AccountName, Phone__c: store.Phone, Phone: store.Phone, Email: store.Email }
      : { Name: 'Demo Contact', Phone__c: '+91 90000 00000', Email: 'demo@example.com' };
  }
  return sf.getAccountContact(accountId);
}

export async function getLastOrderSummary(accountId: string) {
  if (config.demoMode) return null;
  return sf.getLastOrderSummary(accountId);
}

export async function getStoreVisitLogs(storeId: string, limit?: number) {
  if (config.demoMode) return demo.demoGetStoreVisitLogs(storeId, limit);
  return sf.getStoreVisitLogs(storeId, limit);
}

export async function getActivePromotions() {
  if (config.demoMode) {
    return [
      {
        Id: 'dpromo_1', Name: 'Buy 10 Get 1 Free — Rice', Scheme_Type__c: 'Volume',
        Scheme_Category__c: 'Secondary', Status__c: 'Active',
        Start_Date__c: '2026-01-01', End_Date__c: '2026-12-31',
        Description__c: 'Demo scheme for secondary sales',
      },
    ];
  }
  return sf.getActivePromotions();
}

// ── Writes (domain) ─────────────────────────────────────

export async function updateVisitRecord(visitId: string, data: Record<string, any>): Promise<void> {
  if (config.demoMode) {
    demo.demoUpdateVisit(visitId, data as any);
    await demoProof(proofClient, 'Visit update', `Visit ${visitId} updated`, data as any);
    return;
  }
  await updateRecord(SOBJECTS.VISIT, visitId, data);
}

export async function createAdhocVisit(payload: {
  storeId: string;
  date: string;
  purpose: string;
  sfaUserId: string;
  ownerEmail?: string;
  sfUserRecordId?: string;
  type?: string;
}): Promise<{ visitId: string; retailerName: string }> {
  if (config.demoMode) {
    const visit = demo.demoCreateVisit({
      storeId: payload.storeId,
      date: payload.date,
      purpose: payload.purpose,
      sfaUserId: payload.sfaUserId,
      ownerEmail: payload.ownerEmail || '',
      type: payload.type,
    });
    await demoProof(proofClient, 'Visit created', `Created ${visit.Name} for ${visit.AccountName}`, {
      Visit: visit.Name,
      Store: visit.AccountName,
      Date: visit.Visit_Date__c,
      Status: visit.Status__c,
    });
    return { visitId: visit.Id, retailerName: visit.AccountName };
  }

  const resolved = await sf.resolveCustomStoreForVisit(payload.storeId);
  const visitPayload: Record<string, any> = {
    Retail_Store_Custom__c: resolved.customStoreId,
    AccountId__c: resolved.accountId,
    SFA_User__c: payload.sfaUserId,
    Visit_Date__c: payload.date,
    PlannedDate__c: payload.date,
    Status__c: 'Planned',
    Type__c: payload.type || 'Ad hoc',
    Purpose__c: payload.purpose || 'Order Taking',
  };
  if (payload.storeId.startsWith('0YQ')) visitPayload.Retail_Store__c = payload.storeId;
  const ownerId = payload.sfUserRecordId || SF_CONSTANTS.DEFAULT_OWNER_ID;
  visitPayload.OwnerId = ownerId;
  visitPayload.User__c = payload.sfUserRecordId || SF_CONSTANTS.DEFAULT_OWNER_ID;
  visitPayload.Visitor__c = payload.sfUserRecordId || SF_CONSTANTS.DEFAULT_OWNER_ID;
  const id = await insertRecord(SOBJECTS.VISIT, visitPayload);
  return { visitId: id, retailerName: resolved.retailerName };
}

export async function addSurveyResponse(visitId: string, question: string, answer: string, surveyType: string) {
  if (config.demoMode) {
    demo.demoAddSurvey(visitId, question, answer, surveyType);
    await demoProof(proofClient, 'Survey', `${question}: ${answer}`, { Visit: visitId, Type: surveyType });
    return;
  }
  await insertRecord(SOBJECTS.VISIT_SURVEY_RESPONSE, {
    Visit_WD__c: visitId, Question__c: question, Answer__c: answer, Survey_Type__c: surveyType,
  });
}

export async function addExpenseRecord(visitId: string, amount: number, category: string, description: string, date: string) {
  if (config.demoMode) {
    demo.demoAddExpense(visitId, amount, category, description, date);
    await demoProof(proofClient, 'Expense', `${category} ${amount}`, { Visit: visitId, Amount: amount });
    return;
  }
  const catMap: Record<string, any> = {
    Travel: { Travel_Expense__c: amount }, Food: { Food_Expense__c: amount },
    Accommodation: { Accommodation_Expense__c: amount }, Fuel: { Travel_Expense__c: amount },
    Parking: { Miscellaneous_Expense__c: amount }, Miscellaneous: { Miscellaneous_Expense__c: amount },
  };
  await insertRecord(SOBJECTS.EXPENSE, {
    Name: `Exp - ${visitId}`, Visit_WD__c: visitId, Amount__c: amount,
    ...(catMap[category] || {}), Description__c: description, TransactionDate__c: date,
  });
  const v = await sf.getVisitById(visitId);
  await updateRecord(SOBJECTS.VISIT, visitId, {
    Total_Expense_Amount__c: (v?.Total_Expense_Amount__c || 0) + amount,
  });
}

export async function placeOrder(visitId: string, items: any[], accountId: string) {
  if (config.demoMode) {
    const mapped = items.map((i) => ({
      productId: i.productId, quantity: i.quantity, unitPrice: i.unitPrice, name: i.name,
    }));
    const result = demo.demoPlaceOrder(visitId, mapped);
    await demoProof(proofClient, 'Order', `Order ${result.orderId} total ${result.total}`, {
      Visit: visitId, Total: result.total, Lines: items.length,
    });
    return result;
  }

  const pbId = await sf.getStandardPricebookId();
  if (!pbId) throw new Error('No pricebook found in Salesforce.');
  const orderId = await insertRecord(SOBJECTS.ORDER, {
    AccountId: accountId,
    Pricebook2Id: pbId,
    Status: 'Draft',
    EffectiveDate: new Date().toISOString().slice(0, 10),
    RecordTypeId: SF_CONSTANTS.ORDER_RECORD_TYPE_SECONDARY,
    Retailer_Account__c: accountId,
    Distributor_Account__c: SF_CONSTANTS.WD_DISTRIBUTOR_ID,
  });
  let total = 0;
  for (const item of items) {
    if (!item.entryId) continue;
    await insertRecord(SOBJECTS.ORDER_ITEM, {
      OrderId: orderId, Product2Id: item.productId, Quantity: item.quantity,
      UnitPrice: item.unitPrice, PricebookEntryId: item.entryId,
    });
    total += item.unitPrice * item.quantity;
  }
  const visit = await sf.getVisitById(visitId);
  await updateRecord(SOBJECTS.VISIT, visitId, {
    Order__c: orderId, Order_Value__c: (visit?.Order_Value__c || 0) + total,
  });
  return { orderId, total };
}

export async function createCompetingProduct(data: Record<string, any>) {
  if (config.demoMode) {
    demo.demoAddCompeting(data as any);
    await demoProof(proofClient, 'Competing product', data.Name, { Visit: data.Visit_WD__c, Brand: data.Brand__c });
    return 'demo';
  }
  return sf.createCompetingProduct(data);
}

export async function updateVisitNotes(visitId: string, notes: string) {
  if (config.demoMode) {
    demo.demoUpdateVisit(visitId, { Visit_Notes__c: notes });
    await demoProof(proofClient, 'Notes', notes.slice(0, 80), { Visit: visitId });
    return;
  }
  return sf.updateVisitNotes(visitId, notes);
}

export async function rescheduleVisit(visitId: string, newDate: string, reason: string) {
  if (config.demoMode) {
    demo.demoUpdateVisit(visitId, {
      Visit_Date__c: newDate, PlannedDate__c: newDate, Not_Visited_Reason__c: reason,
    });
    await demoProof(proofClient, 'Reschedule', `→ ${newDate}`, { Visit: visitId, Reason: reason });
    return;
  }
  return sf.rescheduleVisit(visitId, newDate, reason);
}

export async function insertPartnerRequest(data: Record<string, any>) {
  if (config.demoMode) {
    const row = demo.demoCreateOnboarding(data, 'demo');
    await demoProof(proofClient, 'Onboarding', row.enterprise, { Status: row.status });
    return row.Id;
  }
  if (config.onboardingSkipSalesforce) {
    console.log('[SFA] Onboarding: skipping Salesforce write (ONBOARDING_SKIP_SALESFORCE=true)');
    return 'skipped';
  }
  // Strip demo-only form keys before Salesforce insert
  const sfData: Record<string, any> = {};
  for (const [k, v] of Object.entries(data)) {
    if (!k.startsWith('onb_')) sfData[k] = v;
  }
  return insertRecord(SOBJECTS.PARTNER_REQUEST, sfData);
}

export async function recordOnboardingDecision(enterprise: string, decision: string) {
  if (config.demoMode) {
    demo.demoUpdateOnboardingStatus(enterprise, decision === 'approved' ? 'Approved' : 'Rejected');
    await demoProof(proofClient, 'Onboarding decision', `${enterprise}: ${decision}`);
  }
}

// Low-level passthrough for any remaining direct callers (prefer domain helpers above)
export async function insertRecordFacade(sobject: string, data: Record<string, any>) {
  if (config.demoMode) throw new Error(`Demo mode: use domain helpers instead of insertRecord(${sobject})`);
  return insertRecord(sobject, data);
}

export async function updateRecordFacade(sobject: string, id: string, data: Record<string, any>) {
  if (config.demoMode) {
    if (sobject === SOBJECTS.VISIT || sobject === 'Visit__c') {
      return updateVisitRecord(id, data);
    }
    throw new Error(`Demo mode: unsupported update on ${sobject}`);
  }
  return updateRecord(sobject, id, data);
}
