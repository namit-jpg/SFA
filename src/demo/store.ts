import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';
import { buildSeedDb } from './seed';
import {
  DemoCompeting, DemoDb, DemoExpense, DemoOnboarding, DemoProduct,
  DemoStore, DemoSurvey, DemoVisit,
} from './types';

export type { DemoStore, DemoVisit, DemoExpense, DemoSurvey, DemoProduct, DemoOnboarding, DemoDb };

let db: DemoDb | null = null;
let storePath = '';

function resolvePath(): string {
  if (config.demoStorePath) return path.resolve(config.demoStorePath);
  return path.resolve(process.cwd(), 'data', 'demo-store.json');
}

function ensureLoaded(): DemoDb {
  if (db) return db;
  storePath = resolvePath();
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  if (fs.existsSync(storePath)) {
    try {
      db = JSON.parse(fs.readFileSync(storePath, 'utf8')) as DemoDb;
      if (!db.version || !Array.isArray(db.stores)) throw new Error('invalid store');
    } catch {
      db = buildSeedDb();
      persist();
    }
  } else {
    db = buildSeedDb();
    persist();
  }
  return db!;
}

function persist(): void {
  if (!db) return;
  fs.writeFileSync(storePath, JSON.stringify(db, null, 2), 'utf8');
}

function nextId(prefix: string): string {
  const d = ensureLoaded();
  d.seq += 1;
  return `${prefix}_${d.seq}`;
}

export function initDemoStore(): void {
  ensureLoaded();
  console.log(`[Demo] Store loaded: ${storePath} (${db!.stores.length} stores, ${db!.visits.length} visits)`);
}

export function resetDemoStore(): void {
  db = buildSeedDb();
  storePath = resolvePath();
  const dir = path.dirname(storePath);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  persist();
}

// ── Stores ──────────────────────────────────────────────

export function demoSearchStores(term: string): DemoStore[] {
  const q = (term || '').toLowerCase();
  return ensureLoaded().stores.filter((s) =>
    s.Name.toLowerCase().includes(q) ||
    s.AccountName.toLowerCase().includes(q) ||
    (s.Store_Code__c || '').toLowerCase().includes(q)
  ).slice(0, 25);
}

export function demoGetStoreById(id: string): DemoStore | null {
  return ensureLoaded().stores.find((s) => s.Id === id) || null;
}

export function demoGetStoresByIds(ids: string[]): Map<string, DemoStore> {
  const set = new Set(ids.filter(Boolean));
  const map = new Map<string, DemoStore>();
  for (const s of ensureLoaded().stores) {
    if (set.has(s.Id)) map.set(s.Id, s);
  }
  return map;
}

export function demoGetAllStores(): DemoStore[] {
  return [...ensureLoaded().stores].sort((a, b) => a.Name.localeCompare(b.Name));
}

// ── Visits ──────────────────────────────────────────────

function visitMatchesUser(v: DemoVisit, sfaUserId: string, ownerEmail?: string): boolean {
  if (v.SFA_User__c === sfaUserId || v.OwnerEmail === sfaUserId) return true;
  // Seed visits with empty OwnerEmail are shared for any demo user
  if (!v.OwnerEmail && (v.SFA_User__c === 'demo_sfa_user' || !v.SFA_User__c)) return true;
  if (ownerEmail && v.OwnerEmail === ownerEmail) return true;
  return false;
}

function inDateWindow(dateStr: string, window: string): boolean {
  if (!dateStr) return false;
  if (window === 'THIS_WEEK' || window === 'LAST_MONTH') {
    const d = new Date(dateStr + 'T00:00:00');
    const now = new Date();
    const days = window === 'THIS_WEEK' ? 7 : 31;
    const min = new Date(now);
    min.setDate(min.getDate() - days);
    return d >= min && d <= now;
  }
  return dateStr === window;
}

export function demoGetDailyVisits(sfaUserId: string, date: string, _ownerId?: string, ownerEmail?: string): DemoVisit[] {
  return ensureLoaded().visits
    .filter((v) => visitMatchesUser(v, sfaUserId, ownerEmail) && inDateWindow(v.Visit_Date__c, date))
    .sort((a, b) => (b.CreatedDate || '').localeCompare(a.CreatedDate || ''));
}

