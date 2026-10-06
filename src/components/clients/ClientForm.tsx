'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { useToast } from '@/components/ui/toast';
import type { Client } from '@/lib/types';

interface ClientFormProps {
  mode: 'create' | 'edit';
  client?: Client;
  onSaved?: (client: Client) => void;
}

interface FormState {
  name: string;
  phone: string;
  email: string;
  kra_pin: string;
  address: string;
  notes: string;
}

export default function ClientForm({ mode, client, onSaved }: ClientFormProps) {
  const router = useRouter();
  const { toast } = useToast();

  const [form, setForm] = useState<FormState>({
    name: client?.name ?? '',
    phone: client?.phone ?? '',
    email: client?.email ?? '',
    kra_pin: client?.kra_pin ?? '',
    address: client?.address ?? '',
    notes: client?.notes ?? '',
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const update = (key: keyof FormState, value: string) => {
    setForm((prev) => ({ ...prev, [key]: value }));
  };

  const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    e.stopPropagation();
    if (saving) return;

    setError(null);
    setSaving(true);

    try {
      const url =
        mode === 'create' ? '/api/clients' : `/api/clients/${client?.id}`;
      const method = mode === 'create' ? 'POST' : 'PATCH';

      const res = await fetch(url, {
        method,
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      const data = await res.json();
      if (!res.ok) {
        setError(data.error || 'Could not save client');
        setSaving(false);
        return;
      }

      toast(mode === 'create' ? 'Client added' : 'Client updated', 'success');

      if (onSaved) {
        onSaved(data.client);
      } else if (mode === 'create') {
        router.push(`/clients/${data.client.id}`);
      } else {
        router.refresh();
        router.push(`/clients/${client?.id}`);
      }
    } catch (err) {
      console.error('[client form]', err);
      setError('Network error. Try again.');
      setSaving(false);
    }
  };

  return (
    <form
      onSubmit={handleSubmit}
      method="post"
      action="#"
      noValidate
      className="space-y-6"
    >
      <Card>
        <CardHeader>
          <CardTitle>Client Details</CardTitle>
        </CardHeader>
        <CardContent className="grid gap-4 sm:grid-cols-2">
          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">
              Name <span className="text-red-600">*</span>
            </label>
            <Input
              value={form.name}
              onChange={(e) => update('name', e.target.value)}
              placeholder="e.g. Kamau Hardware"
              className="min-h-11"
              required
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Phone</label>
            <Input
              type="tel"
              value={form.phone}
              onChange={(e) => update('phone', e.target.value)}
              placeholder="0712 345 678"
              className="min-h-11"
              inputMode="tel"
            />
          </div>

          <div>
            <label className="mb-1 block text-sm font-medium">Email</label>
            <Input
              type="email"
              value={form.email}
              onChange={(e) => update('email', e.target.value)}
              placeholder="client@example.com"
              className="min-h-11"
              inputMode="email"
              autoCapitalize="off"
              spellCheck={false}
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">KRA PIN</label>
            <Input
              value={form.kra_pin}
              onChange={(e) => update('kra_pin', e.target.value.toUpperCase())}
              placeholder="P051234567X"
              className="min-h-11 uppercase"
              maxLength={11}
            />
            <p className="mt-1 text-xs text-muted-foreground">
              Required for VAT-registered clients.
            </p>
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Address</label>
            <textarea
              value={form.address}
              onChange={(e) => update('address', e.target.value)}
              rows={2}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Physical or postal address"
            />
          </div>

          <div className="sm:col-span-2">
            <label className="mb-1 block text-sm font-medium">Notes</label>
            <textarea
              value={form.notes}
              onChange={(e) => update('notes', e.target.value)}
              rows={3}
              className="w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring"
              placeholder="Any internal notes about this client"
            />
          </div>
        </CardContent>
      </Card>

      {error && (
        <div
          role="alert"
          className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700"
        >
          {error}
        </div>
      )}

      <div className="flex flex-col gap-2 sm:flex-row sm:justify-end">
        <Button
          type="button"
          variant="outline"
          onClick={() => router.back()}
          disabled={saving}
          className="min-h-11"
        >
          Cancel
        </Button>
        <Button type="submit" disabled={saving} className="min-h-11">
          {saving ? (
            <>
              <Loader2 className="mr-2 h-4 w-4 animate-spin" />
              Saving...
            </>
          ) : mode === 'create' ? (
            'Add Client'
          ) : (
            'Save Changes'
          )}
        </Button>
      </div>
    </form>
  );
}