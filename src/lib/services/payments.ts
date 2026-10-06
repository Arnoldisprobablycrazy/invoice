import { query, queryOne, execute } from '@/lib/db';
import type { Payment, PaymentMethod } from '@/lib/types';

export async function listInvoicePayments(
  businessId: number,
  invoiceId: number
): Promise<Payment[]> {
  return query<Payment>(
    'SELECT * FROM payments WHERE business_id = ? AND invoice_id = ? ORDER BY paid_at DESC, id DESC',
    [businessId, invoiceId]
  );
}

export async function recordPayment(input: {
  businessId: number;
  invoiceId: number;
  amount: number;
  method: PaymentMethod;
  reference?: string;
  paidAt: string;
  notes?: string;
  recordedBy: number;
}): Promise<Payment | null> {
  const result = await execute(
    `INSERT INTO payments
      (business_id, invoice_id, amount, method, reference, paid_at, notes, recorded_by)
     VALUES (?, ?, ?, ?, ?, ?, ?, ?)`,
    [
      input.businessId,
      input.invoiceId,
      input.amount,
      input.method,
      input.reference || null,
      input.paidAt,
      input.notes || null,
      input.recordedBy,
    ]
  );

  await execute(
    `UPDATE invoices
        SET amount_paid = amount_paid + ?,
            status = CASE
              WHEN amount_paid + ? >= total THEN 'paid'
              WHEN amount_paid + ? > 0 THEN 'partial'
              ELSE status
            END
      WHERE id = ? AND business_id = ?`,
    [input.amount, input.amount, input.amount, input.invoiceId, input.businessId]
  );

  return queryOne<Payment>('SELECT * FROM payments WHERE id = ?', [result.lastId]);
}