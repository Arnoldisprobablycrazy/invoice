'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { Pencil, Trash2, MessageCircle, FileText, Loader2 } from 'lucide-react';
import { Button } from '@/components/ui/button';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { useToast } from '@/components/ui/toast';
import ClientForm from './ClientForm';
import type { Client, Business } from '@/lib/types';
import { whatsAppShareUrl, formatKes } from '@/lib/utils';

interface ClientActionsProps {
  client: Client;
  business: Business;
}

export default function ClientActions({ client, business }: ClientActionsProps) {
  const router = useRouter();
  const { toast } = useToast();
  const [editOpen, setEditOpen] = useState(false);
  const [deleteOpen, setDeleteOpen] = useState(false);
  const [deleting, setDeleting] = useState(false);

  const handleWhatsApp = () => {
    const message = [
      `Hi ${client.name},`,
      ``,
      `This is ${business.name}. Hope you're well.`,
      ``,
      `Let me know if you need anything.`,
    ].join('\n');

    window.open(whatsAppShareUrl(client.phone, message), '_blank', 'noopener,noreferrer');
  };

  const handleDelete = async () => {
    setDeleting(true);
    try {
      const res = await fetch(`/api/clients/${client.id}`, { method: 'DELETE' });
      const data = await res.json();
      if (!res.ok) {
        toast(data.error || 'Could not delete client', 'error');
        setDeleting(false);
        return;
      }
      toast('Client deleted', 'success');
      router.push('/clients');
    } catch {
      toast('Network error', 'error');
      setDeleting(false);
    }
  };

  return (
    <div className="flex flex-wrap gap-2">
      {/* Edit */}
      <Dialog open={editOpen} onOpenChange={setEditOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="min-h-10">
            <Pencil className="mr-2 h-4 w-4" /> Edit
          </Button>
        </DialogTrigger>
        <DialogContent className="max-h-[90vh] overflow-y-auto sm:max-w-2xl">
          <DialogHeader>
            <DialogTitle>Edit Client</DialogTitle>
            <DialogDescription>Update {client.name}'s details.</DialogDescription>
          </DialogHeader>
          <ClientForm
            mode="edit"
            client={client}
            onSaved={() => {
              setEditOpen(false);
              router.refresh();
            }}
          />
        </DialogContent>
      </Dialog>

      {/* WhatsApp */}
      <Button
        variant="outline"
        className="min-h-10"
        onClick={handleWhatsApp}
        disabled={!client.phone}
      >
        <MessageCircle className="mr-2 h-4 w-4" /> WhatsApp
      </Button>

      {/* New Invoice */}
      <Button asChild className="min-h-10">
        <a href={`/invoices/new?client_id=${client.id}`}>
          <FileText className="mr-2 h-4 w-4" /> New Invoice
        </a>
      </Button>

      {/* Delete */}
      <Dialog open={deleteOpen} onOpenChange={setDeleteOpen}>
        <DialogTrigger asChild>
          <Button variant="outline" className="min-h-10 text-red-600 hover:bg-red-50">
            <Trash2 className="mr-2 h-4 w-4" /> Delete
          </Button>
        </DialogTrigger>
        <DialogContent className="sm:max-w-md">
          <DialogHeader>
            <DialogTitle>Delete {client.name}?</DialogTitle>
            <DialogDescription>
              This cannot be undone. Clients with existing invoices cannot be deleted.
            </DialogDescription>
          </DialogHeader>
          <div className="flex gap-2 pt-2">
            <Button
              variant="outline"
              className="min-h-11 flex-1"
              onClick={() => setDeleteOpen(false)}
              disabled={deleting}
            >
              Cancel
            </Button>
            <Button
              variant="destructive"
              className="min-h-11 flex-1"
              onClick={handleDelete}
              disabled={deleting}
            >
              {deleting ? (
                <>
                  <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                  Deleting...
                </>
              ) : (
                'Delete Client'
              )}
            </Button>
          </div>
        </DialogContent>
      </Dialog>
    </div>
  );
}