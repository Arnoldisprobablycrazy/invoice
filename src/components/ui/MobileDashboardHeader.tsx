'use client';

import Link from 'next/link';
import { Menu, Plus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from '@/components/ui/sheet';
import { useSidebar } from '@/components/ui/sidebar';

const links = [
  ['Dashboard', '/dashboard'],
  ['Invoices', '/invoices'],
  ['Clients', '/clients'],
  ['Payments', '/payments'],
  ['Products', '/products'],
  ['Reports', '/reports'],
  ['Settings', '/settings'],
] as const;

export function MobileDashboardHeader({ businessName }: { businessName: string }) {
  const { openMobile, setOpenMobile } = useSidebar();

  return (
    <div className="sticky top-0 z-30 flex min-h-14 items-center justify-between border-b bg-background/95 px-3 backdrop-blur md:hidden">
      <Sheet open={openMobile} onOpenChange={setOpenMobile}>
        <SheetTrigger asChild><Button variant="ghost" size="icon-lg" aria-label="Open navigation"><Menu className="h-5 w-5" /></Button></SheetTrigger>
        <SheetContent side="left" className="w-[min(82vw,20rem)] p-0">
          <SheetHeader className="border-b pr-12"><SheetTitle className="truncate text-left">{businessName}</SheetTitle></SheetHeader>
          <nav className="flex flex-col gap-1 p-3">{links.map(([label, href]) => <Link key={href} href={href} onClick={() => setOpenMobile(false)} className="flex min-h-11 items-center rounded-lg px-3 text-sm text-muted-foreground hover:bg-accent hover:text-foreground">{label}</Link>)}<Link href="/invoices/new" onClick={() => setOpenMobile(false)} className="mt-3 flex min-h-11 items-center justify-center gap-2 rounded-lg bg-primary px-3 text-sm font-medium text-primary-foreground"><Plus className="h-4 w-4" /> New Invoice</Link></nav>
        </SheetContent>
      </Sheet>
      <span className="max-w-[60%] truncate text-sm font-semibold">{businessName}</span>
      <Button asChild size="icon-lg" aria-label="Create invoice"><Link href="/invoices/new"><Plus className="h-5 w-5" /></Link></Button>
    </div>
  );
}
