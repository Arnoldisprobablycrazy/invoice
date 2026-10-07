import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { z } from 'zod';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getInvoice } from '@/lib/services/invoices';
import { stkPush, normalizePhone } from '@/lib/mpesa';
import { queryOne, execute } from '@/lib/db';

const schema = z.object({
  invoice_id: z.number().int().positive(),
  phone: z
    .string()
    .regex(/^(\+?254|0)[17]\d{8}$/, 'Enter a valid Kenyan phone (07XX XXX XXX)'),
  amount: z.number().positive().optional(),
});

export async function POST(req: NextRequest) {
  // ---- Auth ----
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) {
    return NextResponse.json({ error: 'Please log in again.' }, { status: 401 });
  }
  const payload = await verifyToken(token);
  if (!payload) {
    return NextResponse.json({ error: 'Session expired.' }, { status: 401 });
  }

  const business = await getActiveBusiness(payload.userId);
  if (!business) {
    return NextResponse.json({ error: 'Business not found.' }, { status: 400 });
  }

  // ---- Validate ----
  const body = await req.json();
  const parsed = schema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid input.' },
      { status: 400 }
    );
  }

  const invoice = await getInvoice(business.id, parsed.data.invoice_id);
  if (!invoice) {
    return NextResponse.json({ error: 'Invoice not found.' }, { status: 404 });
  }

  const balance = Number(invoice.total) - Number(invoice.amount_paid);
  if (balance <= 0) {
    return NextResponse.json({ error: 'This invoice is already fully paid.' }, { status: 400 });
  }

  const amount = parsed.data.amount ?? balance;
  if (amount > balance) {
    return NextResponse.json(
      { error: `Amount exceeds balance (KES ${balance.toFixed(2)}).` },
      { status: 400 }
    );
  }

  // ---- Send STK Push ----
  try {
    const result = await stkPush({
      phone: parsed.data.phone,
      amount,
      accountReference: invoice.invoice_number,
      description: 'Invoice',
    });

    // Daraja returns ResponseCode 0 for "request accepted"
    // Non-zero means Daraja rejected before reaching the customer
    if (result.ResponseCode !== '0') {
      return NextResponse.json(
        { error: result.ResponseDescription || 'M-Pesa rejected the request.' },
        { status: 400 }
      );
    }

    // Save as pending — callback will finalize
    await execute(
      `INSERT INTO mpesa_transactions
         (business_id, transaction_code, amount, phone, account_reference,
          transaction_time, source, match_status, matched_invoice_id, raw_payload)
       VALUES (?, ?, ?, ?, ?, NOW(), 'stk', 'unmatched', ?, ?)`,
      [
        business.id,
        result.CheckoutRequestID,
        amount,
        normalizePhone(parsed.data.phone),
        invoice.invoice_number,
        invoice.id,
        JSON.stringify(result),
      ]
    );

    return NextResponse.json({
      ok: true,
      checkout_request_id: result.CheckoutRequestID,
      message:
        result.CustomerMessage ||
        'Payment request sent. Ask the customer to enter their M-Pesa PIN.',
    });
  } catch (err: any) {
    console.error('[stkpush]', err);
    // Don't leak internal errors to the client
    return NextResponse.json(
      { error: 'Could not reach M-Pesa. Try again in a moment.' },
      { status: 500 }
    );
  }
}