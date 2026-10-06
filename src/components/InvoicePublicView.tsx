'use client';

import type { InvoiceWithRelations } from '@/lib/types';
import Image from 'next/image';
import { Button } from '@/components/ui/button';
import { Download, Printer } from 'lucide-react';

const money = (value: number, currency = 'KES') => `${currency} ${Number(value).toLocaleString('en-KE', { maximumFractionDigits: 2 })}`;
const date = (value: string) => new Intl.DateTimeFormat('en-KE', { dateStyle: 'medium' }).format(new Date(value));

export function InvoicePublicView({ invoice }: { invoice: InvoiceWithRelations }) {
  const balance = invoice.total - invoice.amount_paid;

  return (
    <main className="min-h-screen bg-slate-100 px-4 py-6 text-slate-950 sm:py-10 print:bg-white print:p-0">
      <div className="mx-auto max-w-4xl print:max-w-none">
        <div className="mb-4 flex justify-end gap-2 print:hidden">
          <Button variant="outline" onClick={() => window.print()}><Printer className="mr-2 h-4 w-4" /> Print</Button>
          <Button asChild><a href={`/api/invoices/public/${invoice.public_token}/pdf`} target="_blank" rel="noreferrer"><Download className="mr-2 h-4 w-4" /> Download PDF</a></Button>
        </div>
        <article className="relative overflow-hidden rounded-2xl bg-white p-6 shadow-sm ring-1 ring-slate-200 sm:p-10 print:rounded-none print:shadow-none print:ring-0">
          {invoice.status === 'paid' && <div className="pointer-events-none absolute left-1/2 top-1/2 -translate-x-1/2 -translate-y-1/2 rotate-[-18deg] text-7xl font-black uppercase tracking-widest text-emerald-600/10 sm:text-9xl">Paid</div>}
          <header className="relative flex flex-col gap-8 border-b border-slate-200 pb-8 sm:flex-row sm:justify-between">
            <div>{invoice.business.logo_url && <Image src={invoice.business.logo_url} alt="" width={160} height={48} unoptimized className="mb-4 h-12 max-w-40 object-contain" />}<p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">From</p><h1 className="mt-2 text-2xl font-bold">{invoice.business.name}</h1>{invoice.business.kra_pin && <p className="mt-2 text-sm text-slate-600">KRA PIN: {invoice.business.kra_pin}</p>}{invoice.business.address && <p className="text-sm text-slate-600">{invoice.business.address}</p>}{invoice.business.phone && <p className="text-sm text-slate-600">{invoice.business.phone}</p>}</div>
            <div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-[0.25em] text-slate-500">{invoice.status === 'paid' ? 'Receipt' : 'Invoice'}</p><p className="mt-2 text-2xl font-bold">{invoice.invoice_number}</p><p className="mt-3 text-sm text-slate-600">Issued {date(invoice.issue_date)}</p><p className="text-sm text-slate-600">Due {date(invoice.due_date)}</p></div>
          </header>
          <section className="relative grid gap-6 border-b border-slate-200 py-8 sm:grid-cols-2"><div><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Bill to</p><p className="mt-2 font-semibold">{invoice.client.name}</p></div><div className="sm:text-right"><p className="text-xs font-semibold uppercase tracking-[0.2em] text-slate-500">Status</p><p className="mt-2 font-semibold capitalize">{invoice.status}</p><p className="text-sm text-slate-600">Balance: {money(balance, invoice.currency)}</p></div></section>
          <section className="relative overflow-x-auto py-8"><table className="min-w-full text-left text-sm"><thead className="border-b border-slate-200 text-slate-500"><tr><th className="pb-3">Description</th><th className="pb-3 text-right">Qty</th><th className="pb-3 text-right">Unit price</th><th className="pb-3 text-right">Total</th></tr></thead><tbody className="divide-y divide-slate-100">{invoice.items.map((item, index) => <tr key={item.id || `${item.description}-${index}`}><td className="py-4 pr-4">{item.description}</td><td className="py-4 text-right">{item.quantity}</td><td className="py-4 text-right">{money(item.unit_price, invoice.currency)}</td><td className="py-4 text-right font-medium">{money(item.line_total, invoice.currency)}</td></tr>)}</tbody></table></section>
          <section className="relative ml-auto max-w-sm space-y-3 border-t border-slate-200 pt-6 text-sm"><div className="flex justify-between"><span>Subtotal</span><span>{money(invoice.subtotal, invoice.currency)}</span></div><div className="flex justify-between"><span>VAT</span><span>{money(invoice.tax_amount, invoice.currency)}</span></div><div className="flex justify-between border-t border-slate-200 pt-3 text-lg font-bold"><span>Total</span><span>{money(invoice.total, invoice.currency)}</span></div></section>
          {(invoice.business.mpesa_till || invoice.business.mpesa_paybill || invoice.business.bank_details) && <section className="relative mt-8 rounded-xl bg-slate-50 p-5 text-sm"><h2 className="font-semibold">Payment instructions</h2>{invoice.business.mpesa_till && <p className="mt-2">M-Pesa Till: {invoice.business.mpesa_till}</p>}{invoice.business.mpesa_paybill && <p>M-Pesa Paybill: {invoice.business.mpesa_paybill}</p>}{invoice.business.bank_details && <p className="whitespace-pre-wrap">{invoice.business.bank_details}</p>}</section>}
          {(invoice.notes || invoice.terms) && <section className="relative mt-8 grid gap-5 border-t border-slate-200 pt-6 sm:grid-cols-2">{invoice.notes && <div><h2 className="font-semibold">Notes</h2><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{invoice.notes}</p></div>}{invoice.terms && <div><h2 className="font-semibold">Terms</h2><p className="mt-1 whitespace-pre-wrap text-sm text-slate-600">{invoice.terms}</p></div>}</section>}
        </article>
      </div>
    </main>
  );
}
