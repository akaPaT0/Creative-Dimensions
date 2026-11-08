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

type AuthContextValue = {
  user: User | null;
  session: Session | null;
  isLoaded: boolean;
  isSignedIn: boolean;
  signIn: (email: string, password: string, turnstileToken?: string) => Promise<{ error?: string }>;
  signUp: (email: string, password: string, turnstileToken?: string) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
  getAccessToken: () => Promise<string | null>;
};

const AuthContext = createContext<AuthContextValue | null>(null);

function getMessage(error: unknown) {
  return error instanceof Error ? error.message : "Something went wrong.";
}

export function SupabaseAuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [isLoaded, setIsLoaded] = useState(false);

  useEffect(() => {
    let alive = true;

    supabase.auth.getSession().then(({ data }) => {
      if (!alive) return;
      setSession(data.session ?? null);
      setIsLoaded(true);
    });

    const {
      data: { subscription },
    } = supabase.auth.onAuthStateChange((_event, nextSession) => {
      setSession(nextSession);
      setIsLoaded(true);
    });

    return () => {
      alive = false;
      subscription.unsubscribe();
    };
  }, []);

  const signIn = useCallback(
    async (email: string, password: string, turnstileToken?: string) => {
      try {
        const res = await fetch("/api/auth/login", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, turnstileToken }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return { error: data.error || "Failed to sign in." };
        }

        // Re-sync browser session from cookies set by the server
        const { data: sessionData } = await supabase.auth.getSession();
        setSession(sessionData.session ?? null);

        return {};
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to connect to authentication service.";
        return { error: msg };
      }
    },
    []
  );

  const signUp = useCallback(
    async (email: string, password: string, turnstileToken?: string) => {
      try {
        const res = await fetch("/api/auth/signup", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ email, password, turnstileToken }),
        });

        const data = await res.json().catch(() => ({}));

        if (!res.ok) {
          return { error: data.error || "Failed to create account." };
        }

        return {};
      } catch (err) {
        const msg =
          err instanceof Error ? err.message : "Failed to connect to registration service.";
        return { error: msg };
      }
    },
    []
  );

  const signOut = useCallback(async () => {
    await supabase.auth.signOut();
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
    }),
    [getAccessToken, isLoaded, session, signIn, signOut, signUp]
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
