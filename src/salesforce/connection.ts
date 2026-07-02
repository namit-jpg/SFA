import jsforce from 'jsforce';
import { config } from '../config';

let conn: any = null;
const describeCache = new Map<string, Promise<any>>();

type PicklistFieldMeta = {
  type: string;
  restrictedPicklist: boolean;
  values: Set<string>;
};

type FieldValidationMeta = PicklistFieldMeta & {
  referenceTo: string[];
};

export async function getConnection(): Promise<any> {
  if (conn) {
    try {
      await conn.query('SELECT Id FROM User LIMIT 1');
      return conn;
    } catch (e) {
      console.log('[SF] Session check failed, reconnecting...');
      conn = null;
      describeCache.clear();
    }
  }

  const hasCredentials = config.salesforce.username && config.salesforce.password;

  if (hasCredentials) {
    const c = new jsforce.Connection({
      loginUrl: config.salesforce.loginUrl,
      version: '62.0',
    });
    try {
      await c.login(config.salesforce.username, config.salesforce.password);
    } catch (e) {
      console.error('[SF] Login failed:', e);
      throw e;
    }
    conn = c;
    console.log('[SF] Connected via username/password');
  } else if (config.salesforce.accessToken && config.salesforce.instanceUrl) {
    conn = new jsforce.Connection({
      instanceUrl: config.salesforce.instanceUrl,
      accessToken: config.salesforce.accessToken,
      version: '62.0',
    });
    console.log('[SF] Connected via access token');
  } else {
    throw new Error('[SF] No credentials available — set SF_USERNAME+SF_PASSWORD or SF_ACCESS_TOKEN+SF_INSTANCE_URL');
  }

  console.log(`[SF] Connected as ${(conn as any).userInfo?.username ?? 'unknown'}`);
  return conn;
}

export function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
}

export function escLike(value: string): string {
  return esc(value).replace(/%/g, '\\%').replace(/_/g, '\\_');
}

export async function query<T = any>(soql: string): Promise<T[]> {
  const c = await getConnection();
  const result = await c.query(soql);
  return result.records as T[];
}

export async function queryOne<T = any>(soql: string): Promise<T | null> {
  const records = await query<T>(soql);
  return records.length > 0 ? records[0] : null;
}

export async function querySObject<T = any>(
  sobject: string,
  fields: string[],
  where?: Record<string, any>,
  options?: { orderBy?: string; limit?: number }
): Promise<T[]> {
  const c = await getConnection();
  let q = c.sobject(sobject).find(fields, where || {});
  if (options?.orderBy) {
    const [field, dir] = options.orderBy.split(' ');
    q = q.sort({ [field]: dir === 'DESC' ? -1 : 1 });
  }
  if (options?.limit) {
    q = q.limit(options.limit);
  }
  return q.execute() as Promise<T[]>;
}

export async function insertRecord(sobject: string, data: Record<string, any>): Promise<string> {
  const c = await getConnection();
  await validateFieldValues(c, sobject, data);
  const result = await c.sobject(sobject).create(data);
  if (!result.success) {
    throw new Error(`Failed to insert ${sobject}: ${JSON.stringify(result.errors)}`);
  }
  return result.id;
}

export async function updateRecord(sobject: string, id: string, data: Record<string, any>): Promise<void> {
  const c = await getConnection();
  await validateFieldValues(c, sobject, data);
  const result = await c.sobject(sobject).update({ Id: id, ...data });
  if (!result.success) {
    throw new Error(`Failed to update ${sobject}: ${JSON.stringify(result.errors)}`);
  }
}

export async function getPicklistValues(sobject: string, field: string): Promise<string[]> {
  const c = await getConnection();
  const meta = await describeSObject(c, sobject);
  const f = meta.fields.find((fld: any) => fld.name === field);
  if (!f || !f.picklistValues) return [];
  return f.picklistValues.filter((pv: any) => pv.active !== false).map((pv: any) => pv.value).filter(Boolean);
}

async function describeSObject(c: any, sobject: string): Promise<any> {
  if (!describeCache.has(sobject)) {
    describeCache.set(sobject, c.sobject(sobject).describe());
  }
  return describeCache.get(sobject)!;
}

async function getValidationFields(c: any, sobject: string): Promise<Map<string, FieldValidationMeta>> {
  const meta = await describeSObject(c, sobject);
  const fields = new Map<string, FieldValidationMeta>();
  for (const field of meta.fields || []) {
    const isRestrictedPicklist = field.restrictedPicklist && ['picklist', 'multipicklist'].includes(field.type);
    const isReference = field.type === 'reference' && Array.isArray(field.referenceTo) && field.referenceTo.length > 0;
    if (!isRestrictedPicklist && !isReference) continue;
    fields.set(field.name, {
      type: field.type,
      restrictedPicklist: !!field.restrictedPicklist,
      referenceTo: field.referenceTo || [],
      values: new Set(
        (field.picklistValues || [])
          .filter((pv: any) => pv.active !== false)
          .map((pv: any) => pv.value)
          .filter(Boolean)
      ),
    });
  }
  return fields;
}

async function validateFieldValues(c: any, sobject: string, data: Record<string, any>): Promise<void> {
  const fields = await getValidationFields(c, sobject);
  const errors: string[] = [];

  for (const [fieldName, value] of Object.entries(data)) {
    if (value === undefined || value === null || value === '') continue;
    const meta = fields.get(fieldName);
    if (!meta) continue;

    if (meta.restrictedPicklist) {
      const submittedValues = meta.type === 'multipicklist'
        ? String(value).split(';').map(v => v.trim()).filter(Boolean)
        : [String(value)];

      const invalidValues = submittedValues.filter(v => !meta.values.has(v));
      if (invalidValues.length > 0) {
        errors.push(`${sobject}.${fieldName}: "${invalidValues.join('", "')}" is invalid. Use one of: ${[...meta.values].join(', ')}`);
      }
      continue;
    }

    if (meta.type === 'reference') {
      const id = String(value);
      if (!looksLikeSalesforceId(id)) {
        errors.push(`${sobject}.${fieldName}: "${id}" is not a Salesforce record id`);
        continue;
      }
      const allowedPrefixes = await getKeyPrefixes(c, meta.referenceTo);
      if (allowedPrefixes.size > 0 && !allowedPrefixes.has(id.slice(0, 3))) {
        errors.push(`${sobject}.${fieldName}: "${id}" has the wrong id type. Expected ${meta.referenceTo.join(' or ')}`);
      }
    }
  }

  if (errors.length > 0) {
    throw new Error(`Salesforce field validation failed: ${errors.join(' | ')}`);
  }
}

function looksLikeSalesforceId(value: string): boolean {
  return /^[a-zA-Z0-9]{15}([a-zA-Z0-9]{3})?$/.test(value);
}

async function getKeyPrefixes(c: any, referenceTo: string[]): Promise<Set<string>> {
  const prefixes = new Set<string>();
  for (const refObject of referenceTo) {
    const meta = await describeSObject(c, refObject);
    if (meta.keyPrefix) prefixes.add(meta.keyPrefix);
  }
  return prefixes;
}

const SOQL_DATE_LITERALS = new Set(['TODAY', 'YESTERDAY', 'TOMORROW', 'LAST_WEEK', 'THIS_WEEK', 'NEXT_WEEK', 'LAST_MONTH', 'THIS_MONTH']);

export function soqlDate(dateStr: string): string {
  if (SOQL_DATE_LITERALS.has(dateStr)) return dateStr;
  return dateStr;
}
