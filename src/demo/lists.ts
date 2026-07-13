/**
 * Slack Lists bootstrap + write helpers for DEMO_MODE client proof.
 * Creates Lists via API when missing; persists IDs/column maps to disk.
 */
import * as fs from 'fs';
import * as path from 'path';
import { config } from '../config';

export type ListKey = 'visits' | 'stores' | 'expenses' | 'surveys' | 'onboarding';

export interface ListColumnMap {
  [key: string]: string; // logical key -> Col... id
}

export interface ListMeta {
  listId: string;
  columns: ListColumnMap;
  name: string;
}

export type ListsRegistry = Partial<Record<ListKey, ListMeta>>;

const REGISTRY_FILE = () =>
  path.resolve(process.cwd(), 'data', 'demo-lists.json');

let registry: ListsRegistry | null = null;
let bootstrapped = false;

function loadRegistry(): ListsRegistry {
  if (registry) return registry;
  const p = REGISTRY_FILE();
  if (fs.existsSync(p)) {
    try {
      registry = JSON.parse(fs.readFileSync(p, 'utf8')) as ListsRegistry;
      return registry!;
    } catch {
      registry = {};
    }
  } else {
    registry = {};
  }
  return registry!;
}

function saveRegistry(): void {
  if (!registry) return;
  const p = REGISTRY_FILE();
  const dir = path.dirname(p);
  if (!fs.existsSync(dir)) fs.mkdirSync(dir, { recursive: true });
  fs.writeFileSync(p, JSON.stringify(registry, null, 2), 'utf8');
}

function desc(text: string) {
  return [
    {
      type: 'rich_text',
      elements: [
        {
          type: 'rich_text_section',
          elements: [{ type: 'text', text }],
        },
      ],
    },
  ];
}

const LIST_SCHEMAS: Record<ListKey, { name: string; description: string; schema: any[] }> = {
  visits: {
    name: 'SFA Demo — Visits',
    description: 'Demo proof of Create/Start/End Visit (DEMO_MODE). Not Salesforce.',
    schema: [
      { key: 'title', name: 'Visit', type: 'text', is_primary_column: true },
      { key: 'status', name: 'Status', type: 'select', options: {
        format: 'single_select',
        choices: [
          { value: 'planned', label: 'Planned', color: 'blue' },
          { value: 'in_progress', label: 'In Progress', color: 'yellow' },
          { value: 'completed', label: 'Completed', color: 'green' },
          { value: 'cancelled', label: 'Cancelled', color: 'red' },
          { value: 'updated', label: 'Updated', color: 'gray' },
        ],
      } },
      { key: 'store', name: 'Store / Retailer', type: 'text' },
      { key: 'visit_date', name: 'Visit Date', type: 'date' },
      { key: 'purpose', name: 'Purpose', type: 'text' },
      { key: 'notes', name: 'Notes', type: 'text' },
      { key: 'demo_id', name: 'Demo Id', type: 'text' },
    ],
  },
  stores: {
    name: 'SFA Demo — Stores',
    description: 'Demo retailer / store catalog for Create Visit search.',
    schema: [
      { key: 'title', name: 'Store', type: 'text', is_primary_column: true },
      { key: 'account', name: 'Account', type: 'text' },
      { key: 'code', name: 'Store Code', type: 'text' },
      { key: 'city', name: 'City', type: 'text' },
      { key: 'demo_id', name: 'Demo Id', type: 'text' },
    ],
  },
  expenses: {
    name: 'SFA Demo — Expenses',
    description: 'Demo expenses recorded against visits.',
    schema: [
      { key: 'title', name: 'Expense', type: 'text', is_primary_column: true },
      { key: 'category', name: 'Category', type: 'text' },
      { key: 'amount', name: 'Amount', type: 'number', options: { precision: 2 } },
      { key: 'visit', name: 'Visit Id', type: 'text' },
      { key: 'expense_date', name: 'Date', type: 'date' },
      { key: 'description', name: 'Description', type: 'text' },
    ],
  },
  surveys: {
    name: 'SFA Demo — Surveys',
    description: 'Demo survey responses from field visits.',
    schema: [
      { key: 'title', name: 'Response', type: 'text', is_primary_column: true },
      { key: 'visit', name: 'Visit Id', type: 'text' },
      { key: 'survey_type', name: 'Type', type: 'text' },
      { key: 'question', name: 'Question', type: 'text' },
      { key: 'answer', name: 'Answer', type: 'text' },
    ],
  },
  onboarding: {
    name: 'SFA Demo — Onboarding',
    description: 'Demo retailer onboarding requests and approvals.',
    schema: [
      { key: 'title', name: 'Enterprise', type: 'text', is_primary_column: true },
      { key: 'status', name: 'Status', type: 'select', options: {
        format: 'single_select',
        choices: [
          { value: 'submitted', label: 'Submitted', color: 'yellow' },
          { value: 'approved', label: 'Approved', color: 'green' },
          { value: 'rejected', label: 'Rejected', color: 'red' },
        ],
      } },
      { key: 'contact', name: 'Contact', type: 'text' },
      { key: 'phone', name: 'Phone', type: 'text' },
      { key: 'email', name: 'Email', type: 'email' },
      { key: 'city', name: 'City', type: 'text' },
      { key: 'notes', name: 'Notes', type: 'text' },
    ],
  },
};

