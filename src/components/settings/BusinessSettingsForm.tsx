'use client';

import { useMemo, useState } from 'react';
import Image from 'next/image';
import { Save } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import { cn } from '@/lib/utils';
import type { Business } from '@/lib/types';
import { updateBusinessSchema, type UpdateBusinessInput } from '@/lib/validators/business';

type FormState = UpdateBusinessInput;
type FieldErrors = Partial<Record<keyof FormState, string>>;

function initialState(business: Business): FormState {
  return {
    name: business.name || '',
    kra_pin: business.kra_pin || '',
    vat_registered: Boolean(business.vat_registered),
    phone: business.phone || '',
    email: business.email || '',
    address: business.address || '',
    logo_url: business.logo_url || '',
    mpesa_till: business.mpesa_till || '',
    mpesa_paybill: business.mpesa_paybill || '',
    bank_details: business.bank_details || '',
    invoice_prefix: business.invoice_prefix || 'INV',
    default_tax_rate: Number(business.default_tax_rate ?? 16),
    currency: business.currency || 'KES',
  };
}

export default function BusinessSettingsForm({ business }: { business: Business }) {
  const { toast } = useToast();
  const [form, setForm] = useState<FormState>(() => initialState(business));
  const [original, setOriginal] = useState<FormState>(() => initialState(business));
  const [saving, setSaving] = useState(false);
  const [errors, setErrors] = useState<FieldErrors>({});
  const [error, setError] = useState<string | null>(null);
  const hasChanges = useMemo(() => JSON.stringify(form) !== JSON.stringify(original), [form, original]);

  const update = <K extends keyof FormState>(field: K, value: FormState[K]) => {
    setForm((current) => ({ ...current, [field]: value }));
    setErrors((current) => ({ ...current, [field]: undefined }));
    setError(null);
  };

  const submit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setError(null);
    const parsed = updateBusinessSchema.safeParse(form);
    if (!parsed.success) {
      const nextErrors: FieldErrors = {};
      for (const issue of parsed.error.issues) {
        const field = issue.path[0] as keyof FormState | undefined;
        if (field && !nextErrors[field]) nextErrors[field] = issue.message;
      }
      setErrors(nextErrors);
      setError('Please correct the highlighted fields.');
      return;
    }

    setSaving(true);
    try {
      const response = await fetch('/api/business', {
        method: 'PATCH',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const data: { business?: Business; error?: string } = await response.json();
      if (!response.ok) throw new Error(data.error || 'Could not save business settings.');
      const saved = data.business ? initialState(data.business) : parsed.data;
      setForm(saved);
      setOriginal(saved);
      toast('Settings saved', 'success');
    } catch (saveError) {
      const message = saveError instanceof Error ? saveError.message : 'Could not save business settings.';
      setError(message);
      toast(message, 'error');
    } finally {
      setSaving(false);
    }
  };

  const fieldClass = (field: keyof FormState) => cn('min-h-11', errors[field] && 'border-red-500 focus-visible:ring-red-500');
  const fieldError = (field: keyof FormState) => errors[field] && <p className="mt-1 text-sm text-red-600">{errors[field]}</p>;

  return (
    <form onSubmit={submit} className="space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card><CardHeader><CardTitle>Business Information</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div className="sm:col-span-2"><label htmlFor="business-name" className="mb-2 block text-sm font-medium">Business name</label><Input id="business-name" className={fieldClass('name')} value={form.name} onChange={(event) => update('name', event.target.value)} />{fieldError('name')}</div>
        <div><label htmlFor="kra-pin" className="mb-2 block text-sm font-medium">KRA PIN</label><Input id="kra-pin" className={fieldClass('kra_pin')} value={form.kra_pin} onChange={(event) => update('kra_pin', event.target.value.toUpperCase())} />{fieldError('kra_pin')}<p className="mt-1 text-xs text-muted-foreground">Format: P051234567X</p></div>
        <div><label htmlFor="business-phone" className="mb-2 block text-sm font-medium">Phone</label><Input id="business-phone" type="tel" className={fieldClass('phone')} value={form.phone} onChange={(event) => update('phone', event.target.value)} />{fieldError('phone')}<p className="mt-1 text-xs text-muted-foreground">Used on invoices as contact number</p></div>
        <div><label htmlFor="business-email" className="mb-2 block text-sm font-medium">Email</label><Input id="business-email" type="email" className={fieldClass('email')} value={form.email} onChange={(event) => update('email', event.target.value)} />{fieldError('email')}</div>
        <div className="flex items-start gap-3 rounded-lg border p-4 sm:col-span-2"><input id="vat-registered" type="checkbox" className="mt-1 h-5 w-5 rounded border-input" checked={form.vat_registered} onChange={(event) => update('vat_registered', event.target.checked)} /><div><label htmlFor="vat-registered" className="font-medium">VAT registered</label><p className="text-sm text-muted-foreground">Tick if your business is VAT-registered with KRA</p></div></div>
        <div className="sm:col-span-2"><label htmlFor="business-address" className="mb-2 block text-sm font-medium">Address</label><textarea id="business-address" rows={2} className={cn('min-h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50', errors.address && 'border-red-500')} value={form.address} onChange={(event) => update('address', event.target.value)} />{fieldError('address')}</div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Branding</CardTitle></CardHeader><CardContent><label htmlFor="logo-url" className="mb-2 block text-sm font-medium">Logo URL</label><Input id="logo-url" type="url" className={fieldClass('logo_url')} value={form.logo_url} onChange={(event) => update('logo_url', event.target.value)} />{fieldError('logo_url')}{form.logo_url && /^https?:\/\//i.test(form.logo_url) && <div className="mt-4 rounded-lg border p-4"><p className="mb-2 text-xs text-muted-foreground">Preview</p><Image src={form.logo_url} alt="Business logo preview" width={192} height={64} unoptimized className="h-16 max-w-48 object-contain" /></div>}</CardContent></Card>

      <Card><CardHeader><CardTitle>Payment Details</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="mpesa-till" className="mb-2 block text-sm font-medium">M-Pesa Till</label><Input id="mpesa-till" inputMode="numeric" className={fieldClass('mpesa_till')} value={form.mpesa_till} onChange={(event) => update('mpesa_till', event.target.value)} />{fieldError('mpesa_till')}<p className="mt-1 text-xs text-muted-foreground">Buy Goods Till Number</p></div>
        <div><label htmlFor="mpesa-paybill" className="mb-2 block text-sm font-medium">M-Pesa Paybill</label><Input id="mpesa-paybill" inputMode="numeric" className={fieldClass('mpesa_paybill')} value={form.mpesa_paybill} onChange={(event) => update('mpesa_paybill', event.target.value)} />{fieldError('mpesa_paybill')}<p className="mt-1 text-xs text-muted-foreground">Paybill Number</p></div>
        <div className="sm:col-span-2"><label htmlFor="bank-details" className="mb-2 block text-sm font-medium">Bank details</label><textarea id="bank-details" rows={2} className={cn('min-h-11 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus-visible:ring-3 focus-visible:ring-ring/50', errors.bank_details && 'border-red-500')} value={form.bank_details} onChange={(event) => update('bank_details', event.target.value)} />{fieldError('bank_details')}<p className="mt-1 text-xs text-muted-foreground">Bank name, account number, branch</p></div>
      </CardContent></Card>

      <Card><CardHeader><CardTitle>Invoice Defaults</CardTitle></CardHeader><CardContent className="grid gap-5 sm:grid-cols-2">
        <div><label htmlFor="invoice-prefix" className="mb-2 block text-sm font-medium">Invoice prefix</label><Input id="invoice-prefix" className={fieldClass('invoice_prefix')} value={form.invoice_prefix} onChange={(event) => update('invoice_prefix', event.target.value.toUpperCase())} />{fieldError('invoice_prefix')}<p className="mt-1 text-xs text-muted-foreground">e.g. INV, KAM, or your initials</p></div>
        <div><label htmlFor="tax-rate" className="mb-2 block text-sm font-medium">Default tax rate</label><div className="relative"><Input id="tax-rate" type="number" min="0" max="100" step="0.01" className={cn(fieldClass('default_tax_rate'), 'pr-10')} value={form.default_tax_rate} onChange={(event) => update('default_tax_rate', Number(event.target.value))} /><span className="pointer-events-none absolute right-3 top-3 text-sm text-muted-foreground">%</span></div>{fieldError('default_tax_rate')}</div>
        <div><label htmlFor="currency" className="mb-2 block text-sm font-medium">Currency</label><select id="currency" disabled value={form.currency} onChange={(event) => update('currency', event.target.value)} className="min-h-11 w-full rounded-lg border border-input bg-background px-3 text-sm opacity-70"><option value="KES">KES - Kenyan Shilling</option></select><p className="mt-1 text-xs text-muted-foreground">KES is currently the supported currency.</p></div>
      </CardContent></Card>

      <div className="flex justify-end"><Button type="submit" disabled={!hasChanges || saving} className="min-h-11">{saving ? <><span className="mr-2 h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" /> Saving...</> : <><Save className="mr-2 h-4 w-4" /> Save settings</>}</Button></div>
    </form>
  );
}
