'use server';

import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { createInvoiceSchema } from '@/lib/validators/invoice';
import { createInvoice } from '@/lib/services/invoices';
import { getActiveBusiness } from '@/lib/services/businesses';

export async function createInvoiceAction(formData: FormData) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');

  const payload = verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) throw new Error('No active business');

  const raw = {
    client_id: formData.get('client_id')
      ? Number(formData.get('client_id'))
      : undefined,
    new_client: formData.get('new_client_name')
      ? {
          name: String(formData.get('new_client_name')),
          phone: String(formData.get('new_client_phone') || ''),
          email: String(formData.get('new_client_email') || ''),
          kra_pin: String(formData.get('new_client_kra_pin') || ''),
          address: String(formData.get('new_client_address') || ''),
        }
      : undefined,
    issue_date: String(formData.get('issue_date')),
    due_date: String(formData.get('due_date')),
    items: JSON.parse(String(formData.get('items') || '[]')),
    notes: String(formData.get('notes') || ''),
    terms: String(formData.get('terms') || ''),
    status: (formData.get('status') as 'draft' | 'sent') || 'draft',
  };

  const parsed = createInvoiceSchema.safeParse(raw);
  if (!parsed.success) {
    return { error: parsed.error.flatten().fieldErrors };
  }

  const invoice = await createInvoice(business.id, parsed.data);
  redirect(`/invoices/${invoice.id}`);
}