function mapColumnsFromMetadata(schema: any[] | undefined): ListColumnMap {
  const columns: ListColumnMap = {};
  if (!Array.isArray(schema)) return columns;
  for (const col of schema) {
    if (col?.key && col?.id) columns[col.key] = col.id;
  }
  return columns;
}

async function apiCall(client: any, method: string, args: Record<string, any>): Promise<any> {
  if (typeof client.apiCall === 'function') {
    return client.apiCall(method, args);
  }
  // Bolt WebClient methods sometimes use dotted names as properties
  const parts = method.split('.');
  let fn: any = client;
  for (const p of parts) {
    fn = fn?.[p];
  }
  if (typeof fn === 'function') return fn.call(client, args);
  throw new Error(`Slack client cannot call ${method}`);
}

async function createList(client: any, key: ListKey): Promise<ListMeta> {
  const def = LIST_SCHEMAS[key];
  const res = await apiCall(client, 'slackLists.create', {
    name: def.name,
    description_blocks: desc(def.description),
    schema: def.schema,
  });
  if (!res?.ok) {
    throw new Error(res?.error || `slackLists.create failed for ${key}`);
  }
  const listId = res.list_id || res.list?.id;
  if (!listId) throw new Error(`No list_id returned for ${key}`);
  const columns = mapColumnsFromMetadata(res.list_metadata?.schema);
  // Fallback: if metadata missing keys, map by schema key order is unavailable — keep empty
  const meta: ListMeta = { listId, columns, name: def.name };
  console.log(`[Demo Lists] Created "${def.name}" → ${listId} (${Object.keys(columns).length} columns)`);
  return meta;
}

function applyEnvOverrides(reg: ListsRegistry): void {
  const envMap: Record<ListKey, string> = {
    visits: config.demoLists.visits,
    stores: config.demoLists.stores,
    expenses: config.demoLists.expenses,
    surveys: config.demoLists.surveys,
    onboarding: config.demoLists.onboarding,
  };
  for (const key of Object.keys(envMap) as ListKey[]) {
    const id = envMap[key];
    if (!id) continue;
    if (!reg[key]) {
      reg[key] = { listId: id, columns: {}, name: LIST_SCHEMAS[key].name };
    } else if (reg[key]!.listId !== id) {
      reg[key] = { listId: id, columns: reg[key]!.columns || {}, name: LIST_SCHEMAS[key].name };
    }
  }
}

/**
 * Ensure all demo Lists exist. Safe to call multiple times.
 * Requires bot token with lists:write (paid Slack plan).
 */
