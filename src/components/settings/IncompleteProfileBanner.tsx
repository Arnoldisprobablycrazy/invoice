'use client';

import { useEffect, useState } from 'react';
import Link from 'next/link';
import { AlertTriangle, ArrowRight } from 'lucide-react';
import { Button } from '@/components/ui/button';
import type { Business } from '@/lib/types';

const HIDE_KEY = 'hideProfileBanner';

export function IncompleteProfileBanner({ business }: { business: Business }) {
  const [hidden, setHidden] = useState(true);

  const missing: string[] = [];
  if (!business.name || business.name === 'My Business') missing.push('Add your business name');
  if (!business.kra_pin) missing.push('Add your KRA PIN');
  if (!business.mpesa_till && !business.mpesa_paybill) missing.push('Add your M-Pesa Till or Paybill');

  useEffect(() => {
    setHidden(sessionStorage.getItem(HIDE_KEY) === 'true');
  }, []);

  if (missing.length === 0 || hidden) return null;

  return (
    <div className="flex flex-col gap-4 rounded-lg border border-amber-200 bg-amber-50 p-4 text-amber-950 sm:flex-row sm:items-center sm:justify-between">
      <div className="flex gap-3"><AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-amber-600" aria-hidden="true" /><div><p className="font-medium">Complete your business profile</p><ul className="mt-1 list-inside list-disc text-sm text-amber-800">{missing.map((item) => <li key={item}>{item}</li>)}</ul></div></div>
      <div className="flex shrink-0 items-center gap-2"><Button asChild variant="outline" className="min-h-11 border-amber-300 bg-amber-50 hover:bg-amber-100"><Link href="/settings">Complete Profile <ArrowRight className="ml-2 h-4 w-4" /></Link></Button><Button type="button" variant="ghost" className="min-h-11 text-amber-900 hover:bg-amber-100" onClick={() => { sessionStorage.setItem(HIDE_KEY, 'true'); setHidden(true); }}>Dismiss</Button></div>
    </div>
  );
}
