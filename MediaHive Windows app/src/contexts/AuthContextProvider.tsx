"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getDriveImageUrl } from "@/lib/driveUtils";
import { logDiagnostic } from "@/lib/diagnostic";

export interface AuthUser {
  uid: string;
  id: string;
  email: string;
  name: string;
  role: 'admin' | 'manager' | 'team' | 'member';
  institution_id?: string;
  tenant_id?: string;
  department_id?: string;
  avatar_url?: string;
}

type AuthContextType = {
  user: AuthUser | null;
  loading: boolean;
  login: (email: string, password: string) => Promise<void>;
  loginWithGoogle: () => Promise<void>;
  logout: () => Promise<void>;
};

const AuthContext = createContext<AuthContextType | null>(null);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<AuthUser | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    let mounted = true;
    let initialized = false;

    console.log("[Auth] AuthProvider mounted. Starting session check...");

    // Safety timeout to prevent infinite loading screen if query/network hangs
    const timeoutId = setTimeout(() => {
      if (mounted && !initialized) {
        console.warn("[Auth] Auth initialization timed out after 10s. Forcing loading to false.");
        setLoading(false);
      }
    }, 10000);

    const checkSession = async () => {
      console.log("[Auth] checkSession: Invoking supabase.auth.getSession()...");
      try {
        const { data: { session }, error: sessionError } = await supabase.auth.getSession();
        if (sessionError) {
          console.error("[Auth] checkSession: getSession error:", sessionError);
          throw sessionError;
        }
        
        console.log("[Auth] checkSession: getSession resolved. Session:", session ? "Active" : "None");
        
        if (!session?.user) {
          console.log("[Auth] checkSession: No session user found.");
          if (mounted) {
            setUser(null);
            initialized = true;
            clearTimeout(timeoutId);
            setLoading(false);
          }
          return;
        }

        console.log("[Auth] checkSession: User ID:", session.user.id, "Email:", session.user.email);
        
        // Immediately set a fallback user to avoid safety timeouts and prevent premature redirects
        const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "";
        const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User";
        
        if (mounted) {
          console.log("[Auth] checkSession: Setting immediate fallback user from session metadata.");
          setUser({
            uid: session.user.id,
            id: session.user.id,
            email: session.user.email || "",
            name: googleName,
            role: "member",
            avatar_url: googleAvatar
          });
        }

        console.log("[Auth] checkSession: Fetching profile from database...");

        // Fetch profile asynchronously
        const { data: profile, error: profileError } = await supabase
          .from("profiles")
          .select("*")
          .eq("id", session.user.id)
          .maybeSingle();

        if (profileError) {
          console.warn("[Auth] checkSession: Failed to fetch profile:", profileError);
        } else {
          console.log("[Auth] checkSession: Profile query completed. Found profile:", profile ? "Yes" : "No");
        }

        if (mounted && profile) {
          console.log("[Auth] checkSession: Updating user from profile:", profile.email, "Role:", profile.role);
          setUser({
            uid: session.user.id,
            id: session.user.id,
            email: profile.email || session.user.email || "",
            name: profile.name || profile.full_name || googleName,
            role: (profile.role || "member").toLowerCase() as any,
            institution_id: profile.institution_id,
            tenant_id: profile.tenant_id,
            department_id: profile.department_id,
            avatar_url: getDriveImageUrl(profile.avatar_url, profile.avatar_drive_id, true) || googleAvatar
          });
        }
      } catch (err) {
        console.error("[Auth] checkSession: Auth init failed with exception:", err);
      } finally {
        if (mounted) {
          console.log("[Auth] checkSession: Finished. Setting loading to false.");
          initialized = true;
          clearTimeout(timeoutId);
          setLoading(false);
        }
      }
    };

    checkSession();

    console.log("[Auth] Subscribing to auth state changes...");
    const { data: listener } = supabase.auth.onAuthStateChange(
      async (event: any, session: any) => {
        console.log("[Auth] onAuthStateChange event fired:", event, "Session user ID:", session?.user?.id);
        
        if (!session?.user) {
          console.log("[Auth] onAuthStateChange: No user session. Clearing user state.");
          if (mounted) {
            setUser(null);
            initialized = true;
            clearTimeout(timeoutId);
            setLoading(false);
          }
          return;
        }

        // Set fallback user immediately to keep UI responsive
        const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "";
        const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User";

        if (mounted) {
          setUser({
            uid: session.user.id,
            id: session.user.id,
            email: session.user.email || "",
            name: googleName,
            role: "member",
            avatar_url: googleAvatar
          });
        }

        try {
          console.log("[Auth] onAuthStateChange: Fetching profile...");
          const { data: profile, error: profileError } = await supabase
            .from("profiles")
            .select("*")
            .eq("id", session.user.id)
            .maybeSingle();

          if (profileError) {
            console.warn("[Auth] onAuthStateChange: Failed to fetch profile:", profileError);
          } else {
            console.log("[Auth] onAuthStateChange: Profile fetched successfully:", profile ? "Yes" : "No");
          }

          if (mounted && profile) {
            setUser({
              uid: session.user.id,
              id: session.user.id,
              email: profile.email || session.user.email || "",
              name: profile.name || profile.full_name || googleName,
              role: (profile.role || "member").toLowerCase() as any,
              institution_id: profile.institution_id,
              tenant_id: profile.tenant_id,
              department_id: profile.department_id,
              avatar_url: getDriveImageUrl(profile.avatar_url, profile.avatar_drive_id, true) || googleAvatar
            });
          }
        } catch (err) {
          console.error("[Auth] onAuthStateChange: Error processing auth change:", err);
        } finally {
          if (mounted) {
            console.log("[Auth] onAuthStateChange: Setting loading to false.");
            initialized = true;
            clearTimeout(timeoutId);
            setLoading(false);
          }
        }
      }
    );

    return () => {
      mounted = false;
      clearTimeout(timeoutId);
      listener.subscription.unsubscribe();
      console.log("[Auth] AuthProvider unmounted.");
    };
  }, []);

  const login = async (email: string, password: string) => {
    setLoading(true);
    const { error } = await supabase.auth.signInWithPassword({
      email,
      password
    });
    if (error) {
      setLoading(false);
      throw error;
    }
  };

  const loginWithGoogle = async () => {
    setLoading(true);
    const isTauriApp = typeof window !== 'undefined' && (!!(window as any).isTauri || !!(window as any).__TAURI_INTERNALS__);
    
    if (isTauriApp) {
      logDiagnostic("Tauri app: Clicked 'Login with Google'. Launching system browser...", "tauri");
      try {
        const { openUrl } = await import("@tauri-apps/plugin-opener");
        const targetUrl = "https://thaiba-garden-media-manager.vercel.app/login?source=tauri&trigger=google";
        logDiagnostic(`Tauri app: Opening target URL: ${targetUrl}`, "tauri");
        await openUrl(targetUrl);
        logDiagnostic("Tauri app: Browser launch command executed successfully.", "tauri");
      } catch (err: any) {
        logDiagnostic(`Tauri app: Failed to open browser: ${err.message || err}`, "tauri");
        console.error("Failed to open browser:", err);
      } finally {
        setLoading(false);
      }
      return;
    }

    // Inside the browser:
    logDiagnostic("Browser: Initiating Google Login flow.", "browser");
    let redirectTo = typeof window !== "undefined" ? window.location.origin : undefined;
    if (typeof window !== "undefined") {
      const params = new URLSearchParams(window.location.search);
      logDiagnostic(`Browser: Current search params are: ${params.toString()}`, "browser");
      if (params.get("source") === "tauri") {
        redirectTo = `${window.location.origin}/auth/callback?source=tauri`;
      }
    }

    logDiagnostic(`Browser: Supabase OAuth redirectTo set to: ${redirectTo}`, "browser");
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo,
        queryParams: {
          prompt: "select_account"
        }
      }
    });
    if (error) {
      logDiagnostic(`Browser: Supabase OAuth signInWithOAuth error: ${error.message}`, "browser");
      setLoading(false);
      throw error;
    }
  };

  const logout = async () => {
    setLoading(true);
    try {
      await supabase.auth.signOut();
    } catch (err) {
      console.error("[Auth] signOut failed, clearing local session:", err);
      // Fallback: clear local session even if network is offline
      await supabase.auth.signOut({ scope: 'local' });
    } finally {
      setUser(null);
      setLoading(false);
    }
  };

  return (
    <AuthContext.Provider value={{ user, loading, login, loginWithGoogle, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) throw new Error("useAuth must be used within AuthProvider");
  return context;
}