export async function bootstrapDemoLists(client: any): Promise<ListsRegistry> {
  if (!config.demoMode) return {};
  const reg = loadRegistry();
  applyEnvOverrides(reg);

  const keys: ListKey[] = ['visits', 'stores', 'expenses', 'surveys', 'onboarding'];
  let created = 0;
  let failed = 0;

  for (const key of keys) {
    if (reg[key]?.listId) continue;
    try {
      reg[key] = await createList(client, key);
      created++;
      // Small delay to avoid rate limits
      await new Promise((r) => setTimeout(r, 300));
    } catch (e: any) {
      failed++;
      const err = e?.data?.error || e?.message || String(e);
      console.error(`[Demo Lists] Failed to create ${key}: ${err}`);
      if (err === 'missing_scope' || err === 'not_allowed_token_type') {
        console.error('[Demo Lists] Reinstall the Slack app with lists:read + lists:write scopes.');
      }
      if (err === 'paid_teams_only' || String(err).includes('paid')) {
        console.error('[Demo Lists] Slack Lists require a paid workspace.');
      }
    }
  }

  registry = reg;
  saveRegistry();
  bootstrapped = true;

  if (created > 0) console.log(`[Demo Lists] Bootstrap complete: ${created} created, ${failed} failed`);
  else if (failed === 0) console.log('[Demo Lists] Registry ready (using saved/env list IDs)');
  else console.log(`[Demo Lists] Bootstrap partial: ${failed} list(s) missing — channel proof still works`);

  return reg;
}

export function getListMeta(key: ListKey): ListMeta | null {
  const reg = loadRegistry();
  applyEnvOverrides(reg);
  return reg[key] || null;
}

export function isListsReady(): boolean {
  return bootstrapped || Object.keys(loadRegistry()).length > 0;
}

function richTextField(columnId: string, text: string) {
  return {
    column_id: columnId,
    rich_text: [
      {
        type: 'rich_text',
        elements: [
          {
            type: 'rich_text_section',
            elements: [{ type: 'text', text: String(text).slice(0, 2000) || '—' }],
          },
        ],
      },
    ],
  };
}

function selectField(columnId: string, value: string) {
  return { column_id: columnId, select: [value] };
}

function dateField(columnId: string, ymd: string) {
  // Accept ISO or YYYY-MM-DD
  const d = String(ymd).slice(0, 10);
  return { column_id: columnId, date: [d] };
}

function numberField(columnId: string, n: number) {
  return { column_id: columnId, number: [n] };
}

function emailField(columnId: string, email: string) {
  return { column_id: columnId, email: [email] };
}

function statusSelectValue(raw: string): string {
  const s = String(raw || '').toLowerCase().replace(/\s+/g, '_');
  if (s.includes('progress')) return 'in_progress';
  if (s.includes('complete')) return 'completed';
  if (s.includes('cancel')) return 'cancelled';
  if (s.includes('plan')) return 'planned';
  if (s.includes('approv')) return 'approved';
  if (s.includes('reject')) return 'rejected';
  if (s.includes('submit')) return 'submitted';
  if (['planned', 'in_progress', 'completed', 'cancelled', 'updated', 'submitted', 'approved', 'rejected'].includes(s)) {
    return s;
  }
  return 'updated';
}

/**
 * Append a structured row to the appropriate demo List.
 */
