'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Check, Download, MessageCircle, Send, X } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { formatKes } from '@/lib/utils';
import type { InvoiceWithRelations, PaymentMethod } from '@/lib/types';
import { RequestPaymentDialog } from '@/components/invoices/RequestPaymentDialog';

export default function InvoiceActions({ invoice }: { invoice: InvoiceWithRelations }) {
  const router = useRouter();
  const [manualPaymentOpen, setManualPaymentOpen] = useState(false);
  const [amount, setAmount] = useState(String(Math.max(0, invoice.total - invoice.amount_paid)));
  const [method, setMethod] = useState<PaymentMethod>('cash');
  const [reference, setReference] = useState('');
  const [paidAt, setPaidAt] = useState(new Date().toISOString().slice(0, 16));
  const [feedback, setFeedback] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const publicUrl = typeof window === 'undefined' ? `/i/${invoice.public_token}` : `${window.location.origin}/i/${invoice.public_token}`;
  const balance = invoice.total - invoice.amount_paid;
  const canRequestPayment = balance > 0 && invoice.status !== 'cancelled';

  const runStatus = async (status: 'sent' | 'cancelled') => {
    setLoading(true);
    try {
      const response = await fetch(`/api/invoices/${invoice.id}`, { method: 'PATCH', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ status }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Request failed');
      setFeedback(status === 'sent' ? 'Invoice marked as sent' : 'Invoice cancelled');
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Request failed');
    } finally {
      setLoading(false);
    }
  };

  const recordManualPayment = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/payments', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ invoice_id: invoice.id, amount: Number(amount), method, reference, paid_at: paidAt.slice(0, 10) }) });
      const result = await response.json();
      if (!response.ok) throw new Error(result.error || 'Payment could not be recorded');
      setFeedback('Payment recorded');
      setManualPaymentOpen(false);
      router.refresh();
    } catch (error) {
      setFeedback(error instanceof Error ? error.message : 'Payment could not be recorded');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-3">
      <div className="flex flex-wrap gap-2">
        <Button variant="outline" onClick={() => window.open(`/api/invoices/${invoice.id}/pdf`, '_blank')}><Download className="mr-2 h-4 w-4" /> PDF</Button>
        {canRequestPayment && <RequestPaymentDialog invoiceId={invoice.id} invoiceNumber={invoice.invoice_number} balance={balance} clientName={invoice.client.name} clientPhone={invoice.client.phone} />}
        {canRequestPayment && <Button variant="secondary" onClick={() => setManualPaymentOpen(true)}><Check className="mr-2 h-4 w-4" /> Record payment</Button>}
        {invoice.status === 'draft' && <Button variant="outline" disabled={loading} onClick={() => runStatus('sent')}><Send className="mr-2 h-4 w-4" /> Mark as sent</Button>}
        {canRequestPayment && <Button variant="destructive" disabled={loading} onClick={() => runStatus('cancelled')}><X className="mr-2 h-4 w-4" /> Cancel</Button>}
        {(invoice.status === 'sent' || invoice.status === 'partial' || invoice.status === 'overdue') && <Button variant="ghost" onClick={() => window.open(`https://wa.me/?text=${encodeURIComponent(`Reminder: invoice ${invoice.invoice_number} has a balance of ${formatKes(balance, invoice.currency)}. ${publicUrl}`)}`, '_blank')}><MessageCircle className="mr-2 h-4 w-4" /> Remind</Button>}
      </div>
      {feedback && <p role="status" className="text-sm text-muted-foreground">{feedback}</p>}
      {manualPaymentOpen && <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" role="dialog" aria-modal="true"><div className="w-full max-w-md rounded-xl bg-background p-5 shadow-xl"><div className="mb-4 flex items-center justify-between"><h2 className="text-lg font-semibold">Record manual payment</h2><Button size="icon" variant="ghost" aria-label="Close dialog" onClick={() => setManualPaymentOpen(false)}><X className="h-4 w-4" /></Button></div><div className="space-y-4"><div><label className="mb-1 block text-sm font-medium">Amount</label><Input type="number" min="1" step="0.01" value={amount} onChange={(event) => setAmount(event.target.value)} /></div><div><label className="mb-1 block text-sm font-medium">Method</label><select className="h-9 w-full rounded-lg border border-input bg-background px-3 text-sm" value={method} onChange={(event) => setMethod(event.target.value as PaymentMethod)}>{['cash', 'bank', 'mpesa', 'cheque', 'card'].map((value) => <option key={value} value={value}>{value.toUpperCase()}</option>)}</select></div><div><label className="mb-1 block text-sm font-medium">Reference</label><Input value={reference} onChange={(event) => setReference(event.target.value)} placeholder="Optional receipt or transaction number" /></div><div><label className="mb-1 block text-sm font-medium">Paid at</label><Input type="datetime-local" value={paidAt} onChange={(event) => setPaidAt(event.target.value)} /></div><Button className="w-full" disabled={loading} onClick={recordManualPayment}>{loading ? 'Saving...' : 'Record payment'}</Button></div></div></div>}
    </div>
  );
}
