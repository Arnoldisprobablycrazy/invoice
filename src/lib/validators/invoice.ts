import { z } from 'zod';

const phoneRegex = /^(\+?254|0)[17]\d{8}$/;

export const invoiceItemSchema = z.object({
  product_id: z.number().int().positive().nullable().optional(),
  description: z.string().min(1, 'Description required').max(500),
  quantity: z.number().positive('Quantity must be > 0'),
  unit_price: z.number().min(0, 'Price cannot be negative'),
  tax_rate: z.number().min(0).max(100).default(16),
});

export const createInvoiceSchema = z.object({
  client_id: z.number().int().positive().optional(),
  new_client: z
    .object({
      name: z.string().min(1).max(255),
      phone: z.string().regex(phoneRegex, 'Invalid Kenyan phone').optional().or(z.literal('')),
      email: z.string().email().optional().or(z.literal('')),
      kra_pin: z.string().max(20).optional().or(z.literal('')),
      address: z.string().max(500).optional().or(z.literal('')),
    })
    .optional(),
  issue_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  due_date: z.string().regex(/^\d{4}-\d{2}-\d{2}$/),
  items: z.array(invoiceItemSchema).min(1, 'At least one item required'),
  notes: z.string().max(2000).optional().or(z.literal('')),
  terms: z.string().max(2000).optional().or(z.literal('')),
  status: z.enum(['draft', 'sent']).default('draft'),
}).refine(
  (d) => d.client_id || d.new_client?.name,
  { message: 'Provide client_id or new_client', path: ['client_id'] }
);

export type CreateInvoiceInput = z.infer<typeof createInvoiceSchema>;