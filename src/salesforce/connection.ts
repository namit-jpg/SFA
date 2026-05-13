import jsforce from 'jsforce';
import { config } from '../config';

let conn: any = null;

export async function getConnection(): Promise<any> {
  if (conn) {
    try {
      await conn.identity();
      return conn;
    } catch {
      console.log('[SF] Session expired, reconnecting...');
      conn = null;
    }
  }

  conn = new jsforce.Connection({
    loginUrl: config.salesforce.loginUrl,
    version: '62.0',
  });

  if (config.salesforce.accessToken && config.salesforce.instanceUrl) {
    conn = new jsforce.Connection({
      instanceUrl: config.salesforce.instanceUrl,
      accessToken: config.salesforce.accessToken,
      version: '62.0',
    });
    console.log('[SF] Connected via access token');
  } else {
    await conn.login(
      config.salesforce.username,
      config.salesforce.password
    );
  }

  console.log(`[SF] Connected as ${conn.userInfo?.username}`);
  return conn;
}

export function esc(value: string): string {
  return value.replace(/\\/g, '\\\\').replace(/'/g, "\\'");
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
  const result = await c.sobject(sobject).create(data);
  if (!result.success) {
    throw new Error(`Failed to insert ${sobject}: ${JSON.stringify(result.errors)}`);
  }
  return result.id;
}

export async function updateRecord(sobject: string, id: string, data: Record<string, any>): Promise<void> {
  const c = await getConnection();
  const result = await c.sobject(sobject).update({ Id: id, ...data });
  if (!result.success) {
    throw new Error(`Failed to update ${sobject}: ${JSON.stringify(result.errors)}`);
  }
}

export async function getPicklistValues(sobject: string, field: string): Promise<string[]> {
  const c = await getConnection();
  const meta = await c.sobject(sobject).describe();
  const f = meta.fields.find((fld: any) => fld.name === field);
  if (!f || !f.picklistValues) return [];
  return f.picklistValues.map((pv: any) => pv.value).filter(Boolean);
}

export function soqlDate(dateStr: string): string {
  if (['TODAY', 'YESTERDAY', 'TOMORROW', 'LAST_WEEK', 'THIS_WEEK', 'NEXT_WEEK', 'LAST_MONTH', 'THIS_MONTH'].includes(dateStr)) {
    return dateStr;
  }
  return dateStr;
}
