import React, { createContext, useContext, useState, useEffect, ReactNode, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";
import { lovable } from "@/integrations/lovable/index";
import type { User as SupabaseUser, Session } from "@supabase/supabase-js";

export interface User {
  id: string;
  name: string;
  email: string;
  avatar?: string;
  provider: "google" | "apple" | "guest";
}

interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (provider: "google" | "apple" | "guest") => Promise<void>;
  logout: () => Promise<void>;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

const mapSupabaseUser = (su: SupabaseUser): User => ({
  id: su.id,
  name: su.user_metadata?.full_name || su.user_metadata?.name || su.email?.split("@")[0] || "User",
  email: su.email || "",
  avatar: su.user_metadata?.avatar_url,
  provider: (su.app_metadata?.provider as "google" | "apple") || "guest",
});

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen to auth state changes FIRST
    const { data: { subscription } } = supabase.auth.onAuthStateChange((_event, session) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Then check existing session
    supabase.auth.getSession().then(({ data: { session } }) => {
      if (session?.user) {
        setUser(mapSupabaseUser(session.user));
      }
      setIsLoading(false);
    });

    return () => subscription.unsubscribe();
  }, []);

  const login = useCallback(async (provider: "google" | "apple" | "guest") => {
    if (provider === "guest") {
      // Sign in anonymously
      const { error } = await supabase.auth.signInAnonymously();
      if (error) console.error("Guest login error:", error.message);
      return;
    }

    // OAuth via Lovable Cloud managed auth
    const result = await lovable.auth.signInWithOAuth(provider, {
      redirect_uri: window.location.origin,
    });

    if (result.error) {
      console.error("OAuth error:", result.error);
      return;
    }

    if (result.redirected) {
      // Browser will redirect to provider — just return
      return;
    }
    // Session is set automatically by onAuthStateChange
  }, []);

  const logout = useCallback(async () => {
    await supabase.auth.signOut();
    setUser(null);
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => (prev ? { ...prev, ...data } : prev));
    // Also update profile in DB
    if (data.name) {
      supabase.auth.getUser().then(({ data: { user: su } }) => {
        if (su) {
          supabase.from("profiles").update({ name: data.name }).eq("user_id", su.id).then(() => {});
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
