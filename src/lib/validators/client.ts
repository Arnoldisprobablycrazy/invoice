import { z } from 'zod';

const phoneRegex = /^(\+?254|0)[17]\d{8}$/;
const kraPinRegex = /^[A-Z]\d{9}[A-Z]$/i;

export const createClientSchema = z.object({
  name: z.string().trim().min(1, 'Client name is required').max(255),
  phone: z
    .string()
    .trim()
    .regex(phoneRegex, 'Enter a valid Kenyan phone (07XX XXX XXX)')
    .optional()
    .or(z.literal('')),
  email: z
    .string()
    .trim()
    .email('Enter a valid email')
    .optional()
    .or(z.literal('')),
  kra_pin: z
    .string()
    .trim()
    .regex(kraPinRegex, 'KRA PIN format is P051234567X')
    .optional()
    .or(z.literal('')),
  address: z.string().trim().max(500).optional().or(z.literal('')),
  notes: z.string().trim().max(1000).optional().or(z.literal('')),
});

export const updateClientSchema = createClientSchema.partial();

export type CreateClientInput = z.infer<typeof createClientSchema>;
export type UpdateClientInput = z.infer<typeof updateClientSchema>;