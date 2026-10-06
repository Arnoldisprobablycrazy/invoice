import { notFound } from 'next/navigation';
import { query, queryOne } from '@/lib/db';
import type { Business, Client, Invoice, InvoiceItem, InvoiceWithRelations } from '@/lib/types';
import { InvoicePublicView } from '@/components/InvoicePublicView';

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

export default async function PublicInvoicePage({ params }: { params: Promise<{ token: string }> }) {
  const invoice = await getByToken((await params).token);
  if (!invoice) notFound();
  return <InvoicePublicView invoice={invoice} />;
}
