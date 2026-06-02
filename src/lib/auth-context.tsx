import { createContext, useCallback, useContext, useEffect, useRef, useState, type ReactNode } from "react";
import type { Session, User } from "@supabase/supabase-js";
import { supabase } from "@/integrations/supabase/client";

export type AppRole = "admin" | "user";

type AuthState = {
  session: Session | null;
  user: User | null;
  roles: AppRole[];
  loading: boolean;
  signIn: (email: string, password: string, rememberMe?: boolean) => Promise<{ error?: string }>;
  signOut: () => Promise<void>;
};

const AuthContext = createContext<AuthState | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [session, setSession] = useState<Session | null>(null);
  const [roles, setRoles] = useState<AppRole[]>([]);
  const [loading, setLoading] = useState(true);
  const rolesRequestRef = useRef(0);

  const loadRoles = useCallback(async (userId: string) => {
    const { data } = await supabase
      .from("user_roles")
      .select("role")
      .eq("user_id", userId);
    const next = (data ?? []).map((r) => r.role as AppRole).sort();
    setRoles((prev) => {
      if (prev.length === next.length && prev.every((v, i) => v === next[i])) {
        return prev; // mantém referência — evita re-render em cascata no iframe
      }
      return next;
    });
  }, []);

  useEffect(() => {
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      const requestId = ++rolesRequestRef.current;
      setLoading(true);
      setSession((prev) => {
        if (prev?.access_token === s?.access_token && prev?.user?.id === s?.user?.id) {
          return prev; // idem token → não re-renderiza
        }
        return s;
      });
      if (s?.user) {
        setTimeout(() => {
          loadRoles(s.user.id).finally(() => {
            if (rolesRequestRef.current === requestId) setLoading(false);
          });
        }, 0);
      } else {
        setRoles([]);
        setLoading(false);
      }
    });

    supabase.auth.getSession().then(({ data }) => {
      const requestId = ++rolesRequestRef.current;
      setSession(data.session);
      if (data.session?.user) {
        loadRoles(data.session.user.id).finally(() => {
          if (rolesRequestRef.current === requestId) setLoading(false);
        });
      } else {
        setLoading(false);
      }
    });

    return () => subscription.unsubscribe();
  }, [loadRoles]);

  async function signIn(email: string, password: string, rememberMe = true) {
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    if (error) return { error: error.message };
    try {
      sessionStorage.setItem("fj_intro_pending", "1");
      if (rememberMe) {
        localStorage.setItem("fj_remember_me", "1");
      } else {
        localStorage.removeItem("fj_remember_me");
      }
    } catch {
      // ignore
    }
    return {};
  }

  async function signOut() {
    await supabase.auth.signOut();
  }

  return (
    <AuthContext.Provider
      value={{
        session,
        user: session?.user ?? null,
        roles,
        loading,
        signIn,
        signOut,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used inside AuthProvider");
  return ctx;
}
