'use client';

import { useRouter } from 'next/navigation';
import { ChevronRight, Phone, FileText } from 'lucide-react';
import type { ClientWithStats } from '@/lib/services/clients';
import { formatKes, formatKenyanPhone, formatDate, cn } from '@/lib/utils';

export default function ClientsTable({ clients }: { clients: ClientWithStats[] }) {
  const router = useRouter();
  const go = (id: number) => router.push(`/clients/${id}`);

  return (
    <>
      {/* Desktop table */}
      <div className="hidden overflow-hidden rounded-lg border bg-background md:block">
        <table className="w-full text-sm">
          <thead className="border-b bg-muted/40">
            <tr className="text-left">
              <th className="p-3 font-medium">Name</th>
              <th className="p-3 font-medium">Phone</th>
              <th className="p-3 font-medium text-right">Invoices</th>
              <th className="p-3 font-medium text-right">Total Billed</th>
              <th className="p-3 font-medium text-right">Outstanding</th>
              <th className="p-3 font-medium">Last Invoice</th>
            </tr>
          </thead>
          <tbody>
            {clients.map((c) => (
              <tr
                key={c.id}
                onClick={() => go(c.id)}
                className="cursor-pointer border-b last:border-0 hover:bg-muted/50"
              >
                <td className="p-3 font-medium">{c.name}</td>
                <td className="p-3 text-muted-foreground">
                  {c.phone ? formatKenyanPhone(c.phone) : '—'}
                </td>
                <td className="p-3 text-right">{c.invoice_count}</td>
                <td className="p-3 text-right">{formatKes(Number(c.total_billed))}</td>
                <td
                  className={cn(
                    'p-3 text-right font-medium',
                    Number(c.outstanding) > 0 ? 'text-red-600' : 'text-muted-foreground'
                  )}
                >
                  {formatKes(Number(c.outstanding))}
                </td>
                <td className="p-3 text-muted-foreground">
                  {c.last_invoice_date ? formatDate(c.last_invoice_date) : '—'}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Mobile card list */}
      <div className="space-y-3 md:hidden">
        {clients.map((c) => (
          <button
            key={c.id}
            onClick={() => go(c.id)}
            className="flex w-full items-center justify-between gap-3 rounded-lg border bg-background p-4 text-left hover:bg-accent/50"
          >
            <div className="min-w-0 flex-1">
              <p className="truncate font-medium">{c.name}</p>
              <div className="mt-1 flex items-center gap-3 text-xs text-muted-foreground">
                {c.phone && (
                  <span className="inline-flex items-center gap-1">
                    <Phone className="h-3 w-3" />
                    {formatKenyanPhone(c.phone)}
                  </span>
                )}
                <span className="inline-flex items-center gap-1">
                  <FileText className="h-3 w-3" />
                  {c.invoice_count}
                </span>
              </div>
            </div>
            <div className="flex flex-col items-end gap-1">
              <span
                className={cn(
                  'text-sm font-semibold',
                  Number(c.outstanding) > 0 ? 'text-red-600' : 'text-muted-foreground'
                )}
              >
                {formatKes(Number(c.outstanding))}
              </span>
              <span className="text-xs text-muted-foreground">outstanding</span>
            </div>
            <ChevronRight className="h-4 w-4 shrink-0 text-muted-foreground" />
          </button>
        ))}
      </div>
    </>
  );
}