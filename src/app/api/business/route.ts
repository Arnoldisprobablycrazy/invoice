import { NextRequest, NextResponse } from 'next/server';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { queryOne, execute } from '@/lib/db';
import type { Business } from '@/lib/types';
import { updateBusinessSchema } from '@/lib/validators/business';

const editableFields = [
  'name', 'kra_pin', 'vat_registered', 'phone', 'email', 'address', 'logo_url',
  'mpesa_till', 'mpesa_paybill', 'bank_details', 'invoice_prefix',
  'default_tax_rate', 'currency',
] as const;

const nullableFields = new Set([
  'kra_pin', 'phone', 'email', 'address', 'logo_url',
  'mpesa_till', 'mpesa_paybill', 'bank_details',
]);

type RequestBody = Record<string, unknown>;
type SqlValue = string | number | boolean | null;

async function getBusinessFromRequest() {
  const token = (await cookies()).get('authToken')?.value;

  // ✅ Guard: token might be undefined
  if (!token) {
    return { error: NextResponse.json({ error: 'Unauthorized' }, { status: 401 }) };
  }

  const payload = await verifyToken(token);
  if (!payload) {
    return { error: NextResponse.json({ error: 'Session expired.' }, { status: 401 }) };
  }

  const business = await getActiveBusiness(payload.userId);
  if (!business) {
    return { error: NextResponse.json({ error: 'Business not found.' }, { status: 400 }) };
  }

  return { business };
}

export async function GET() {
  const context = await getBusinessFromRequest();
  if ('error' in context) return context.error;
  return NextResponse.json({ business: context.business });
}

export async function PATCH(request: NextRequest) {
  const context = await getBusinessFromRequest();
  if ('error' in context) return context.error;

  try {
    const body: unknown = await request.json();
    if (!body || typeof body !== 'object' || Array.isArray(body)) {
      return NextResponse.json({ error: 'Invalid input.' }, { status: 400 });
    }

    const raw = body as RequestBody;
    const parsed = updateBusinessSchema.safeParse(raw);
    if (!parsed.success) {
      return NextResponse.json(
        { error: parsed.error.issues[0]?.message || 'Invalid input.' },
        { status: 400 }
      );
    }

    const values = parsed.data as unknown as Record<string, SqlValue>;
    const assignments: string[] = [];
    const params: SqlValue[] = [];

    for (const field of editableFields) {
      if (!Object.prototype.hasOwnProperty.call(raw, field)) continue;
      assignments.push(`${field} = ?`);
      const value = values[field];
      params.push(nullableFields.has(field) && value === '' ? null : value);
    }

    if (assignments.length > 0) {
      await execute(
        `UPDATE businesses SET ${assignments.join(', ')}, updated_at = CURRENT_TIMESTAMP WHERE id = ?`,
        [...params, context.business.id]
      );
    }

    const business = await queryOne<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [context.business.id]
    );

    return NextResponse.json({ ok: true, business });
  } catch (error) {
    console.error('[business settings]', error);
    return NextResponse.json(
      { error: 'Could not save business settings.' },
      { status: 500 }
    );
  }
}