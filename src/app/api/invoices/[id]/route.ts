import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { renderToStream } from '@react-pdf/renderer';
import React from 'react';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getInvoice } from '@/lib/services/invoices';
import { InvoicePDF } from '@/lib/pdf/InvoicePDF';

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) {
    console.error('[pdf] No authToken cookie');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const payload = await verifyToken(token);
  if (!payload) {
    console.error('[pdf] Invalid authToken');
    return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
  }

  const business = await getActiveBusiness(payload.userId);
  if (!business) {
    return NextResponse.json({ error: 'No business' }, { status: 400 });
  }

  const invoice = await getInvoice(business.id, Number(id));
  if (!invoice) {
    return NextResponse.json({ error: 'Not found' }, { status: 404 });
  }

  try {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const element = React.createElement(InvoicePDF, { invoice }) as any;
    const stream = await renderToStream(element);

    return new NextResponse(stream as unknown as ReadableStream, {
      headers: {
        'Content-Type': 'application/pdf',
        'Content-Disposition': `inline; filename="${invoice.invoice_number}.pdf"`,
        'Cache-Control': 'no-store',
      },
    });
  } catch (err) {
    console.error('[pdf] render failed', err);
    return NextResponse.json(
      { error: 'Could not generate PDF' },
      { status: 500 }
    );
  }
}