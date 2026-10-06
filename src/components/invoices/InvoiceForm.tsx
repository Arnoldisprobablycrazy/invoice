'use client';

import { useMemo, useState } from 'react';
import { useRouter } from 'next/navigation';
import { Plus, Search, Trash2, UserPlus } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Input } from '@/components/ui/input';
import type { Client, Product } from '@/lib/types';
import { createInvoiceSchema } from '@/lib/validators/invoice';

interface InvoiceFormProps {
  clients: Client[];
  products: Product[];
  defaultTaxRate: number;
}

type FormItem = {
  product_id?: number;
  description: string;
  quantity: string;
  unit_price: string;
  tax_rate: string;
};

const today = new Date().toISOString().slice(0, 10);
const nextWeek = new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().slice(0, 10);
const emptyItem = (taxRate: number): FormItem => ({
  description: '',
  quantity: '1',
  unit_price: '',
  tax_rate: String(taxRate),
});

const formatKes = (value: number) => `KES ${value.toLocaleString('en-KE', {
  minimumFractionDigits: value % 1 ? 2 : 0,
  maximumFractionDigits: 2,
})}`;

export default function InvoiceForm({ clients, products, defaultTaxRate }: InvoiceFormProps) {
  const router = useRouter();
  const [selectedClient, setSelectedClient] = useState<Client | null>(null);
  const [clientSearch, setClientSearch] = useState('');
  const [showNewClient, setShowNewClient] = useState(false);
  const [newClient, setNewClient] = useState({ name: '', phone: '', email: '', kra_pin: '', address: '' });
  const [items, setItems] = useState<FormItem[]>([emptyItem(defaultTaxRate)]);
  const [issueDate, setIssueDate] = useState(today);
  const [dueDate, setDueDate] = useState(nextWeek);
  const [notes, setNotes] = useState('');
  const [terms, setTerms] = useState('');
  const [itemSearch, setItemSearch] = useState<Record<number, string>>({});
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  const filteredClients = useMemo(() => {
    const value = clientSearch.trim().toLowerCase();
    if (!value) return clients.slice(0, 6);
    return clients.filter((client) => `${client.name} ${client.email || ''}`.toLowerCase().includes(value)).slice(0, 6);
  }, [clientSearch, clients]);

  const totals = useMemo(() => {
    const round2 = (value: number) => Math.round(value * 100) / 100;
    return items.reduce(
      (result, item) => {
        const line = Number(item.quantity || 0) * Number(item.unit_price || 0);
        const tax = line * Number(item.tax_rate || 0) / 100;
        return {
          subtotal: round2(result.subtotal + line),
          tax: round2(result.tax + tax),
        };
      },
      { subtotal: 0, tax: 0 }
    );
  }, [items]);

  const updateItem = (index: number, patch: Partial<FormItem>) => {
    setItems((current) => current.map((item, itemIndex) => itemIndex === index ? { ...item, ...patch } : item));
  };

  const selectProduct = (index: number, product: Product) => {
    updateItem(index, {
      product_id: product.id,
      description: product.name,
      unit_price: String(product.unit_price),
      tax_rate: String(product.tax_rate),
    });
    setItemSearch((current) => ({ ...current, [index]: '' }));
  };

  const submit = async (status: 'draft' | 'sent') => {
    setError(null);
    const payload = {
      client_id: selectedClient?.id,
      new_client: showNewClient ? {
        name: newClient.name,
        phone: newClient.phone,
        email: newClient.email,
        kra_pin: newClient.kra_pin,
        address: newClient.address,
      } : undefined,
      issue_date: issueDate,
      due_date: dueDate,
      items: items.map((item) => ({
        product_id: item.product_id,
        description: item.description,
        quantity: Number(item.quantity),
        unit_price: Number(item.unit_price),
        tax_rate: Number(item.tax_rate),
      })),
      notes,
      terms,
      status,
    };

    const parsed = createInvoiceSchema.safeParse(payload);
    if (!parsed.success) {
      setError(parsed.error.issues[0]?.message || 'Please check the invoice details.');
      return;
    }

    setLoading(true);
    try {
      const response = await fetch('/api/invoices', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(parsed.data),
      });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Unable to create invoice');
      router.push(`/invoices/${result.invoice.id}`);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : 'Unable to create invoice');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-6">
      {error && <div role="alert" className="rounded-lg border border-red-200 bg-red-50 px-4 py-3 text-sm text-red-700">{error}</div>}

      <Card>
        <CardHeader><CardTitle>Client</CardTitle></CardHeader>
        <CardContent className="space-y-4">
          {!showNewClient && !selectedClient && (
            <div className="relative">
              <label htmlFor="client-search" className="mb-2 block text-sm font-medium">Search clients</label>
              <div className="relative">
                <Search className="pointer-events-none absolute left-3 top-2.5 h-4 w-4 text-muted-foreground" />
                <Input id="client-search" className="pl-9" placeholder="Name or email" value={clientSearch} onChange={(event) => setClientSearch(event.target.value)} />
              </div>
              {filteredClients.length > 0 && (
                <div className="mt-2 overflow-hidden rounded-lg border bg-background shadow-sm">
                  {filteredClients.map((client) => (
                    <button type="button" key={client.id} className="flex min-h-11 w-full items-center justify-between px-3 text-left text-sm hover:bg-muted" onClick={() => { setSelectedClient(client); setClientSearch(''); }}>
                      <span className="font-medium">{client.name}</span>
                      <span className="text-muted-foreground">{client.phone || client.email}</span>
                    </button>
                  ))}
                </div>
              )}
            </div>
          )}

          {selectedClient && (
            <div className="flex items-center justify-between rounded-lg border bg-muted/30 p-3">
              <div><p className="font-medium">{selectedClient.name}</p><p className="text-sm text-muted-foreground">{selectedClient.phone || selectedClient.email}</p></div>
              <Button type="button" variant="ghost" onClick={() => setSelectedClient(null)}>Change</Button>
            </div>
          )}
          {selectedClient && !selectedClient.phone && <p className="text-xs text-amber-600">No phone number: M-Pesa payment requests will need a phone number first.</p>}

          {!selectedClient && !showNewClient && <Button type="button" variant="outline" onClick={() => setShowNewClient(true)}><UserPlus className="mr-2 h-4 w-4" /> Add new client</Button>}

          {showNewClient && (
            <div className="grid gap-4 rounded-lg border bg-muted/20 p-4 sm:grid-cols-2">
              <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Client name</label><Input value={newClient.name} onChange={(event) => setNewClient({ ...newClient, name: event.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium">Phone</label><Input placeholder="0712 345 678" value={newClient.phone} onChange={(event) => setNewClient({ ...newClient, phone: event.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium">Email</label><Input type="email" value={newClient.email} onChange={(event) => setNewClient({ ...newClient, email: event.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium">KRA PIN</label><Input value={newClient.kra_pin} onChange={(event) => setNewClient({ ...newClient, kra_pin: event.target.value })} /></div>
              <div><label className="mb-1 block text-sm font-medium">Address</label><Input value={newClient.address} onChange={(event) => setNewClient({ ...newClient, address: event.target.value })} /></div>
              <Button type="button" variant="ghost" className="sm:col-span-2 sm:justify-self-start" onClick={() => setShowNewClient(false)}>Use an existing client instead</Button>
            </div>
          )}
        </CardContent>
      </Card>

      <Card>
        <CardHeader className="flex flex-row items-center justify-between"><CardTitle>Line items</CardTitle><Button type="button" variant="outline" onClick={() => setItems([...items, emptyItem(defaultTaxRate)])}><Plus className="mr-2 h-4 w-4" /> Add item</Button></CardHeader>
        <CardContent className="space-y-4">
          {items.map((item, index) => {
            const suggestions = products.filter((product) => product.name.toLowerCase().includes((itemSearch[index] || item.description).toLowerCase())).slice(0, 5);
            return (
              <div key={index} className="grid gap-3 rounded-lg border p-3 md:grid-cols-[minmax(0,2fr)_90px_130px_100px_40px] md:items-end">
                <div className="relative"><label className="mb-1 block text-xs font-medium text-muted-foreground">Description</label><Input placeholder="Service or product" value={item.description} onChange={(event) => { updateItem(index, { description: event.target.value, product_id: undefined }); setItemSearch({ ...itemSearch, [index]: event.target.value }); }} />{itemSearch[index] && suggestions.length > 0 && <div className="absolute z-10 mt-1 w-full rounded-lg border bg-background shadow-sm">{suggestions.map((product) => <button type="button" key={product.id} className="flex min-h-10 w-full items-center justify-between px-3 text-left text-sm hover:bg-muted" onClick={() => selectProduct(index, product)}><span>{product.name}</span><span className="text-muted-foreground">{formatKes(product.unit_price)}</span></button>)}</div>}</div>
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Qty</label><Input type="number" min="0.01" step="0.01" value={item.quantity} onChange={(event) => updateItem(index, { quantity: event.target.value })} /></div>
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">Unit price</label><Input type="number" min="0" step="0.01" value={item.unit_price} onChange={(event) => updateItem(index, { unit_price: event.target.value })} /></div>
                <div><label className="mb-1 block text-xs font-medium text-muted-foreground">VAT % (added on top)</label><Input type="number" min="0" max="100" step="1" value={item.tax_rate} onChange={(event) => updateItem(index, { tax_rate: event.target.value })} /></div>
                <Button type="button" variant="ghost" size="icon" aria-label="Remove line item" disabled={items.length === 1} onClick={() => setItems(items.filter((_, itemIndex) => itemIndex !== index))}><Trash2 className="h-4 w-4 text-red-600" /></Button>
                <div className="text-right text-sm font-semibold md:col-start-1 md:col-end-6">Line total: {formatKes(Number(item.quantity || 0) * Number(item.unit_price || 0))}</div>
              </div>
            );
          })}
        </CardContent>
      </Card>

      <div className="grid gap-6 lg:grid-cols-[1fr_320px]">
        <Card><CardHeader><CardTitle>Details</CardTitle></CardHeader><CardContent className="grid gap-4 sm:grid-cols-2">
          <div><label className="mb-1 block text-sm font-medium">Issue date</label><Input type="date" value={issueDate} onChange={(event) => setIssueDate(event.target.value)} /></div>
          <div><label className="mb-1 block text-sm font-medium">Due date</label><Input type="date" value={dueDate} onChange={(event) => setDueDate(event.target.value)} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Notes</label><textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={notes} onChange={(event) => setNotes(event.target.value)} /></div>
          <div className="sm:col-span-2"><label className="mb-1 block text-sm font-medium">Terms</label><textarea className="min-h-24 w-full rounded-lg border border-input bg-transparent px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-ring" value={terms} onChange={(event) => setTerms(event.target.value)} /></div>
        </CardContent></Card>

        <Card className="h-fit"><CardHeader><CardTitle>Summary</CardTitle></CardHeader><CardContent className="space-y-3">
          <div className="flex justify-between text-sm"><span>Subtotal</span><span>{formatKes(totals.subtotal)}</span></div>
          <div className="flex justify-between text-sm"><span>VAT</span><span>{formatKes(totals.tax)}</span></div>
          <div className="flex justify-between border-t pt-3 text-lg font-bold"><span>Total</span><span>{formatKes(totals.subtotal + totals.tax)}</span></div>
          <div className="grid gap-2 pt-3"><Button type="button" disabled={loading} onClick={() => submit('draft')}>Save as Draft</Button><Button type="button" variant="outline" disabled={loading} onClick={() => submit('sent')}>{loading ? 'Saving...' : 'Save & Send'}</Button></div>
        </CardContent></Card>
      </div>
    </div>
  );
}