export function demoGetActiveVisit(sfaUserId: string, ownerEmail?: string): DemoVisit | null {
  return ensureLoaded().visits.find(
    (v) => visitMatchesUser(v, sfaUserId, ownerEmail) && v.Status__c === 'In Progress'
  ) || null;
}

export function demoGetVisitById(id: string): DemoVisit | null {
  return ensureLoaded().visits.find((v) => v.Id === id) || null;
}

export function demoUpdateVisit(id: string, data: Partial<DemoVisit>): void {
  const d = ensureLoaded();
  const idx = d.visits.findIndex((v) => v.Id === id);
  if (idx < 0) throw new Error(`Visit not found: ${id}`);
  d.visits[idx] = { ...d.visits[idx], ...data };
  persist();
}

export function demoCreateVisit(payload: {
  storeId: string;
  date: string;
  purpose: string;
  sfaUserId: string;
  ownerEmail: string;
  type?: string;
}): DemoVisit {
  const d = ensureLoaded();
  const store = d.stores.find((s) => s.Id === payload.storeId);
  if (!store) throw new Error(`Store not found: ${payload.storeId}`);
  const id = nextId('dvis');
  const visit: DemoVisit = {
    Id: id,
    Name: `V-DEMO-${d.seq}`,
    Status__c: 'Planned',
    PlannedDate__c: payload.date,
    Visit_Date__c: payload.date,
    Planned_Start_Time__c: '',
    Planned_End_Time__c: '',
    ActualStartTime__c: null,
    ActualEndTime__c: null,
    Beat__c: '',
    Retail_Store_Custom__c: store.Id,
    AccountId__c: store.Account__c,
    AccountName: store.AccountName,
    User__c: payload.sfaUserId,
    SFA_User__c: payload.sfaUserId,
    OwnerEmail: payload.ownerEmail,
    Visit_Notes__c: '',
    Visit_Outcome__c: '',
    Order_Value__c: 0,
    Total_Expense_Amount__c: 0,
    Type__c: payload.type || 'Ad hoc',
    Purpose__c: payload.purpose || 'Order Taking',
    Order__c: '',
    Visitor__c: payload.sfaUserId,
    CreatedDate: new Date().toISOString(),
  };
  d.visits.unshift(visit);
  persist();
  return visit;
}

export function demoGetVisitInsights(sfaUserId: string, ownerEmail?: string) {
  const visits = ensureLoaded().visits.filter((v) => visitMatchesUser(v, sfaUserId, ownerEmail));
  const completed = visits.filter((v) => v.Status__c === 'Completed');
  const now = new Date();
  const weekAgo = new Date(now);
  weekAgo.setDate(weekAgo.getDate() - 7);
  const thisWeek = completed.filter((v) => {
    const d = new Date(v.Visit_Date__c + 'T00:00:00');
    return d >= weekAgo;
  });
  const totalOrderValue = completed.reduce((s, v) => s + (v.Order_Value__c || 0), 0);
  const last = [...completed].sort((a, b) => b.Visit_Date__c.localeCompare(a.Visit_Date__c))[0];
  return {
    totalVisits: completed.length,
    thisWeekVisits: thisWeek.length,
    totalOrderValue,
    avgOrderValue: completed.length ? Math.round(totalOrderValue / completed.length) : 0,
    lastVisitDate: last?.Visit_Date__c || null,
    lastStore: last?.AccountName || null,
  };
}

export function demoGetTodayAttendance(sfaUserId: string, date: string, ownerEmail?: string) {
  const v = ensureLoaded().visits.find(
    (x) =>
      visitMatchesUser(x, sfaUserId, ownerEmail) &&
      x.Visit_Date__c === date &&
      (x.Status__c === 'In Progress' || x.Status__c === 'Completed' || !!x.Check_In_Time__c)
  );
  return v ? { Id: v.Id, Check_In_Selfie__c: '' } : null;
}

// ── Expenses / Surveys / Competing ──────────────────────

export function demoGetVisitExpenses(visitId: string): DemoExpense[] {
  return ensureLoaded().expenses.filter((e) => e.Visit_WD__c === visitId);
}

export function demoAddExpense(visitId: string, amount: number, category: string, description: string, date: string): DemoExpense {
  const d = ensureLoaded();
  const exp: DemoExpense = {
    Id: nextId('dexp'),
    Visit_WD__c: visitId,
    Name: `Exp - ${visitId}`,
    Amount__c: amount,
    Description__c: description,
    TransactionDate__c: date,
    Category: category,
  };
  d.expenses.push(exp);
  const visit = d.visits.find((v) => v.Id === visitId);
  if (visit) visit.Total_Expense_Amount__c = (visit.Total_Expense_Amount__c || 0) + amount;
  persist();
  return exp;
}

