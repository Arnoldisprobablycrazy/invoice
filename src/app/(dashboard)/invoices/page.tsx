import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { FileText, Plus, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import InvoiceTable from '@/components/invoices/InvoiceTable';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { listInvoices } from '@/lib/services/invoices';

const PAGE_SIZE = 20;
const statuses = ['all', 'draft', 'sent', 'partial', 'paid', 'overdue'] as const;

type PageParams = { status?: string; q?: string; page?: string };

function pageUrl(page: number, status: string, q: string) {
  const params = new URLSearchParams();
  if (status !== 'all') params.set('status', status);
  if (q) params.set('q', q);
  if (page > 1) params.set('page', String(page));
  const query = params.toString();
  return `/invoices${query ? `?${query}` : ''}`;
}

export default async function InvoicesPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const token = (await cookies()).get('authToken')?.value;
  const payload = await token ? verifyToken(token) : null;
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  const params = await searchParams;
  const status = statuses.includes(params.status as (typeof statuses)[number])
    ? (params.status as (typeof statuses)[number])
    : 'all';
  const q = params.q?.trim() || '';
  const page = Math.max(1, Number(params.page || '1') || 1);
  const result = await listInvoices(business.id, {
    status: status === 'all' ? undefined : status,
    q,
    limit: PAGE_SIZE,
    offset: (page - 1) * PAGE_SIZE,
  });
  const totalPages = Math.max(1, Math.ceil(result.total / PAGE_SIZE));
  const firstShown = result.total === 0 ? 0 : (page - 1) * PAGE_SIZE + 1;
  const lastShown = Math.min(page * PAGE_SIZE, result.total);

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{business.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Invoices</h1>
        </div>
        <Button asChild className="min-h-11"><Link href="/invoices/new"><Plus className="mr-2 h-4 w-4" /> New Invoice</Link></Button>
      </header>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        {status !== 'all' && <input type="hidden" name="status" value={status} />}
        <div className="relative flex-1"><Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" /><Input className="min-h-11 pl-9" name="q" defaultValue={q} placeholder="Search invoice number or client" aria-label="Search invoices" /></div>
        <Button type="submit" variant="outline" className="min-h-11">Search</Button>
      </form>

      <nav className="flex gap-2 overflow-x-auto pb-1" aria-label="Invoice status filters">
        {statuses.map((value) => <Link key={value} href={pageUrl(1, value, q)} className={`min-h-10 shrink-0 rounded-full border px-4 py-2 text-sm capitalize transition-colors ${status === value ? 'border-primary bg-primary text-primary-foreground' : 'hover:bg-accent'}`}>{value}</Link>)}
      </nav>

      {result.total === 0 ? (
        <Card><CardContent className="flex flex-col items-center justify-center p-12 text-center"><FileText className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" /><h2 className="mt-4 font-semibold">No invoices found</h2><p className="mt-1 max-w-sm text-sm text-muted-foreground">Create your first invoice to start tracking sales and payments.</p><Button asChild className="mt-5 min-h-11"><Link href="/invoices/new">Create your first invoice</Link></Button></CardContent></Card>
      ) : (
        <>
          <InvoiceTable invoices={result.invoices} />
          <footer className="flex flex-col gap-3 border-t pt-4 text-sm text-muted-foreground sm:flex-row sm:items-center sm:justify-between">
            <span>Showing {firstShown}-{lastShown} of {result.total}</span>
            <div className="flex gap-2">
              {page > 1 ? (
                <Button asChild variant="outline">
                  <Link href={pageUrl(page - 1, status, q)}>Previous</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Previous</Button>
              )}
              {page < totalPages ? (
                <Button asChild variant="outline">
                  <Link href={pageUrl(page + 1, status, q)}>Next</Link>
                </Button>
              ) : (
                <Button variant="outline" disabled>Next</Button>
              )}
            </div>
          </footer>
        </>
      )}
    </div>
  );
}