export async function appendListItem(
  client: any,
  kind: string,
  summary: string,
  fields: Record<string, string | number | null | undefined> = {}
): Promise<void> {
  if (!config.demoMode || !client) return;

  const k = kind.toLowerCase();
  let key: ListKey = 'visits';
  if (k.includes('store')) key = 'stores';
  else if (k.includes('expense')) key = 'expenses';
  else if (k.includes('survey')) key = 'surveys';
  else if (k.includes('onboard')) key = 'onboarding';
  else key = 'visits';

  const meta = getListMeta(key);
  if (!meta?.listId) return;

  const col = meta.columns;
  const initial: any[] = [];

  const putText = (logical: string, value: string | number | null | undefined) => {
    if (value === undefined || value === null || value === '') return;
    const id = col[logical];
    if (!id) return;
    initial.push(richTextField(id, String(value)));
  };

  // Primary title always set
  if (col.title) {
    initial.push(richTextField(col.title, summary || kind));
  }

  if (key === 'visits') {
    if (col.status) {
      const st = fields.Status ?? fields.status ?? (k.includes('created') ? 'planned' : 'updated');
      initial.push(selectField(col.status, statusSelectValue(String(st))));
    }
    putText('store', fields.Store ?? fields.store ?? fields.retailer);
    if (col.visit_date && (fields.Date || fields.date || fields.Visit_Date__c)) {
      initial.push(dateField(col.visit_date, String(fields.Date || fields.date || fields.Visit_Date__c)));
    }
    putText('purpose', fields.Purpose ?? fields.purpose);
    putText('notes', fields.Notes ?? fields.notes ?? fields.Visit_Notes__c);
    putText('demo_id', fields.Visit ?? fields.visitId ?? fields.Id);
  } else if (key === 'stores') {
    putText('account', fields.Account ?? fields.account ?? fields.Store);
    putText('code', fields.Code ?? fields.code);
    putText('city', fields.City ?? fields.city);
    putText('demo_id', fields.Id ?? fields.demo_id);
  } else if (key === 'expenses') {
    putText('category', fields.Category ?? fields.category);
    if (col.amount && fields.Amount != null) {
      initial.push(numberField(col.amount, Number(fields.Amount)));
    }
    putText('visit', fields.Visit ?? fields.visitId);
    if (col.expense_date && (fields.Date || fields.date)) {
      initial.push(dateField(col.expense_date, String(fields.Date || fields.date)));
    }
    putText('description', fields.Description ?? fields.description);
  } else if (key === 'surveys') {
    putText('visit', fields.Visit ?? fields.visitId);
    putText('survey_type', fields.Type ?? fields.type);
    putText('question', fields.Question ?? fields.question);
    putText('answer', fields.Answer ?? fields.answer);
  } else if (key === 'onboarding') {
    if (col.status) {
      const st = fields.Status ?? fields.status ?? 'submitted';
      initial.push(selectField(col.status, statusSelectValue(String(st))));
    }
    putText('contact', fields.Contact ?? fields.contact);
    putText('phone', fields.Phone ?? fields.phone);
    if (col.email && (fields.Email || fields.email)) {
      initial.push(emailField(col.email, String(fields.Email || fields.email)));
    }
    putText('city', fields.City ?? fields.city);
    putText('notes', fields.Notes ?? fields.notes);
  }

  // If we only have list id but no column map, still try empty create so something shows
  try {
    const res = await apiCall(client, 'slackLists.items.create', {
      list_id: meta.listId,
      initial_fields: initial,
    });
    if (res?.ok === false) {
      console.log(`[Demo Lists] items.create failed (${res.error}) for ${key}`);
      return;
    }
    console.log(`[Demo Lists] Row added to ${meta.name} (${meta.listId}): ${summary}`);
  } catch (e: any) {
    console.log(`[Demo Lists] items.create error: ${e?.data?.error || e?.message || e}`);
  }
}

/**
 * Seed store rows into the Stores list once (idempotent via registry flag).
 */
export async function seedStoresList(client: any, stores: { Id: string; Name: string; AccountName: string; Store_Code__c?: string; City?: string }[]): Promise<void> {
  const reg = loadRegistry() as ListsRegistry & { storesSeeded?: boolean };
  if ((reg as any).storesSeeded) return;
  const meta = getListMeta('stores');
  if (!meta?.listId || !meta.columns.title) return;

  for (const s of stores.slice(0, 25)) {
    await appendListItem(client, 'store', s.AccountName || s.Name, {
      Account: s.AccountName,
      Code: s.Store_Code__c || '',
      City: s.City || '',
      Id: s.Id,
    });
    await new Promise((r) => setTimeout(r, 200));
  }
  (reg as any).storesSeeded = true;
  registry = reg;
  saveRegistry();
  console.log(`[Demo Lists] Seeded ${Math.min(stores.length, 25)} stores into Lists`);
}
