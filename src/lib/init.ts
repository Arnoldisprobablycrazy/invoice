/**
 * Application Initialization
 * 
 * This file runs database pool initialization when the app starts.
 * Must be imported in src/app/layout.tsx to work.
 */

import { initializePool } from './db';

let initialized = false;

/**
 * Initialize all application services
 * Call this in your root layout to set up database on app start
 */
export async function initializeApp() {
  if (initialized) return;

  try {
    console.log('🚀 Initializing application...');
    
    // Initialize MySQL pool
    await initializePool();
    
    console.log('✅ Application initialized successfully');
    initialized = true;
  } catch (error) {
    console.error('❌ Failed to initialize application:', error);
    throw error;
  }
}
