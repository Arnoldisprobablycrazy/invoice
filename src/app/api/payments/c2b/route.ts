import { NextRequest, NextResponse } from 'next/server';
import { queryOne } from '@/lib/db';
import { getPool } from '@/lib/db';
import { normalizePhone } from '@/lib/mpesa';

/**
 * Handle both validation and confirmation.
 * Register this URL twice with Daraja (validation + confirmation).
 */
export async function POST(req: NextRequest) {
  const url = new URL(req.url);
  const kind = url.searchParams.get('kind') || 'confirmation';

  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  if (kind === 'validation') {
    // Optional: reject transactions here if you want.
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // Confirmation — store raw, try to match
  const {
    TransID, TransAmount, MSISDN, BillRefNumber, TransTime, FirstName, MiddleName, LastName,
  } = payload;

  if (!TransID) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  const payerName = [FirstName, MiddleName, LastName].filter(Boolean).join(' ').trim() || null;
  const amount = Number(TransAmount);

  // Which business owns this shortcode? For MVP, assume single-tenant per shortcode.
  // In production, look up by BillRefNumber prefix or shortcode.
  const business = await queryOne<any>(
    `SELECT * FROM businesses LIMIT 1` // <-- replace with shortcode lookup
  );
  if (!business) {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // Try to match invoice by account reference (BillRefNumber = invoice number)
  let matchedInvoiceId: number | null = null;
  if (BillRefNumber) {
    const inv = await queryOne<any>(
      `SELECT id FROM invoices
        WHERE business_id = ? AND invoice_number = ?
        LIMIT 1`,
      [business.id, BillRefNumber.trim()]
    );
    if (inv) matchedInvoiceId = inv.id;
  }

  const matchStatus = matchedInvoiceId ? 'auto' : 'unmatched';

  const pool = getPool();
  const conn = await pool.getConnection();
  try {
    await conn.beginTransaction();

    // Insert raw transaction (ignore duplicate by TransID)
    const [insRes]: any = await conn.execute(
      `INSERT IGNORE INTO mpesa_transactions
         (business_id, transaction_code, amount, phone, payer_name,
          account_reference, transaction_time, raw_payload, source,
          match_status, matched_invoice_id)
       VALUES (?, ?, ?, ?, ?, ?, STR_TO_DATE(?, '%Y%m%d%H%i%s'), ?, 'c2b', ?, ?)`,
      [
        business.id,
        TransID,
        amount,
        normalizePhone(String(MSISDN)),
        payerName,
        BillRefNumber || null,
        TransTime,
        JSON.stringify(payload),
        matchStatus,
        matchedInvoiceId,
      ]
    );

    // If auto-matched, create payment
    if (matchedInvoiceId && insRes.affectedRows > 0) {
      const [payRes]: any = await conn.execute(
        `INSERT INTO payments
           (business_id, invoice_id, amount, method, reference, paid_at, notes)
         VALUES (?, ?, ?, 'mpesa', ?, STR_TO_DATE(?, '%Y%m%d%H%i%s'), ?)`,
        [
          business.id,
          matchedInvoiceId,
          amount,
          TransID,
          TransTime,
          `C2B payment from ${payerName || MSISDN}`,
        ]
      );
      await conn.execute(
        `UPDATE mpesa_transactions
           SET matched_payment_id = ? WHERE transaction_code = ?`,
        [payRes.insertId, TransID]
      );
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('C2B error', err);
  } finally {
    conn.release();
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}