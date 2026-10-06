import { NextRequest, NextResponse } from 'next/server';
import { queryOne, execute } from '@/lib/db';
import { getPool } from '@/lib/db';

/**
 * Daraja sends STK results here.
 * Always respond 200 — otherwise Daraja retries.
 */
export async function POST(req: NextRequest) {
  let payload: any;
  try {
    payload = await req.json();
  } catch {
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  console.log('[mpesa callback]', JSON.stringify(payload));

  const stk = payload?.Body?.stkCallback;
  if (!stk) return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });

  const checkoutRequestId: string = stk.CheckoutRequestID;
  const resultCode: number = stk.ResultCode;

  // Failure — mark the pending STK row
  if (resultCode !== 0) {
    await execute(
      `UPDATE mpesa_transactions
         SET match_status = 'ignored', raw_payload = ?
       WHERE transaction_code = ? AND source = 'stk'`,
      [JSON.stringify(payload), checkoutRequestId]
    );
    return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
  }

  // Success — extract metadata
  const items = stk.CallbackMetadata?.Item || [];
  const get = (name: string) => items.find((i: any) => i.Name === name)?.Value;

  const amount: number = get('Amount');
  const mpesaReceipt: string = get('MpesaReceiptNumber');
  const txnTime: string = get('TransactionDate'); // YYYYMMDDHHmmss
  const phone: string = get('PhoneNumber');

  // Find the pending STK row
  const pending = await queryOne<any>(
    `SELECT * FROM mpesa_transactions
      WHERE transaction_code = ? AND source = 'stk'`,
    [checkoutRequestId]
  );

  const pool = getPool();
  const conn = await pool.getConnection();

  try {
    await conn.beginTransaction();

    // Update the row with real receipt and time
    await conn.execute(
      `UPDATE mpesa_transactions
         SET transaction_code = ?, amount = ?, phone = ?,
             transaction_time = STR_TO_DATE(?, '%Y%m%d%H%i%s'),
             raw_payload = ?, match_status = 'auto'
       WHERE id = ?`,
      [
        mpesaReceipt,
        amount,
        String(phone),
        txnTime,
        JSON.stringify(payload),
        pending.id,
      ]
    );

    // If we know which invoice this belongs to, auto-create the payment
    if (pending.matched_invoice_id) {
      const [invRows]: any = await conn.execute(
        'SELECT * FROM invoices WHERE id = ? FOR UPDATE',
        [pending.matched_invoice_id]
      );
      const invoice = invRows[0];
      if (invoice) {
        const [payRes]: any = await conn.execute(
          `INSERT INTO payments
             (business_id, invoice_id, amount, method, reference, paid_at, notes)
           VALUES (?, ?, ?, 'mpesa', ?, STR_TO_DATE(?, '%Y%m%d%H%i%s'), ?)`,
          [
            pending.business_id,
            invoice.id,
            amount,
            mpesaReceipt,
            txnTime,
            `Auto-matched STK payment`,
          ]
        );

        await conn.execute(
          `UPDATE mpesa_transactions
             SET matched_payment_id = ?, matched_invoice_id = ?
           WHERE id = ?`,
          [payRes.insertId, invoice.id, pending.id]
        );
      }
    }

    await conn.commit();
  } catch (err) {
    await conn.rollback();
    console.error('callback processing error', err);
  } finally {
    conn.release();
  }

  return NextResponse.json({ ResultCode: 0, ResultDesc: 'Accepted' });
}