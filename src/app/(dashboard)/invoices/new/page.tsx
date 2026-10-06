import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { listClients } from '@/lib/services/clients';
import { listProducts } from '@/lib/services/products';
import InvoiceForm from '@/components/invoices/InvoiceForm';

export default async function NewInvoicePage() {
  const token = (await cookies()).get('authToken')?.value;
  const payload = token ? verifyToken(token) : null;
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  const [clients, products] = await Promise.all([
    listClients(business.id),
    listProducts(business.id),
  ]);

  return (
    <div className="mx-auto max-w-6xl space-y-6">
      <div>
        <p className="text-sm text-muted-foreground">{business.name}</p>
        <h1 className="text-2xl font-semibold tracking-tight">Create invoice</h1>
        <p className="mt-1 text-sm text-muted-foreground">Build a professional invoice and send it to your client.</p>
      </div>
      <InvoiceForm clients={clients} products={products} defaultTaxRate={business.default_tax_rate || 16} />
    </div>
  );
}
