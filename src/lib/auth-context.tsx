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
    const requestId = ++rolesRequestRef.current;
    try {
      const { data } = await supabase
        .from("user_roles")
        .select("role")
        .eq("user_id", userId);
      if (rolesRequestRef.current !== requestId) return;
      const next = (data ?? []).map((r) => r.role as AppRole).sort();
      setRoles((prev) => {
        if (prev.length === next.length && prev.every((v, i) => v === next[i])) {
          return prev;
        }
        return next;
      });
    } catch (err) {
      console.warn("[auth] loadRoles failed:", err);
    }
  }, []);

  useEffect(() => {
    // 1) Listener síncrono — apenas atualiza session/roles. NUNCA bloqueia o gate
    //    com setLoading(true), senão eventos repetidos (TOKEN_REFRESHED, etc.)
    //    deixam o app preso em "Restaurando sua sessão...".
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, s) => {
      setSession((prev) => {
        if (prev?.access_token === s?.access_token && prev?.user?.id === s?.user?.id) {
          return prev;
        }
        return s;
      });
      if (s?.user) {
        // dispara em background — não gateia render
        setTimeout(() => { void loadRoles(s.user.id); }, 0);
      } else {
        setRoles([]);
        rolesRequestRef.current++; // invalida loads pendentes
      }
    });

    // 2) Boot inicial — resolve session uma vez e libera o gate, mesmo se
    //    loadRoles falhar/pendurar (roles é UI secundária).
    supabase.auth.getSession()
      .then(({ data }) => {
        setSession(data.session);
        if (data.session?.user) {
          void loadRoles(data.session.user.id);
        }
      })
      .catch((err) => console.warn("[auth] getSession failed:", err))
      .finally(() => setLoading(false));

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
