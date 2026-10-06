import React from 'react';
import { NextRequest, NextResponse } from 'next/server';
import { renderToStream, type DocumentProps } from '@react-pdf/renderer';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getInvoice } from '@/lib/services/invoices';
import { getActiveBusiness } from '@/lib/services/businesses';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const payload = verifyToken(token);
  if (!payload) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const business = await getActiveBusiness(payload.userId);
  if (!business) return NextResponse.json({ error: 'No business' }, { status: 400 });

  const invoice = await getInvoice(business.id, Number(id));
  if (!invoice) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  const document = React.createElement(InvoicePDF, { invoice }) as React.ReactElement<DocumentProps>;
  const stream = await renderToStream(document);
  return new NextResponse(stream as unknown as BodyInit, {
    headers: {
      'Content-Type': 'application/pdf',
      'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
    },
  });
}