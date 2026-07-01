import { createClient } from '@supabase/supabase-js';

export function getSupabaseServer() {
  const url = process.env.SUPABASE_URL;
  const key = process.env.SUPABASE_SERVICE_ROLE_KEY;

  console.log("SUPABASE_URL =", url);
  console.log("SERVICE KEY =", key ? "FOUND" : "MISSING");

  if (!url) throw new Error('SUPABASE_URL is missing');
  if (!key) throw new Error('SUPABASE_SERVICE_ROLE_KEY is missing');

  return createClient(url, key, {
    auth: {
      persistSession: false,
      autoRefreshToken: false,
    },
  });
}
