import { query, queryOne, execute } from '@/lib/db';
import type { Client } from '@/lib/types';

export interface ClientWithStats extends Client {
  invoice_count: number;
  total_billed: number;
  total_paid: number;
  outstanding: number;
  last_invoice_date: string | null;
}

/**
 * List clients for a business, with aggregated invoice stats.
 */
export async function listClients(
  businessId: number,
  opts: { q?: string } = {}
): Promise<ClientWithStats[]> {
  const params: any[] = [businessId];

  let searchSql = '';
  if (opts.q?.trim()) {
    searchSql = 'AND (c.name LIKE ? OR c.phone LIKE ? OR c.email LIKE ?)';
    const like = `%${opts.q.trim()}%`;
    params.push(like, like, like);
  }

  return query<ClientWithStats>(
    `SELECT
       c.id, c.business_id, c.name, c.phone, c.email,
       c.kra_pin, c.address, c.notes, c.created_at, c.updated_at,
       COUNT(i.id) AS invoice_count,
       COALESCE(SUM(CASE WHEN i.status != 'cancelled' THEN i.total ELSE 0 END), 0) AS total_billed,
       COALESCE(SUM(CASE WHEN i.status != 'cancelled' THEN i.amount_paid ELSE 0 END), 0) AS total_paid,
       COALESCE(SUM(
         CASE WHEN i.status IN ('sent','partial','overdue')
              THEN i.total - i.amount_paid ELSE 0 END
       ), 0) AS outstanding,
       MAX(i.issue_date) AS last_invoice_date
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.business_id = ? ${searchSql}
     GROUP BY c.id
     ORDER BY c.name ASC`,
    params
  );
}

export async function getClient(
  businessId: number,
  clientId: number
): Promise<Client | null> {
  return queryOne<Client>(
    'SELECT * FROM clients WHERE id = ? AND business_id = ?',
    [clientId, businessId]
  );
}

export async function getClientWithStats(
  businessId: number,
  clientId: number
): Promise<ClientWithStats | null> {
  return queryOne<ClientWithStats>(
    `SELECT
       c.id, c.business_id, c.name, c.phone, c.email,
       c.kra_pin, c.address, c.notes, c.created_at, c.updated_at,
       COUNT(i.id) AS invoice_count,
       COALESCE(SUM(CASE WHEN i.status != 'cancelled' THEN i.total ELSE 0 END), 0) AS total_billed,
       COALESCE(SUM(CASE WHEN i.status != 'cancelled' THEN i.amount_paid ELSE 0 END), 0) AS total_paid,
       COALESCE(SUM(
         CASE WHEN i.status IN ('sent','partial','overdue')
              THEN i.total - i.amount_paid ELSE 0 END
       ), 0) AS outstanding,
       MAX(i.issue_date) AS last_invoice_date
     FROM clients c
     LEFT JOIN invoices i ON i.client_id = c.id
     WHERE c.id = ? AND c.business_id = ?
     GROUP BY c.id`,
    [clientId, businessId]
  );
}

export interface CreateClientInput {
  name: string;
  phone?: string | null;
  email?: string | null;
  kra_pin?: string | null;
  address?: string | null;
  notes?: string | null;
}

export async function createClient(
  businessId: number,
  input: CreateClientInput
): Promise<Client> {
  const result = await execute(
    `INSERT INTO clients
       (business_id, name, phone, email, kra_pin, address, notes)
     VALUES (?, ?, ?, ?, ?, ?, ?)`,
    [
      businessId,
      input.name.trim(),
      input.phone?.trim() || null,
      input.email?.trim() || null,
      input.kra_pin?.trim() || null,
      input.address?.trim() || null,
      input.notes?.trim() || null,
    ]
  );

  const client = await queryOne<Client>(
    'SELECT * FROM clients WHERE id = ?',
    [result.lastId]
  );
  if (!client) throw new Error('Failed to fetch created client');
  return client;
}

export async function updateClient(
  businessId: number,
  clientId: number,
  input: Partial<CreateClientInput>
): Promise<Client> {
  const fields: string[] = [];
  const params: any[] = [];

  for (const key of ['name', 'phone', 'email', 'kra_pin', 'address', 'notes'] as const) {
    if (key in input) {
      fields.push(`${key} = ?`);
      const val = input[key];
      params.push(typeof val === 'string' ? val.trim() || null : val);
    }
  }

  if (fields.length === 0) {
    const existing = await getClient(businessId, clientId);
    if (!existing) throw new Error('Client not found');
    return existing;
  }

  params.push(clientId, businessId);

  const result = await execute(
    `UPDATE clients SET ${fields.join(', ')}, updated_at = CURRENT_TIMESTAMP
     WHERE id = ? AND business_id = ?`,
    params
  );

  if (result.affectedRows === 0) {
    throw new Error('Client not found');
  }

  const client = await queryOne<Client>(
    'SELECT * FROM clients WHERE id = ?',
    [clientId]
  );
  if (!client) throw new Error('Failed to fetch updated client');
  return client;
}

export async function deleteClient(
  businessId: number,
  clientId: number
): Promise<void> {
  // Verify ownership + no invoices
  const client = await getClient(businessId, clientId);
  if (!client) throw new Error('Client not found');

  const invoiceCount = await queryOne<{ c: number }>(
    'SELECT COUNT(*) AS c FROM invoices WHERE client_id = ? AND business_id = ?',
    [clientId, businessId]
  );
  if ((invoiceCount?.c ?? 0) > 0) {
    throw new Error(
      `This client has ${invoiceCount?.c} invoice(s). Cancel or delete those invoices first.`
    );
  }

  await execute(
    'DELETE FROM clients WHERE id = ? AND business_id = ?',
    [clientId, businessId]
  );
}