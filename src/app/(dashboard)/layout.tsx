import { redirect } from 'next/navigation';
import { cookies } from 'next/headers';
import { verifyToken } from '@/lib/jwt';
import { getActiveBusiness } from '@/lib/services/businesses';
import { AppSidebar } from '@/components/ui/AppSidebar';
import { MobileDashboardHeader } from '@/components/ui/MobileDashboardHeader';
import { SidebarProvider, SidebarInset } from '@/components/ui/sidebar';

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const cookieStore = await cookies();
  const token = cookieStore.get('authToken')?.value;
  if (!token) redirect('/accounts/auth/login');

  const payload = verifyToken(token);
  if (!payload) redirect('/accounts/auth/login');

  const business = await getActiveBusiness(payload.userId);
  if (!business) redirect('/onboarding');

  return (
    <SidebarProvider>
      <AppSidebar business={business} user={payload} />
      <SidebarInset>
        <MobileDashboardHeader businessName={business.name} />
        <main className="p-3 md:p-6 lg:p-8">{children}</main>
      </SidebarInset>
    </SidebarProvider>
  );
}