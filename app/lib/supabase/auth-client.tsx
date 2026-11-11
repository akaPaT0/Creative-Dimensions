"use client";

import {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useState,
  type ReactNode,
} from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/app/lib/supabase/clients";

const TOKEN_COOKIE = "cd_supabase_token";

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
  /** Re-read the signed-in user (e.g. after profile changes). */
  refreshUser: () => Promise<void>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

function syncTokenCookie(session: Session | null) {
  if (typeof document === "undefined") return;
  // On the live (https) site the login cookie is never sent over plain http.
  const secure = window.location.protocol === "https:" ? "; Secure" : "";

  if (!session?.access_token) {
    document.cookie = `${TOKEN_COOKIE}=; Path=/; Max-Age=0; SameSite=Lax${secure}`;
    return;
  }

  document.cookie = `${TOKEN_COOKIE}=${encodeURIComponent(
    session.access_token
  )}; Path=/; Max-Age=604800; SameSite=Lax${secure}`;
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      syncTokenCookie(data.session ?? null);
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      syncTokenCookie(nextSession);
      setIsLoaded(true);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signUp = useCallback(async (email: string, password: string) => {
    const { error } = await supabase.auth.signUp({ email, password });
    return error ? { error: error.message } : {};
  }, []);

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
  }, []);

  const refreshUser = useCallback(async () => {
    // A refreshed session carries the latest user metadata; the auth listener
    // picks it up and updates everything that reads the user.
    const { data } = await supabase.auth.refreshSession();
    if (data.session) {
      setSession(data.session);
      syncTokenCookie(data.session);
    }
  }, []);

  const getAccessToken = useCallback(async () => {
    const { data, error } = await supabase.auth.getSession();
    if (error) throw new Error(error.message);
    return data.session?.access_token ?? null;
  }, []);

  const value = useMemo<AuthContextValue>(
    () => ({
      user: session?.user ?? null,
      session,
      isLoaded,
      isSignedIn: Boolean(session?.user),
      signIn,
      signUp,
      signOut,
      getAccessToken,
      refreshUser,
    }),
    [getAccessToken, isLoaded, refreshUser, session, signIn, signOut, signUp]
  );

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useSupabaseAuth() {
  const value = useContext(AuthContext);
  if (!value) {
    throw new Error("useSupabaseAuth must be used inside SupabaseAuthProvider");
  }
  return value;
}

export async function authFetch(input: RequestInfo | URL, init: RequestInit = {}) {
  const { data, error } = await supabase.auth.getSession();
  if (error) throw new Error(getMessage(error));

  const headers = new Headers(init.headers);
  if (data.session?.access_token) {
    headers.set("Authorization", `Bearer ${data.session.access_token}`);
  }

  return fetch(input, {
    ...init,
    headers,
  });
}

// One server check per signed-in user, shared by every component that asks.
const adminChecks = new Map<string, Promise<boolean>>();

/**
 * Whether the signed-in user is the shop admin. The server decides (it alone knows
 * the admin email); this only controls which shortcuts are shown. Admin pages and
 * actions are always checked again on the server.
 */
export function useIsAdmin() {
  const { isLoaded, user } = useSupabaseAuth();
  const userId = user?.id ?? "";
  const [adminUserId, setAdminUserId] = useState("");

  useEffect(() => {
    if (!isLoaded || !userId) return;
    let alive = true;
    let check = adminChecks.get(userId);
    if (!check) {
      check = authFetch("/api/admin/me", { cache: "no-store" })
        .then((res) => res.ok)
        .catch(() => {
          adminChecks.delete(userId); // network hiccup: allow a retry later
          return false;
        });
      adminChecks.set(userId, check);
    }
    void check.then((isAdmin) => {
      if (alive && isAdmin) setAdminUserId(userId);
    });
    return () => {
      alive = false;
    };
  }, [isLoaded, userId]);

  return Boolean(userId) && adminUserId === userId;
}

