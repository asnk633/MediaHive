"use client";

import { createContext, useContext, useEffect, useState } from "react";
import { supabase } from "@/lib/supabaseClient";
import { getDriveImageUrl } from "@/lib/driveUtils";

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
        console.log("[Auth] checkSession: Fetching profile from database...");

        // Fetch profile
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

        if (mounted) {
          const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "";
          const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User";

          if (profile) {
            console.log("[Auth] checkSession: Setting user from profile:", profile.email, "Role:", profile.role);
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
          } else {
            console.log("[Auth] checkSession: No profile found. Setting fallback user using session details.");
            setUser({
              uid: session.user.id,
              id: session.user.id,
              email: session.user.email || "",
              name: googleName,
              role: "member",
              avatar_url: googleAvatar
            });
          }
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

          if (mounted) {
            const googleAvatar = session.user.user_metadata?.avatar_url || session.user.user_metadata?.picture || "";
            const googleName = session.user.user_metadata?.full_name || session.user.user_metadata?.name || "User";

            if (profile) {
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
            } else {
              setUser({
                uid: session.user.id,
                id: session.user.id,
                email: session.user.email || "",
                name: googleName,
                role: "member",
                avatar_url: googleAvatar
              });
            }
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
    const { error } = await supabase.auth.signInWithOAuth({
      provider: "google",
      options: {
        redirectTo: typeof window !== "undefined" ? window.location.origin : undefined,
        queryParams: {
          prompt: "select_account"
        }
      }
    });
    if (error) {
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
