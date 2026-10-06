'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Smartphone, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import { formatKes, formatKenyanPhone } from '@/lib/utils';

interface RequestPaymentDialogProps {
  invoiceId: number;
  invoiceNumber: string;
  balance: number;
  clientName: string;
  clientPhone?: string | null;
}

export function RequestPaymentDialog({
  invoiceId,
  invoiceNumber,
  balance,
  clientName,
  clientPhone,
}: RequestPaymentDialogProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [phone, setPhone] = useState(clientPhone || '');
  const [amount, setAmount] = useState(String(balance));
  const [loading, setLoading] = useState(false);
  const [sentTo, setSentTo] = useState<string | null>(null);

  const handleSubmit = async () => {
    setLoading(true);
    setSentTo(null);

    try {
      const res = await fetch('/api/payments/stkpush', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          invoice_id: invoiceId,
          phone,
          amount: Number(amount),
        }),
      });

      const data = await res.json();

      if (!res.ok) {
        toast(data.error || 'Could not send payment request.', 'error');
        return;
      }

      setSentTo(phone);
      toast(
        `Payment request sent to ${formatKenyanPhone(phone)}. Ask ${clientName} to check their phone.`,
        'success'
      );

      // Poll every 5s for up to 60s to see if payment landed
      let attempts = 0;
      const interval = setInterval(async () => {
        attempts++;
        router.refresh();
        if (attempts >= 12) {
          clearInterval(interval);
        }
      }, 5000);
    } catch (err) {
      toast('Network error. Check your connection.', 'error');
    } finally {
      setLoading(false);
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button className="min-h-11">
          <Smartphone className="mr-2 h-4 w-4" />
          Request Payment
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Request M-Pesa Payment</DialogTitle>
          <DialogDescription>
            Send a payment prompt to {clientName}'s phone for invoice {invoiceNumber}.
          </DialogDescription>
        </DialogHeader>

        {sentTo ? (
          <div className="space-y-4 py-2">
            <div className="rounded-lg border border-green-200 bg-green-50 p-4 text-sm text-green-800">
              <p className="font-medium">Payment request sent</p>
              <p className="mt-1">
                Ask {clientName} to check their phone and enter their M-Pesa PIN.
                Once they pay, this page will update automatically.
              </p>
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() => {
                  setSentTo(null);
                  setPhone(clientPhone || '');
                }}
              >
                Send again
              </Button>
              <Button className="min-h-11 flex-1" onClick={() => setOpen(false)}>
                Done
              </Button>
            </div>
          </div>
        ) : (
          <div className="space-y-4 py-2">
            <div>
              <label className="mb-1 block text-sm font-medium">Phone number</label>
              <Input
                type="tel"
                placeholder="0712 345 678"
                value={phone}
                onChange={(e) => setPhone(e.target.value)}
                className="min-h-11"
              />
            </div>
            <div>
              <label className="mb-1 block text-sm font-medium">Amount (KES)</label>
              <Input
                type="number"
                step="1"
                min="1"
                value={amount}
                onChange={(e) => setAmount(e.target.value)}
                className="min-h-11"
              />
              <p className="mt-1 text-xs text-muted-foreground">
                Balance due: {formatKes(balance)}
              </p>
            </div>
            <div className="rounded-lg border bg-muted/40 p-3 text-xs text-muted-foreground">
              The customer will receive a prompt on their phone. They must enter
              their M-Pesa PIN to complete the payment.
            </div>
            <div className="flex gap-2">
              <Button
                variant="outline"
                className="min-h-11 flex-1"
                onClick={() => setOpen(false)}
                disabled={loading}
              >
                Cancel
              </Button>
              <Button
                className="min-h-11 flex-1"
                onClick={handleSubmit}
                disabled={loading || !phone || !amount}
              >
                {loading ? (
                  <>
                    <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                    Sending...
                  </>
                ) : (
                  'Send Request'
                )}
              </Button>
            </div>
          </div>
        )}
      </DialogContent>
    </Dialog>
  );
}