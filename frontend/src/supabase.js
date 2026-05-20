import { createClient } from '@supabase/supabase-js';

const supabaseUrl = import.meta.env.VITE_SUPABASE_URL || 'https://vzixksighjwqzchdknum.supabase.co';
const supabaseAnonKey = import.meta.env.VITE_SUPABASE_ANON_KEY || '';

let supabaseClient;
try {
  if (!supabaseAnonKey) {
    console.warn('[Supabase] VITE_SUPABASE_ANON_KEY is missing. Using a fallback mock to prevent startup crash.');
    supabaseClient = createClient(supabaseUrl, 'dummy-anon-key-to-prevent-startup-crash-local');
  } else {
    supabaseClient = createClient(supabaseUrl, supabaseAnonKey);
  }
} catch (e) {
  console.error('[Supabase] Failed to initialize client:', e);
  supabaseClient = {
    auth: {
      getSession: () => Promise.resolve({ data: { session: null } }),
      onAuthStateChange: () => ({ data: { subscription: { unsubscribe: () => {} } } }),
      signOut: () => Promise.resolve({ error: null }),
      signUp: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signInWithPassword: () => Promise.resolve({ error: new Error('Supabase not configured') }),
      signInWithOAuth: () => Promise.resolve({ error: new Error('Supabase not configured') })
    }
  };
}

export const supabase = supabaseClient;

