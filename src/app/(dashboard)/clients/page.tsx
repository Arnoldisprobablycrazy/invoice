import Link from 'next/link';
import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { Search, Plus, Users } from 'lucide-react';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { listClients } from '@/lib/services/clients';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent } from '@/components/ui/card';
import ClientsTable from '@/components/clients/ClientsTable';

type PageParams = { q?: string };

export default async function ClientsPage({
  searchParams,
}: {
  searchParams: Promise<PageParams>;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  const params = await searchParams;
  const q = params.q?.trim() || '';

  const clients = await listClients(business.id, { q });

  return (
    <div className="mx-auto max-w-7xl space-y-6">
      <header className="flex flex-col gap-4 sm:flex-row sm:items-end sm:justify-between">
        <div>
          <p className="text-sm text-muted-foreground">{business.name}</p>
          <h1 className="text-2xl font-semibold tracking-tight">Clients</h1>
        </div>
        <Button asChild className="min-h-11">
          <Link href="/clients/new">
            <Plus className="mr-2 h-4 w-4" /> Add Client
          </Link>
        </Button>
      </header>

      <form method="get" className="flex flex-col gap-3 sm:flex-row">
        <div className="relative flex-1">
          <Search className="pointer-events-none absolute left-3 top-3 h-4 w-4 text-muted-foreground" />
          <Input
            className="min-h-11 pl-9"
            name="q"
            defaultValue={q}
            placeholder="Search name, phone, or email"
            aria-label="Search clients"
          />
        </div>
        <Button type="submit" variant="outline" className="min-h-11">
          Search
        </Button>
      </form>

      {clients.length === 0 ? (
        <Card>
          <CardContent className="flex flex-col items-center justify-center p-12 text-center">
            <Users className="h-12 w-12 text-muted-foreground/50" aria-hidden="true" />
            <h2 className="mt-4 font-semibold">
              {q ? 'No clients match your search' : 'No clients yet'}
            </h2>
            <p className="mt-1 max-w-sm text-sm text-muted-foreground">
              {q
                ? 'Try a different name, phone, or email.'
                : 'Add your first client to start creating invoices.'}
            </p>
            {!q && (
              <Button asChild className="mt-5 min-h-11">
                <Link href="/clients/new">Add your first client</Link>
              </Button>
            )}
          </CardContent>
        </Card>
      ) : (
        <ClientsTable clients={clients} />
      )}
    </div>
  );
}