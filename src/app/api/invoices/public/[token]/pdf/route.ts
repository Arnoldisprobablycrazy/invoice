import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import { query, queryOne } from '@/lib/db';
import type { Business, Client, Invoice, InvoiceItem, InvoiceWithRelations } from '@/lib/types';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';

async function getByToken(token: string): Promise<InvoiceWithRelations | null> {
  const invoice = await queryOne<Invoice>('SELECT * FROM invoices WHERE public_token = ?', [token]);
  if (!invoice) return null;
  const [client, business, items] = await Promise.all([
    queryOne<Client>('SELECT * FROM clients WHERE id = ?', [invoice.client_id]),
    queryOne<Business>('SELECT * FROM businesses WHERE id = ?', [invoice.business_id]),
    query<InvoiceItem>('SELECT * FROM invoice_items WHERE invoice_id = ? ORDER BY sort_order', [invoice.id]),
  ]);
  if (!client || !business) return null;
  return { ...invoice, client, business, items };
}

export async function GET(_request: NextRequest, { params }: { params: Promise<{ token: string }> }) {
  const invoice = await getByToken((await params).token);
  if (!invoice) return NextResponse.json({ error: 'Invoice not found' }, { status: 404 });
  const document = React.createElement(InvoicePDF, { invoice }) as React.ReactElement<DocumentProps>;
  const stream = await renderToStream(document);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}
