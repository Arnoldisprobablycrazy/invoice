import { cookies } from 'next/headers';
import Link from 'next/link';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getDashboardData } from '@/lib/services/dashboard';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { IncompleteProfileBanner } from '@/components/settings/IncompleteProfileBanner';
import { StatusBadge } from '@/components/invoices/StatusBadge';
import { formatKes as fmt } from '@/lib/utils';
import {
  TrendingUp, AlertTriangle, Wallet, FileText, Plus, Users, CreditCard,
} from 'lucide-react';


  
export default async function DashboardPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');

  const payload = verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) return null;

  const data = await getDashboardData(business.id);
  const monthChange = data.lastMonthSales === 0
    ? (data.monthSales > 0 ? 100 : 0)
    : ((data.monthSales - data.lastMonthSales) / data.lastMonthSales) * 100;

  return (
    <div className="space-y-5 sm:space-y-6">
      <IncompleteProfileBanner business={business} />
      <div className="flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
        <div><p className="text-xs font-medium uppercase tracking-wide text-muted-foreground sm:hidden">Overview</p><h1 className="text-xl font-semibold sm:text-2xl">Today at {business.name}</h1></div>
        <Link href="/invoices/new" className="hidden sm:block">
          <Button className="min-h-11"><Plus className="mr-2 h-4 w-4" /> New Invoice</Button>
        </Link>
      </div>

      {/* KPI row */}
      <div className="grid grid-cols-2 gap-3 sm:gap-4 lg:grid-cols-4">
        <KPI
          title="Today's Sales"
          value={fmt(data.todaySales)}
          sub={`${data.todayInvoiceCount} invoices`}
          icon={<TrendingUp className="h-4 w-4 text-green-600" />}
        />
        <KPI
          title="Outstanding"
          value={fmt(data.totalOutstanding)}
          sub={`${data.unpaidCount} unpaid invoices`}
          icon={<Wallet className="h-4 w-4 text-blue-600" />}
        />
        <KPI
          title="Overdue"
          value={fmt(data.overdueAmount)}
          sub={`${data.overdueCount} overdue invoices`}
          icon={<AlertTriangle className="h-4 w-4 text-red-600" />}
          accent={data.overdueCount > 0}
        />
        <KPI
          title="This Month"
          value={fmt(data.monthSales)}
          sub={`${monthChange >= 0 ? '+' : ''}${monthChange.toFixed(0)}% vs last month`}
          icon={<FileText className="h-4 w-4 text-purple-600" />}
        />
      </div>

      <div className="grid grid-cols-3 gap-2 sm:gap-3">
        <Link href="/invoices/new" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background px-2 text-center text-xs font-medium hover:bg-accent sm:px-4 sm:text-sm"><Plus className="h-4 w-4" /><span className="sm:inline">New Invoice</span></Link>
        <Link href="/clients/new" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background px-2 text-center text-xs font-medium hover:bg-accent sm:px-4 sm:text-sm"><Users className="h-4 w-4" /><span className="sm:inline">Add Client</span></Link>
        <Link href="/payments/new" className="flex min-h-11 items-center justify-center gap-2 rounded-lg border bg-background px-2 text-center text-xs font-medium hover:bg-accent sm:px-4 sm:text-sm"><CreditCard className="h-4 w-4" /><span className="sm:inline">Record Payment</span></Link>
      </div>

      {/* Recent invoices + Top clients */}
      <div className="grid gap-4 md:grid-cols-2">
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <CardTitle>Recent Invoices</CardTitle>
            <Link href="/invoices" className="text-sm text-primary hover:underline">
              View all
            </Link>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.recentInvoices.length === 0 && (
              <p className="text-sm text-muted-foreground">No invoices yet.</p>
            )}
            {data.recentInvoices.map((inv) => (
              <Link
                key={inv.id}
                href={`/invoices/${inv.id}`}
                className="flex items-center justify-between rounded-md border p-3 hover:bg-accent/50"
              >
                <div>
                  <div className="font-medium">{inv.invoice_number}</div>
                  <div className="text-sm text-muted-foreground">{inv.client_name}</div>
                </div>
                <div className="text-right">
                  <div className="font-medium">{fmt(inv.total, inv.currency)}</div>
                  <StatusBadge status={inv.status} />
                </div>
              </Link>
            ))}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <CardTitle>Top Clients (This Month)</CardTitle>
          </CardHeader>
          <CardContent className="space-y-3">
            {data.topClients.length === 0 && (
              <p className="text-sm text-muted-foreground">No client activity yet.</p>
            )}
            {data.topClients.map((c) => (
              <div key={c.id} className="flex items-center justify-between">
                <div className="flex items-center gap-2">
                  <Users className="h-4 w-4 text-muted-foreground" />
                  <span className="font-medium">{c.name}</span>
                </div>
                <span className="text-sm">{fmt(c.revenue)}</span>
              </div>
            ))}
          </CardContent>
        </Card>
      </div>

      {/* Recent M-Pesa payments */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Recent M-Pesa Payments</CardTitle>
          <Link href="/payments" className="text-sm text-primary hover:underline">
            Reconcile
          </Link>
        </CardHeader>
        <CardContent>
          {data.recentMpesa.length === 0 ? (
            <p className="text-sm text-muted-foreground">No M-Pesa activity yet.</p>
          ) : (
            <div className="divide-y">
              {data.recentMpesa.map((m) => (
                <div key={m.id} className="flex items-center justify-between py-2">
                  <div>
                    <div className="font-mono text-sm">{m.transaction_code}</div>
                    <div className="text-xs text-muted-foreground">
                      {m.payer_name || m.phone}
                    </div>
                  </div>
                  <div className="text-right">
                    <div className="font-medium">{fmt(m.amount)}</div>
                    <MatchBadge status={m.match_status} />
                  </div>
                </div>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}

function KPI({
  title, value, sub, icon, accent,
}: { title: string; value: string; sub: string; icon: React.ReactNode; accent?: boolean }) {
  return (
    <Card className={accent ? 'border-red-300' : ''}>
      <CardHeader className="flex flex-row items-center justify-between px-3 pb-1 sm:px-4 sm:pb-2">
        <CardTitle className="text-xs font-medium text-muted-foreground sm:text-sm">{title}</CardTitle>
        {icon}
      </CardHeader>
      <CardContent className="px-3 sm:px-4">
        <div className="truncate text-lg font-bold sm:text-2xl">{value}</div>
        <p className="mt-1 truncate text-[11px] text-muted-foreground sm:text-xs">{sub}</p>
      </CardContent>
    </Card>
  );
}


 

function MatchBadge({ status }: { status: string }) {
  const map: Record<string, string> = {
    auto: 'text-green-600',
    manual: 'text-blue-600',
    unmatched: 'text-amber-600',
    ignored: 'text-gray-400',
  };
  return <span className={`text-xs ${map[status] || ''}`}>{status}</span>;
}