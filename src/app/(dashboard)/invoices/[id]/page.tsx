import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { ArrowLeft } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getInvoice } from '@/lib/services/invoices';
import { listInvoicePayments } from '@/lib/services/payments';
import InvoiceActions from '@/components/invoices/InvoiceActions';
import { ShareInvoiceDialog } from '@/components/invoices/ShareInvoiceDialog';

const money = (value: number, currency = 'KES') => `${currency} ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
const date = (value: string) => new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(value));
const badge: Record<string, string> = { draft: 'bg-slate-100 text-slate-700', sent: 'bg-blue-100 text-blue-700', partial: 'bg-amber-100 text-amber-700', paid: 'bg-emerald-100 text-emerald-700', overdue: 'bg-red-100 text-red-700', cancelled: 'bg-slate-100 text-slate-500' };

export default async function InvoiceDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const token = (await cookies()).get('authToken')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/accounts/auth/login');
  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');
  const invoice = await getInvoice(business.id, Number((await params).id));
  if (!invoice) notFound();
  const payments = await listInvoicePayments(business.id, invoice.id);
  const balance = invoice.total - invoice.amount_paid;

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <Button asChild variant="ghost" className="-ml-3"><Link href="/invoices"><ArrowLeft className="mr-2 h-4 w-4" /> Back to invoices</Link></Button>
      <div className="flex flex-col gap-5 lg:flex-row lg:items-start lg:justify-between"><div><p className="text-sm text-muted-foreground">{business.name}</p><div className="mt-1 flex flex-wrap items-center gap-3"><h1 className="text-2xl font-semibold">{invoice.invoice_number}</h1><span className={`rounded-full px-3 py-1 text-xs font-medium capitalize ${badge[invoice.status]}`}>{invoice.status}</span></div><p className="mt-2 text-sm text-muted-foreground">Issued {date(invoice.issue_date)} · Due {date(invoice.due_date)}</p></div><div className="text-left lg:text-right"><p className="text-sm text-muted-foreground">Balance due</p><p className={`text-2xl font-bold ${balance > 0 ? 'text-amber-700' : 'text-emerald-700'}`}>{money(balance, invoice.currency)}</p><p className="text-sm text-muted-foreground">of {money(invoice.total, invoice.currency)}</p></div></div>
      <div className="flex flex-wrap gap-2">
        <ShareInvoiceDialog
          invoiceNumber={invoice.invoice_number}
          publicToken={invoice.public_token}
          total={Number(invoice.total)}
          balance={Number(invoice.total) - Number(invoice.amount_paid)}
          currency={invoice.currency}
          dueDate={invoice.due_date}
          clientName={invoice.client.name}
          clientPhone={invoice.client.phone}
          businessName={invoice.business.name}
          mpesaTill={invoice.business.mpesa_till}
          mpesaPaybill={invoice.business.mpesa_paybill}
        />
        <InvoiceActions invoice={invoice} />
      </div>

      <Card><CardContent className="p-5 sm:p-8"><div className="grid gap-8 border-b pb-8 sm:grid-cols-2"><div><h2 className="text-xl font-semibold">{invoice.business.name}</h2>{invoice.business.kra_pin && <p className="mt-2 text-sm text-muted-foreground">KRA PIN: {invoice.business.kra_pin}</p>}{invoice.business.address && <p className="text-sm text-muted-foreground">{invoice.business.address}</p>}{invoice.business.phone && <p className="text-sm text-muted-foreground">{invoice.business.phone}</p>}</div><div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-widest text-muted-foreground">Bill to</p><p className="mt-2 font-semibold">{invoice.client.name}</p>{invoice.client.email && <p className="text-sm text-muted-foreground">{invoice.client.email}</p>}{invoice.client.phone && <p className="text-sm text-muted-foreground">{invoice.client.phone}</p>}</div></div><div className="mt-8 overflow-x-auto"><table className="min-w-full text-sm"><thead className="border-b text-left text-muted-foreground"><tr><th className="pb-3">Description</th><th className="pb-3 text-right">Qty</th><th className="pb-3 text-right">Price</th><th className="pb-3 text-right">Total</th></tr></thead><tbody className="divide-y">{invoice.items.map((item) => <tr key={item.id || item.description}><td className="py-4 pr-4">{item.description}</td><td className="py-4 text-right">{item.quantity}</td><td className="py-4 text-right">{money(item.unit_price, invoice.currency)}</td><td className="py-4 text-right font-medium">{money(item.line_total, invoice.currency)}</td></tr>)}</tbody></table></div><div className="mt-8 ml-auto max-w-sm space-y-3 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(invoice.subtotal, invoice.currency)}</span></div><div className="flex justify-between"><span>VAT</span><span>{money(invoice.tax_amount, invoice.currency)}</span></div><div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{money(invoice.total, invoice.currency)}</span></div></div>{(invoice.notes || invoice.terms) && <div className="mt-8 grid gap-5 border-t pt-6 sm:grid-cols-2">{invoice.notes && <div><h3 className="font-medium">Notes</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{invoice.notes}</p></div>}{invoice.terms && <div><h3 className="font-medium">Terms</h3><p className="mt-1 whitespace-pre-wrap text-sm text-muted-foreground">{invoice.terms}</p></div>}</div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Payments received</CardTitle></CardHeader><CardContent>{payments.length === 0 ? <p className="text-sm text-muted-foreground">No payments recorded yet.</p> : <div className="divide-y">{payments.map((payment) => <div key={payment.id} className="flex flex-col gap-1 py-3 sm:flex-row sm:items-center sm:justify-between"><div><p className="font-medium capitalize">{payment.method}</p><p className="text-sm text-muted-foreground">{payment.reference || 'No reference'} · {date(payment.paid_at)}</p></div><p className="font-semibold text-emerald-700">{money(payment.amount, invoice.currency)}</p></div>)}</div>}</CardContent></Card>
    </div>
  );
}
