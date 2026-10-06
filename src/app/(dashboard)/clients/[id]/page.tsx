import Link from 'next/link';
import { cookies } from 'next/headers';
import { notFound, redirect } from 'next/navigation';
import { ArrowLeft, Mail, MapPin, Phone, FileText } from 'lucide-react';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { getClientWithStats } from '@/lib/services/clients';
import { query } from '@/lib/db';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { StatusBadge } from '@/components/invoices/StatusBadge';
import ClientActions from '@/components/clients/ClientActions';
import type { InvoiceStatus } from '@/lib/types';
import { formatKes, formatKenyanPhone, formatDate } from '@/lib/utils';

export default async function ClientDetailPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;

  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');
  const payload = verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  const client = await getClientWithStats(business.id, Number(id));
  if (!client) notFound();

  const invoices = await query<any>(
    `SELECT i.id, i.invoice_number, i.issue_date, i.due_date, i.total,
            i.amount_paid, i.status, i.currency
       FROM invoices i
      WHERE i.client_id = ? AND i.business_id = ?
      ORDER BY i.created_at DESC`,
    [client.id, business.id]
  );

  return (
    <div className="mx-auto max-w-5xl space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to clients
        </Link>
        <div className="mt-2 flex flex-col gap-3 sm:flex-row sm:items-start sm:justify-between">
          <div>
            <h1 className="text-2xl font-semibold">{client.name}</h1>
            {client.kra_pin && (
              <p className="text-sm text-muted-foreground">PIN: {client.kra_pin}</p>
            )}
          </div>
          <ClientActions client={client} business={business} />
        </div>
      </div>

      {/* Summary KPIs */}
      <div className="grid gap-4 sm:grid-cols-3">
        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Billed
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold">
              {formatKes(Number(client.total_billed))}
            </p>
            <p className="mt-1 text-xs text-muted-foreground">
              {client.invoice_count} invoice{client.invoice_count === 1 ? '' : 's'}
            </p>
          </CardContent>
        </Card>

        <Card>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Total Paid
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p className="text-2xl font-bold text-green-600">
              {formatKes(Number(client.total_paid))}
            </p>
          </CardContent>
        </Card>

        <Card className={Number(client.outstanding) > 0 ? 'border-red-300' : ''}>
          <CardHeader className="pb-2">
            <CardTitle className="text-sm font-medium text-muted-foreground">
              Outstanding
            </CardTitle>
          </CardHeader>
          <CardContent>
            <p
              className={`text-2xl font-bold ${
                Number(client.outstanding) > 0 ? 'text-red-600' : ''
              }`}
            >
              {formatKes(Number(client.outstanding))}
            </p>
          </CardContent>
        </Card>
      </div>

      {/* Contact info */}
      <Card>
        <CardHeader>
          <CardTitle>Contact</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3 text-sm">
          {client.phone ? (
            <div className="flex items-center gap-2">
              <Phone className="h-4 w-4 text-muted-foreground" />
              <span>{formatKenyanPhone(client.phone)}</span>
            </div>
          ) : null}
          {client.email ? (
            <div className="flex items-center gap-2">
              <Mail className="h-4 w-4 text-muted-foreground" />
              <span>{client.email}</span>
            </div>
          ) : null}
          {client.address ? (
            <div className="flex items-center gap-2">
              <MapPin className="h-4 w-4 text-muted-foreground" />
              <span>{client.address}</span>
            </div>
          ) : null}
          {!client.phone && !client.email && !client.address && (
            <p className="text-muted-foreground">No contact details yet.</p>
          )}
          {client.notes && (
            <div className="mt-4 border-t pt-4">
              <p className="text-xs font-medium uppercase text-muted-foreground">
                Notes
              </p>
              <p className="mt-1 whitespace-pre-wrap">{client.notes}</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Invoices */}
      <Card>
        <CardHeader className="flex flex-row items-center justify-between">
          <CardTitle>Invoices</CardTitle>
          <Button asChild size="sm" variant="outline">
            <Link href={`/invoices/new?client_id=${client.id}`}>
              New Invoice
            </Link>
          </Button>
        </CardHeader>
        <CardContent className="p-0">
          {invoices.length === 0 ? (
            <div className="flex flex-col items-center justify-center p-12 text-center">
              <FileText className="h-10 w-10 text-muted-foreground/50" />
              <p className="mt-3 text-sm text-muted-foreground">
                No invoices for this client yet.
              </p>
            </div>
          ) : (
            <div className="divide-y">
              {invoices.map((inv) => (
                <Link
                  key={inv.id}
                  href={`/invoices/${inv.id}`}
                  className="flex items-center justify-between gap-3 p-4 hover:bg-muted/50"
                >
                  <div className="min-w-0 flex-1">
                    <p className="truncate font-medium">{inv.invoice_number}</p>
                    <p className="text-xs text-muted-foreground">
                      Issued {formatDate(inv.issue_date)} · Due {formatDate(inv.due_date)}
                    </p>
                  </div>
                  <div className="text-right">
                    <p className="font-medium">
                      {formatKes(Number(inv.total), inv.currency)}
                    </p>
                    <StatusBadge status={inv.status as InvoiceStatus} />
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}