import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import {
  getClientWithStats,
  updateClient,
  deleteClient,
} from '@/lib/services/clients';
import { updateClientSchema } from '@/lib/validators/client';

async function getContext() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) return null;
  const payload = verifyToken(token);
  if (!payload) return null;
  const business = await getActiveBusiness(payload.userId);
  if (!business) return null;
  return { payload, business };
}

export async function GET(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const client = await getClientWithStats(ctx.business.id, Number(id));
  if (!client) return NextResponse.json({ error: 'Not found' }, { status: 404 });

  return NextResponse.json({ client });
}

export async function PATCH(
  req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  const body = await req.json();
  const parsed = updateClientSchema.safeParse(body);
  if (!parsed.success) {
    return NextResponse.json(
      { error: parsed.error.issues[0]?.message || 'Invalid input' },
      { status: 400 }
    );
  }

  try {
    const client = await updateClient(ctx.business.id, Number(id), parsed.data);
    return NextResponse.json({ client });
  } catch (err: any) {
    console.error('[clients/PATCH]', err);
    return NextResponse.json({ error: err.message || 'Update failed' }, { status: 400 });
  }
}

export async function DELETE(
  _req: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const ctx = await getContext();
  if (!ctx) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

  const { id } = await params;
  try {
    await deleteClient(ctx.business.id, Number(id));
    return NextResponse.json({ ok: true });
  } catch (err: any) {
    return NextResponse.json({ error: err.message || 'Delete failed' }, { status: 400 });
  }
}