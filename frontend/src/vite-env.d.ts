/// <reference types="vite/client" />

/**
 * Vite Environment Variable Type Definitions
 * 
 * Provides TypeScript type safety for Vite's import.meta.env.
 * These extend the default Vite types to include our custom env variables.
 * 
 * Why this exists:
 * - TypeScript needs explicit type declarations for import.meta.env
 * - Prevents "Property does not exist on type 'ImportMeta'" errors
 * - Provides autocomplete for environment variables in the IDE
 */

interface ImportMetaEnv {
  /** Supabase project URL - required for production database access */
  readonly VITE_SUPABASE_URL: string;
  
  /** Supabase anonymous key - used for unauthenticated RLS access */
  readonly VITE_SUPABASE_ANON_KEY: string;
  
  /** True when running in development mode (npm run dev) */
  readonly DEV: boolean;
  
  /** True when running in production mode (npm run build) */
  readonly PROD: boolean;
  
  /** Current mode: 'development', 'production', or 'test' */
  readonly MODE: string;
}

interface ImportMeta {
  readonly env: ImportMetaEnv;
}
