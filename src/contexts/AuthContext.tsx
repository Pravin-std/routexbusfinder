import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "guest";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: "google" | "guest") => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mapSupabaseUser = (su: SupabaseUser): User => ({
  id: su.id,
  name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split("@")[0] || "User",
  email: su.email || "",
  avatar: su.user_metadata?.avatar_url,
  provider: (su.app_metadata?.provider as "google") || "guest",
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else if (!import.meta.env.DEV) {
        // Only clear user if not in DEV mode
        setUser(null);
      } else {
        const guestUser = localStorage.getItem("guest-user");
        setUser(guestUser ? JSON.parse(guestUser) : null);
      }
      setIsLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else if (import.meta.env.DEV) {
        // LOCAL DEVELOPMENT BYPASS
        setUser({ 
          id: "dev-admin-uuid-1234", 
          name: "Local Admin", 
          email: "admin@localhost.dev", 
          provider: "guest" 
        });
      } else {
        const guestUser = localStorage.getItem("guest-user");
        if (guestUser) {
          setUser(JSON.parse(guestUser));
        }
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  useEffect(() => {
    if (!isLoading) {
      // @ts-ignore
      if (window.removeSplashScreen) {
        // @ts-ignore
        window.removeSplashScreen();
      }
    }
  }, [isLoading]);

  const login = useCallback(async (provider: "google" | "guest") => {
    if (provider === "guest") {
      // Sign in anonymously
      const { error } = await supabase.auth.signInAnonymously();
      if (error) {
        console.error("Guest login error:", error.message);
        // Fallback to local guest user if anonymous auth is disabled
        const fallbackGuest: User = {
          id: "guest-" + Date.now(),
          name: "Guest",
          email: "",
          provider: "guest",
        };
        setUser(fallbackGuest);
        localStorage.setItem("guest-user", JSON.stringify(fallbackGuest));
      }
      return;
    }

    const { data, error } = await supabase.auth.signInWithOAuth({
      provider: provider,
      options: {
        redirectTo: window.location.origin,
        queryParams:
          provider === "google"
            ? { prompt: "select_account" }
            : {},
      },
    });

    if (error) {
      console.error("OAuth error:", error.message);
      return;
    }


    // Session is set automatically by onAuthStateChange
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    localStorage.removeItem("guest-user");
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
    // Also update profile in DB
    if (data.name) {
      supabase.auth.getUser().then(({ data: { user: su } }) => {
        if (su) {
          supabase.from("profiles").update({ name: data.name }).eq("user_id", su.id).then(() => { });
        }
      });
    }
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, isLoading, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
