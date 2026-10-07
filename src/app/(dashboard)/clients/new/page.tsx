import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import Link from 'next/link';
import { ArrowLeft } from 'lucide-react';
import { verifyToken } from '@/lib/jwt';
import ClientForm from '@/components/clients/ClientForm';

export default async function NewClientPage() {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');

  const payload = await verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  return (
    <div className="mx-auto max-w-2xl space-y-6">
      <div>
        <Link
          href="/clients"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          <ArrowLeft className="mr-1 h-4 w-4" />
          Back to clients
        </Link>
        <h1 className="mt-2 text-2xl font-semibold">Add Client</h1>
        <p className="mt-1 text-sm text-muted-foreground">
          Add a client you can invoice repeatedly.
        </p>
      </div>

      <ClientForm mode="create" />
    </div>
  );
}