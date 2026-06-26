"use client";

import {
  createContext,
  useContext,
  useEffect,
  useState,
  type ReactNode,
} from "react";
import type { User } from "@supabase/supabase-js";
import { getSupabase, isSupabaseConfigured } from "@/lib/supabase";

interface AuthCtx {
  user: User | null;
  loading: boolean;
  configured: boolean;
  signOut: () => Promise<void>;
}

const Ctx = createContext<AuthCtx>({
  user: null,
  loading: true,
  configured: true,
  signOut: async () => {},
});

export function useAuth() {
  return useContext(Ctx);
}

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const [configured] = useState(isSupabaseConfigured());

  useEffect(() => {
    if (!configured) {
      setLoading(false);
      return;
    }
    const supabase = getSupabase();

    supabase.auth
      .getSession()
      .then(({ data }) => setUser(data.session?.user ?? null))
      .finally(() => setLoading(false));

    const { data: sub } = supabase.auth.onAuthStateChange((_event, session) => {
      setUser(session?.user ?? null);
      setLoading(false);
      // Clean the magic-link params out of the URL after a successful sign-in.
      if (session && typeof window !== "undefined") {
        const url = new URL(window.location.href);
        if (url.searchParams.has("code") || url.hash.includes("access_token")) {
          window.history.replaceState({}, "", url.pathname);
        }
      }
    });

    return () => sub.subscription.unsubscribe();
  }, [configured]);

  async function signOut() {
    if (configured) await getSupabase().auth.signOut();
    setUser(null);
  }

  return (
    <Ctx.Provider value={{ user, loading, configured, signOut }}>
      {children}
    </Ctx.Provider>
  );
}
