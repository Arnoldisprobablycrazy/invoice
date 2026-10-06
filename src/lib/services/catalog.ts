import { query } from '@/lib/db';
import type { Client, Product } from '@/lib/types';

export async function listClients(businessId: number): Promise<Client[]> {
  return query<Client>(
    'SELECT * FROM clients WHERE business_id = ? ORDER BY name ASC',
    [businessId]
  );
}

export async function listProducts(businessId: number): Promise<Product[]> {
  return query<Product>(
    'SELECT * FROM products WHERE business_id = ? AND is_active = 1 ORDER BY name ASC',
    [businessId]
  );
}