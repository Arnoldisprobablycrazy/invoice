import { cn } from '@/lib/utils';
import type { InvoiceStatus } from '@/lib/types';

const styles: Record<InvoiceStatus, string> = {
  draft: 'bg-gray-100 text-gray-700 border-gray-200',
  sent: 'bg-blue-100 text-blue-700 border-blue-200',
  partial: 'bg-amber-100 text-amber-700 border-amber-200',
  paid: 'bg-green-100 text-green-700 border-green-200',
  overdue: 'bg-red-100 text-red-700 border-red-200',
  cancelled: 'bg-gray-100 text-gray-500 border-gray-200 line-through',
};

const labels: Record<InvoiceStatus, string> = {
  draft: 'Draft', sent: 'Sent', partial: 'Partial', paid: 'Paid', overdue: 'Overdue', cancelled: 'Cancelled',
};

export function StatusBadge({ status }: { status: InvoiceStatus }) {
  return (
    <span className={cn('inline-flex items-center rounded-full border px-2 py-0.5 text-xs font-medium', styles[status])}>
      {labels[status]}
    </span>
  );
}

export default StatusBadge;