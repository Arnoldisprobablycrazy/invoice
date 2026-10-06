import { z } from 'zod';

const optionalText = (schema: z.ZodType<string>) => schema.optional().or(z.literal(''));

export const updateBusinessSchema = z.object({
  name: z.string().min(1, 'Business name is required').max(255),
  kra_pin: optionalText(z.string().regex(/^[A-Z]\d{9}[A-Z]$/i, 'Use a valid KRA PIN such as P051234567X')),
  vat_registered: z.boolean().default(false),
  phone: optionalText(z.string().regex(/^(\+?254|0)[17]\d{8}$/, 'Use a valid Kenyan phone number')),
  email: optionalText(z.string().email('Use a valid email address')),
  address: z.string().max(500, 'Address must be 500 characters or fewer').optional().or(z.literal('')),
  logo_url: optionalText(z.string().url('Use a valid logo URL').max(500, 'Logo URL must be 500 characters or fewer')),
  mpesa_till: optionalText(z.string().regex(/^\d{5,7}$/, 'Till number must contain 5 to 7 digits')),
  mpesa_paybill: optionalText(z.string().regex(/^\d{5,7}$/, 'Paybill number must contain 5 to 7 digits')),
  bank_details: z.string().max(500, 'Bank details must be 500 characters or fewer').optional().or(z.literal('')),
  invoice_prefix: z.string().min(2).max(10).regex(/^[A-Z]+$/, 'Use uppercase letters only').default('INV'),
  default_tax_rate: z.number().min(0).max(100).default(16),
  currency: z.string().length(3).default('KES'),
});

export type UpdateBusinessInput = z.infer<typeof updateBusinessSchema>;