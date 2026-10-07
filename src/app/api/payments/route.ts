import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import mysql from 'mysql2/promise';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getInvoice } from '@/lib/services/invoices';
import { getPool } from '@/lib/db';

const schema = z.object({
  invoice_id: z.number().int().positive(),
  amount: z.number().positive('Amount must be greater than 0'),
  method: z.enum(['mpesa', 'cash', 'bank', 'cheque', 'card']),
  reference: z.string().max(100).optional().or(z.literal('')),
  paid_at: z.string().regex(/^\d{4}-\d{2}-\d{2}$/, 'Invalid date'),
  notes: z.string().max(500).optional().or(z.literal('')),
});

export async function POST(req: NextRequest) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });

  const payload = await verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Session expired.' }, { status: 401 });

  const business = await getActiveBusiness(payload.userId);
  if (!business) return NextResponse.json({ error: 'Business not found.' }, { status: 400 });

  const parsed = schema.safeParse(await req.json());
  if (!parsed.success) {
    return NextResponse.json({ error: parsed.error.issues[0]?.message || 'Invalid input.' }, { status: 400 });
  }

  const { invoice_id, amount, method, reference, paid_at, notes } = parsed.data;
  const invoice = await getInvoice(business.id, invoice_id);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });

  if (invoice.status === 'cancelled') {
    return NextResponse.json({ error: 'Cannot record payment on a cancelled invoice.' }, { status: 400 });
  }

  const balance = Number(invoice.total) - Number(invoice.amount_paid);
  if (amount > balance + 0.01) {
    return NextResponse.json({ error: `Amount exceeds balance (KES ${balance.toFixed(2)}). Reduce the amount or leave a note.` }, { status: 400 });
  }

  const conn = await getPool().getConnection();
  try {
    await conn.beginTransaction();
    const [result] = await conn.execute<mysql.ResultSetHeader>(
      `INSERT INTO payments
         (business_id, invoice_id, amount, method, reference, paid_at, notes, recorded_by)
       VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
      [business.id, invoice_id, amount, method, reference || null, `${paid_at} 12:00:00`, notes || null, payload.userId]
    );

    // Recompute from all payments so the invoice stays correct after edits or retries.
    const [paidRows] = await conn.execute<mysql.RowDataPacket[]>(
      `SELECT COALESCE(SUM(amount), 0) AS total_paid
         FROM payments
        WHERE invoice_id = ?`,
      [invoice_id]
    );
    const newPaid = Number(paidRows[0]?.total_paid ?? 0);

    const [invRows] = await conn.execute<mysql.RowDataPacket[]>(
      'SELECT total, status FROM invoices WHERE id = ? AND business_id = ? FOR UPDATE',
      [invoice_id, business.id]
    );
    const freshInvoice = invRows[0];
    if (!freshInvoice) throw new Error('Invoice disappeared during payment recording');

    const freshTotal = Number(freshInvoice.total);
    const currentStatus = String(freshInvoice.status);
    let newStatus = currentStatus;
    if (currentStatus !== 'cancelled') {
      if (newPaid >= freshTotal - 0.01) {
        newStatus = 'paid';
      } else if (newPaid > 0) {
        newStatus = 'partial';
      } else {
        newStatus = 'sent';
      }
    }

    await conn.execute(
      `UPDATE invoices
          SET amount_paid = ?, status = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ? AND business_id = ?`,
      [newPaid, newStatus, invoice_id, business.id]
    );

    await conn.commit();
    return NextResponse.json({ ok: true, payment_id: result.insertId, message: 'Payment recorded.' }, { status: 201 });
  } catch (error) {
    await conn.rollback();
    console.error('[payment]', error);
    return NextResponse.json({ error: 'Could not record payment. Try again.' }, { status: 500 });
  } finally {
    conn.release();
  }
}