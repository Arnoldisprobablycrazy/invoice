'use client';

import Link from 'next/link';
import { usePathname } from 'next/navigation';
import {
  LayoutDashboard, FileText, Users, Wallet, Package,
  BarChart3, Settings, Plus,
} from 'lucide-react';
import type { Business } from '@/lib/types';
import { cn } from '@/lib/utils';

const nav = [
  { href: '/dashboard',  label: 'Dashboard',  icon: LayoutDashboard },
  { href: '/invoices',   label: 'Invoices',   icon: FileText },
  { href: '/clients',    label: 'Clients',    icon: Users },
  { href: '/payments',   label: 'Payments',   icon: Wallet },
  { href: '/products',   label: 'Products',   icon: Package },
  { href: '/reports',    label: 'Reports',    icon: BarChart3 },
  { href: '/settings',   label: 'Settings',   icon: Settings },
];

export function AppSidebar({ business }: { business: Business; user: any }) {
  const pathname = usePathname();

  return (
    <aside className="hidden md:flex md:flex-col w-64 border-r bg-background">
      <div className="p-4 border-b">
        <div className="font-semibold truncate">{business.name}</div>
        {business.kra_pin && (
          <div className="text-xs text-muted-foreground">PIN: {business.kra_pin}</div>
        )}
      </div>

      <div className="p-3">
        <Link
          href="/invoices/new"
          className="flex items-center justify-center gap-2 w-full rounded-md bg-primary text-primary-foreground px-3 py-2 text-sm font-medium hover:bg-primary/90"
        >
          <Plus className="h-4 w-4" /> New Invoice
        </Link>
      </div>

      <nav className="flex-1 p-2 space-y-1">
        {nav.map(({ href, label, icon: Icon }) => {
          const active = pathname === href || pathname.startsWith(href + '/');
          return (
            <Link
              key={href}
              href={href}
              className={cn(
                'flex items-center gap-3 rounded-md px-3 py-2 text-sm transition-colors',
                active
                  ? 'bg-accent text-accent-foreground font-medium'
                  : 'text-muted-foreground hover:bg-accent/50'
              )}
            >
              <Icon className="h-4 w-4" />
              {label}
            </Link>
          );
        })}
      </nav>
    </aside>
  );
}