export function demoGetVisitSurveys(visitId: string): DemoSurvey[] {
  return ensureLoaded().surveys.filter((s) => s.Visit_WD__c === visitId);
}

export function demoAddSurvey(visitId: string, question: string, answer: string, surveyType: string): DemoSurvey {
  const d = ensureLoaded();
  const row: DemoSurvey = {
    Id: nextId('dsvy'),
    Visit_WD__c: visitId,
    Question__c: question,
    Answer__c: answer,
    Survey_Type__c: surveyType,
  };
  d.surveys.push(row);
  persist();
  return row;
}

export function demoAddCompeting(data: {
  Name: string;
  Visit_WD__c: string;
  Brand__c?: string | null;
  Price__c?: number | null;
  Remarks__c?: string | null;
  Retail_Store__c?: string | null;
}): DemoCompeting {
  const d = ensureLoaded();
  const row: DemoCompeting = { Id: nextId('dcmp'), ...data };
  d.competing.push(row);
  persist();
  return row;
}

// ── Products / Orders (stub) ────────────────────────────

export function demoSearchProducts(term: string): DemoProduct[] {
  const q = (term || '').toLowerCase();
  return ensureLoaded().products.filter(
    (p) => p.IsActive && (p.Name.toLowerCase().includes(q) || p.ProductCode.toLowerCase().includes(q))
  ).slice(0, 25);
}

export function demoGetProduct(id: string): DemoProduct | null {
  return ensureLoaded().products.find((p) => p.Id === id) || null;
}

export function demoPlaceOrder(visitId: string, items: { productId: string; quantity: number; unitPrice: number; name: string }[]): { orderId: string; total: number } {
  const d = ensureLoaded();
  const visit = d.visits.find((v) => v.Id === visitId);
  if (!visit) throw new Error('Visit not found');
  const total = items.reduce((s, i) => s + i.unitPrice * i.quantity, 0);
  const orderId = nextId('dord');
  visit.Order__c = orderId;
  visit.Order_Value__c = (visit.Order_Value__c || 0) + total;
  persist();
  return { orderId, total };
}

// ── Onboarding ──────────────────────────────────────────

export function demoCreateOnboarding(data: Record<string, any>, submittedBy: string): DemoOnboarding {
  const d = ensureLoaded();
  const row: DemoOnboarding = {
    Id: nextId('donb'),
    enterprise: data.onb_enterprise || 'Retailer',
    status: 'Submitted',
    data,
    submittedBy,
    createdAt: new Date().toISOString(),
  };
  d.onboardings.unshift(row);
  persist();
  return row;
}

export function demoUpdateOnboardingStatus(enterprise: string, status: string): void {
  const d = ensureLoaded();
  const row = d.onboardings.find((o) => o.enterprise === enterprise && o.status === 'Submitted');
  if (row) {
    row.status = status;
    persist();
  }
}

// ── Insights helpers ────────────────────────────────────

export function demoGetStoreVisitHistory(storeId: string, limit = 5) {
  return ensureLoaded().visits
    .filter((v) => v.Retail_Store_Custom__c === storeId && v.Status__c === 'Completed')
    .sort((a, b) => b.Visit_Date__c.localeCompare(a.Visit_Date__c))
    .slice(0, limit);
}

export function demoGetStoreVisitLogs(storeId: string, limit = 10) {
  return ensureLoaded().visits
    .filter((v) => v.Retail_Store_Custom__c === storeId)
    .sort((a, b) => b.Visit_Date__c.localeCompare(a.Visit_Date__c))
    .slice(0, limit)
    .map((v) => ({
      ...v,
      SFA_User__r: { Name: v.OwnerEmail || 'Demo Rep' },
    }));
}

export function demoGetRepsList() {
  return [
    { Id: 'demo_sfa_user', Name: 'Demo Field Rep', email__c: 'demo@example.com', IsActive__c: true },
    { Id: 'demo_sfa_user_2', Name: 'Alex Field Rep', email__c: 'alex@example.com', IsActive__c: true },
  ];
}

export function demoSnapshot(): DemoDb {
  return ensureLoaded();
}
