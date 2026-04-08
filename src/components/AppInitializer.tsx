/**
 * App Initializer Component
 * 
 * Removed database initialization to prevent server crashes.
 * Database will connect on-demand when first API request is made.
 */

export async function AppInitializer() {
  return null;
}
