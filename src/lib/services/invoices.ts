import { randomBytes } from 'crypto';
import { query, queryOne, execute } from '@/lib/db';
import type { CreateInvoiceInput } from '@/lib/validators/invoice';
import type { Invoice, InvoiceItem, InvoiceListItem, InvoiceWithRelations } from '@/lib/types';

/**
 * Generate next invoice number for a business and lock the row
 * so concurrent requests don't collide.
 */
async function nextInvoiceNumber(
  conn: any,
  businessId: number
): Promise<string> {
  const [rows]: any = await conn.execute(
    'SELECT invoice_prefix, next_invoice_number FROM businesses WHERE id = ? FOR UPDATE',
    [businessId]
  );
  if (!rows.length) throw new Error('Business not found');

  const { invoice_prefix, next_invoice_number } = rows[0];
  const year = new Date().getFullYear();
  const number = `${invoice_prefix}-${year}-${String(next_invoice_number).padStart(4, '0')}`;

  await conn.execute(
    'UPDATE businesses SET next_invoice_number = next_invoice_number + 1 WHERE id = ?',
    [businessId]
  );

  return number;
}

function computeTotals(items: CreateInvoiceInput['items']) {
  let subtotal = 0;
  let tax_amount = 0;

  const computed = items.map((item, i) => {
    const line = item.quantity * item.unit_price;
    const tax = (line * item.tax_rate) / 100;
    subtotal += line;
    tax_amount += tax;
    return {
      ...item,
      line_total: round2(line),
      sort_order: i,
    };
  });

  return {
    items: computed,
    subtotal: round2(subtotal),
    tax_amount: round2(tax_amount),
    total: round2(subtotal + tax_amount),
  };
}

function round2(n: number) {
  return Math.round(n * 100) / 100;
}

/**
 * Create an invoice inside a transaction.
 * Handles: new client creation, invoice number generation, item insert.
 */
export async function createInvoice(
  businessId: number,
  input: CreateInvoiceInput
): Promise<Invoice> {
  const { getPool } = await import('@/lib/db');
  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // 1. Resolve client (existing or create)
    let clientId = input.client_id;
    if (!clientId && input.new_client) {
      const [res]: any = await conn.execute(
        `INSERT INTO clients (business_id, name, phone, email, kra_pin, address)
         VALUES (?, ?, ?, ?, ?, ?)`,
        [
          businessId,
          input.new_client.name,
          input.new_client.phone || null,
          input.new_client.email || null,
          input.new_client.kra_pin || null,
          input.new_client.address || null,
        ]
      );
      clientId = res.insertId;
    }
    if (!clientId) throw new Error('Client required');

    // 2. Compute totals
    const { items, subtotal, tax_amount, total } = computeTotals(input.items);

    // 3. Generate invoice number
    const invoiceNumber = await nextInvoiceNumber(conn, businessId);

    // 4. Public token for shareable link
    const publicToken = randomBytes(16).toString('hex');

    // 5. Insert invoice
    const [invRes]: any = await conn.execute(
      `INSERT INTO invoices
        (business_id, client_id, invoice_number, issue_date, due_date,
         status, subtotal, tax_amount, total, amount_paid,
         notes, terms, public_token)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, 0, ?, ?, ?)`,
      [
        businessId,
        clientId,
        invoiceNumber,
        input.issue_date,
        input.due_date,
        input.status,
        subtotal,
        tax_amount,
        total,
        input.notes || null,
        input.terms || null,
        publicToken,
      ]
    );
    const invoiceId = invRes.insertId;

    // 6. Bulk-insert items
    const itemValues = items.map((it) => [
      invoiceId,
      it.product_id ?? null,
      it.description,
      it.quantity,
      it.unit_price,
      it.tax_rate,
      it.line_total,
      it.sort_order,
    ]);

    await conn.query(
      `INSERT INTO invoice_items
         (invoice_id, product_id, description, quantity, unit_price, tax_rate, line_total, sort_order)
       VALUES ?`,
      [itemValues]
    );

    await conn.commit();

    const invoice = await queryOne<Invoice>(
      'SELECT * FROM invoices WHERE id = ?',
      [invoiceId]
    );
    return invoice!;
  } catch (err) {
    await conn.rollback();
    throw err;
  } finally {
    conn.release();
  }
}

export async function getInvoice(
  businessId: number,
  invoiceId: number
): Promise<InvoiceWithRelations | null> {
  const invoice = await queryOne<Invoice>(
    'SELECT * FROM invoices WHERE id = ? AND business_id = ?',
    [invoiceId, businessId]
  );
  if (!invoice) return null;

  const [client, business, items] = await Promise.all([
    queryOne<any>('SELECT * FROM clients WHERE id = ?', [invoice.client_id]),
    queryOne<any>('SELECT * FROM businesses WHERE id = ?', [businessId]),
    query<InvoiceItem>(
      'SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order',
      [invoiceId]
    ),
  ]);

  return { ...invoice, client: client!, business: business!, items };
}

export async function listInvoices(
  businessId: number,
  opts: { status?: string; q?: string; limit?: number; offset?: number } = {}
): Promise<{ invoices: InvoiceListItem[]; total: number }> {
  const limit = Math.min(opts.limit ?? 20, 200);
  const offset = opts.offset ?? 0;

  const where: string[] = ['i.business_id = ?'];
  const params: (string | number | boolean)[] = [businessId];

  if (opts.status && opts.status !== 'all') {
    where.push('i.status = ?');
    params.push(opts.status);
  }

  if (opts.q?.trim()) {
    where.push('(i.invoice_number LIKE ? OR c.name LIKE ?)');
    const searchValue = `%${opts.q.trim()}%`;
    params.push(searchValue, searchValue);
  }

  const whereSql = where.join(' AND ');

  const [rows, countRow] = await Promise.all([
    query<InvoiceListItem>(
      `SELECT i.*, c.name AS client_name
         FROM invoices i
         JOIN clients c ON c.id = i.client_id
        WHERE ${whereSql}
        ORDER BY i.created_at DESC LIMIT ? OFFSET ?`,
      [...params, limit, offset]
    ),
    queryOne<{ c: number }>(
      `SELECT COUNT(*) as c FROM invoices i JOIN clients c ON c.id = i.client_id WHERE ${whereSql}`,
      params
    ),
  ]);

  return { invoices: rows, total: countRow?.c ?? 0 };
}