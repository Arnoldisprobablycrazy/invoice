import { queryOne, execute } from '@/lib/db';
import type { Business } from '@/lib/types';

/**
 * Returns the user's active business. Creates a default if none exists.
 * For MVP: one business per user.
 */
export async function getActiveBusiness(userId: number): Promise<Business | null> {
  let business = await queryOne<Business>(
    'SELECT * FROM businesses WHERE user_id = ? ORDER BY id ASC LIMIT 1',
    [userId]
  );

  if (!business) {
    const user = await queryOne<any>('SELECT * FROM users WHERE id = ?', [userId]);
    if (!user) return null;

    const res = await execute(
      `INSERT INTO businesses (user_id, name) VALUES (?, ?)`,
      [userId, user.username || 'My Business']
    );
    business = await queryOne<Business>(
      'SELECT * FROM businesses WHERE id = ?',
      [res.lastId]
    );
  }

  return business;
}