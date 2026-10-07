import { cookies } from 'next/headers';
import { redirect } from 'next/navigation';
import BusinessSettingsForm from '@/components/settings/BusinessSettingsForm';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';

export default async function BusinessSettingsPage() {
  const token = (await cookies()).get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');
  const payload = await verifyToken(token); 
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  return (
    <div className="mx-auto max-w-3xl space-y-6">
      <div>
        <h1 className="text-2xl font-semibold tracking-tight">Business Settings</h1>
        <p className="mt-1 text-sm text-muted-foreground">Keep your business details, payment instructions, and invoice defaults up to date.</p>
      </div>
      <BusinessSettingsForm business={business} />
    </div>
  );
}
