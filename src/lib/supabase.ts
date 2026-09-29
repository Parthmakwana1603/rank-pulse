import { createClient } from '@supabase/supabase-js';

const url = import.meta.env.VITE_SUPABASE_URL;
const anonKey = import.meta.env.VITE_SUPABASE_ANON_KEY;

/** Supabase client, or null when the app runs in demo mode (no Supabase keys configured). */
export const supabase = url && anonKey ? createClient(url, anonKey) : null;
