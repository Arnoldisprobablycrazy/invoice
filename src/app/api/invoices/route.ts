import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { createInvoiceSchema } from '@/lib/validators/invoice';
import { createInvoice, listInvoices } from '@/lib/services/invoices';
import { getActiveBusiness } from '@/lib/services/businesses';

async function auth() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const business = await getActiveBusiness(payload.userId);
  return business ? { userId: payload.userId, business } : null;
}

export async function GET(req: NextRequest) {
  const ctx = await auth();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { searchParams } = new URL(req.url);
  const result = await listInvoices(ctx.business.id, {
    status: searchParams.get('status') ?? undefined,
    limit: Number(searchParams.get('limit') ?? 50),
    offset: Number(searchParams.get('offset') ?? 0),
  });

  return NextResponse.json(result);
}

export async function POST(req: NextRequest) {
  const ctx = await auth();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const body = await req.json();
  const parsed = createInvoiceSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: 'Validation failed', details: parsed.error.flatten() },
      { status: 400 }
    );
  }

  try {
    const invoice = await createInvoice(ctx.business.id, parsed.data);
    return NextResponse.json({ invoice }, { status: 201 });
  } catch (err: any) {
    console.error('createInvoice failed', err);
    return NextResponse.json({ error: 'Failed to create invoice' }, { status: 500 });
  }
}