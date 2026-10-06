'use client';

import { useRouter } from 'next/navigation';
import type { Invoice, InvoiceStatus } from '@/lib/types';
import { daysOverdue, formatDate, formatKes, isOverdue } from '@/lib/utils';
import StatusBadge from '@/components/invoices/StatusBadge';

type InvoiceRow = Invoice & { client_name: string };

function overdueLabel(invoice: InvoiceRow) {
  if (!isOverdue(invoice.due_date, invoice.status)) return null;
  const days = daysOverdue(invoice.due_date);
  return days > 0 ? `${days} ${days === 1 ? 'day' : 'days'} overdue` : null;
}

export default function InvoiceTable({ invoices }: { invoices: InvoiceRow[] }) {
  const router = useRouter();

  return (
    <>
      <div className="hidden overflow-hidden rounded-xl border md:block">
        <table className="min-w-full divide-y divide-border text-sm">
          <thead className="bg-muted/40"><tr>{['Invoice #', 'Client', 'Issue date', 'Due date', 'Total', 'Balance', 'Status'].map((heading) => <th key={heading} scope="col" className="px-4 py-3 text-left font-medium text-muted-foreground">{heading}</th>)}</tr></thead>
          <tbody className="divide-y divide-border bg-background">
            {invoices.map((invoice) => {
              const overdue = overdueLabel(invoice);
              return <tr key={invoice.id} tabIndex={0} className="cursor-pointer hover:bg-muted/50 focus-visible:bg-muted/50" onClick={() => router.push(`/invoices/${invoice.id}`)} onKeyDown={(event) => { if (event.key === 'Enter' || event.key === ' ') router.push(`/invoices/${invoice.id}`); }}>
                <td className="px-4 py-4 font-medium">{invoice.invoice_number}</td><td className="px-4 py-4">{invoice.client_name}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.issue_date)}</td><td className="px-4 py-4 text-muted-foreground">{formatDate(invoice.due_date)}{overdue && <span className="mt-1 block text-xs text-red-600">{overdue}</span>}</td><td className="px-4 py-4 font-medium">{formatKes(invoice.total, invoice.currency)}</td><td className="px-4 py-4">{formatKes(invoice.total - invoice.amount_paid, invoice.currency)}</td><td className="px-4 py-4"><StatusBadge status={invoice.status as InvoiceStatus} /></td>
              </tr>;
            })}
          </tbody>
        </table>
      </div>

      <div className="grid gap-3 md:hidden">
        {invoices.map((invoice) => {
          const overdue = overdueLabel(invoice);
          return <button key={invoice.id} type="button" className="w-full rounded-xl border bg-background p-4 text-left shadow-sm transition-colors hover:bg-muted/50 focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-ring" onClick={() => router.push(`/invoices/${invoice.id}`)}>
            <div className="flex items-start justify-between gap-3"><span className="font-semibold">{invoice.invoice_number}</span><StatusBadge status={invoice.status as InvoiceStatus} /></div><p className="mt-3 text-sm text-muted-foreground">{invoice.client_name}</p><div className="mt-4 flex items-end justify-between"><div><p className="text-xs text-muted-foreground">Total</p><p className="font-semibold">{formatKes(invoice.total, invoice.currency)}</p></div><div className="text-right"><p className="text-xs text-muted-foreground">Due {formatDate(invoice.due_date)}</p>{overdue && <p className="text-xs text-red-600">{overdue}</p>}<p className="mt-1 text-xs text-muted-foreground">Balance {formatKes(invoice.total - invoice.amount_paid, invoice.currency)}</p></div></div>
          </button>;
        })}
      </div>
    </>
  );
}
