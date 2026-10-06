import { query } from '@/lib/db';
import type { Product } from '@/lib/types';

export async function listProducts(businessId: number): Promise<Product[]> {
  return query<Product>(
    `SELECT * FROM products
      WHERE business_id = ? AND is_active = 1
      ORDER BY name ASC`,
    [businessId]
  );
}