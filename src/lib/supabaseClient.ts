import { createBrowserClient } from "@supabase/ssr"

let _supabase: ReturnType<typeof createBrowserClient> | null = null;

/**
 * getSupabaseClient
 * 
 * Lazily initializes the Supabase client at runtime.
 * This prevents initialization during static build evaluation.
 */
export function getSupabaseClient() {
  if (!_supabase) {
    const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
    const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
    if (!url || !key) {
      throw new Error('Supabase environment variables (NEXT_PUBLIC_SUPABASE_URL, NEXT_PUBLIC_SUPABASE_ANON_KEY) are missing');
    }
    _supabase = createBrowserClient(url, key);
  }
  return _supabase;
}

/**
 * supabase
 * 
 * Proxy that lazily invokes getSupabaseClient() on first use.
 * Preserves the existing import pattern while deferring initialization.
 */
export const supabase = new Proxy({} as ReturnType<typeof createBrowserClient>, {
  get(_, prop) {
    const client = getSupabaseClient();
    return client[prop as keyof ReturnType<typeof createBrowserClient>];
  }
});


