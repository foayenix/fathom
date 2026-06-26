"use client";

import { createClient, type SupabaseClient } from "@supabase/supabase-js";

// Single browser Supabase client. Session is persisted in localStorage and
// kept fresh automatically; magic-link redirects are picked up from the URL.
//
// NEXT_PUBLIC_* vars are inlined at build time, so they must be set in Railway
// before the build runs. Changing them later requires a redeploy.

let client: SupabaseClient | null = null;

export function isSupabaseConfigured(): boolean {
  return Boolean(
    process.env.NEXT_PUBLIC_SUPABASE_URL &&
      process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY,
  );
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!url || !key) {
    throw new Error(
      "Supabase is not configured. Set NEXT_PUBLIC_SUPABASE_URL and NEXT_PUBLIC_SUPABASE_ANON_KEY.",
    );
  }
  client = createClient(url, key, {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
    },
  });
  return client;
}

// The currently signed-in user's id, or throws if not authenticated. Used by
// the data layer when writing rows (RLS also enforces this server-side).
export async function requireUserId(): Promise<string> {
  const {
    data: { user },
  } = await getSupabase().auth.getUser();
  if (!user) throw new Error("Not signed in.");
  return user.id;
}
