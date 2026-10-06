'use client';

import { useState } from 'react';
import { Share2, Copy, Check, MessageCircle } from 'lucide-react';
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
import {
  formatKes,
  formatDate,
  publicInvoiceUrl,
  whatsAppShareUrl,
} from '@/lib/utils';

interface ShareInvoiceDialogProps {
  invoiceNumber: string;
  publicToken: string;
  total: number;
  balance: number;
  currency: string;
  dueDate: string;
  clientName: string;
  clientPhone: string | null;
  businessName: string;
  mpesaTill?: string | null;
  mpesaPaybill?: string | null;
}

export function ShareInvoiceDialog({
  invoiceNumber,
  publicToken,
  total,
  balance,
  currency,
  dueDate,
  clientName,
  clientPhone,
  businessName,
  mpesaTill,
  mpesaPaybill,
}: ShareInvoiceDialogProps) {
  const { toast } = useToast();
  const [open, setOpen] = useState(false);
  const [copied, setCopied] = useState(false);

  const publicUrl = publicInvoiceUrl(publicToken);

  // Build a WhatsApp-friendly message
  const paymentLine = mpesaTill
    ? `Pay via M-Pesa Till ${mpesaTill}.`
    : mpesaPaybill
    ? `Pay via M-Pesa Paybill ${mpesaPaybill}.`
    : '';

  const message = [
    `Hi ${clientName},`,
    ``,
    `Your invoice ${invoiceNumber} from ${businessName} is ready.`,
    ``,
    `Amount: ${formatKes(balance > 0 ? balance : total, currency)}`,
    `Due: ${formatDate(dueDate)}`,
    paymentLine,
    ``,
    `View and download here:`,
    publicUrl,
    ``,
    `Thank you!`,
  ]
    .filter((line) => line !== '')
    .join('\n');

  const handleWhatsApp = () => {
    const url = whatsAppShareUrl(clientPhone, message);
    window.open(url, '_blank', 'noopener,noreferrer');
    toast('Opening WhatsApp...', 'success');
  };

  const handleCopyLink = async () => {
    try {
      await navigator.clipboard.writeText(publicUrl);
      setCopied(true);
      toast('Link copied to clipboard', 'success');
      setTimeout(() => setCopied(false), 2000);
    } catch {
      toast('Could not copy — copy manually below', 'error');
    }
  };

  return (
    <Dialog open={open} onOpenChange={setOpen}>
      <DialogTrigger asChild>
        <Button variant="outline" className="min-h-11">
          <Share2 className="mr-2 h-4 w-4" />
          Share
        </Button>
      </DialogTrigger>
      <DialogContent className="sm:max-w-md">
        <DialogHeader>
          <DialogTitle>Share Invoice {invoiceNumber}</DialogTitle>
          <DialogDescription>
            Send this invoice to {clientName} via WhatsApp, or copy the link.
          </DialogDescription>
        </DialogHeader>

        <div className="space-y-4 py-2">
          {/* Primary action: WhatsApp */}
          <Button
            onClick={handleWhatsApp}
            className="min-h-12 w-full bg-[#25D366] text-white hover:bg-[#1ebe5b]"
          >
            <MessageCircle className="mr-2 h-5 w-5" />
            {clientPhone ? `Send to ${clientName}` : 'Share via WhatsApp'}
          </Button>

          {!clientPhone && (
            <p className="text-xs text-muted-foreground">
              No phone on file — WhatsApp will open a contact picker instead.
            </p>
          )}

          {/* Divider */}
          <div className="relative">
            <div className="absolute inset-0 flex items-center">
              <div className="w-full border-t" />
            </div>
            <div className="relative flex justify-center text-xs uppercase">
              <span className="bg-background px-2 text-muted-foreground">or</span>
            </div>
          </div>

          {/* Copy link fallback */}
          <div className="space-y-2">
            <label className="text-sm font-medium">Public link</label>
            <div className="flex gap-2">
              <Input
                value={publicUrl}
                readOnly
                onFocus={(e) => e.target.select()}
                className="min-h-11 font-mono text-xs"
              />
              <Button
                variant="outline"
                onClick={handleCopyLink}
                className="min-h-11 shrink-0"
                aria-label="Copy link"
              >
                {copied ? (
                  <Check className="h-4 w-4 text-green-600" />
                ) : (
                  <Copy className="h-4 w-4" />
                )}
              </Button>
            </div>
            <p className="text-xs text-muted-foreground">
              Anyone with this link can view the invoice — no login needed.
            </p>
          </div>

          {/* Preview of the message */}
          <details className="rounded-lg border bg-muted/30 p-3">
            <summary className="cursor-pointer text-sm font-medium">
              Preview message
            </summary>
            <pre className="mt-3 whitespace-pre-wrap text-xs text-muted-foreground">
              {message}
            </pre>
          </details>
        </div>
      </DialogContent>
    </Dialog>
  );
}