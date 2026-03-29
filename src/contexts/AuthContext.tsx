import React, { createContext, useContext, useState, ReactNode, useCallback } from "react";

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
  login: (provider: "google" | "apple" | "guest") => void;
  logout: () => void;
  updateUser: (data: Partial<User>) => void;
}

const AuthContext = createContext<AuthContextType | null>(null);

export const AuthProvider = ({ children }: { children: ReactNode }) => {
  const [user, setUser] = useState<User | null>(() => {
    const saved = localStorage.getItem("tn-bus-user");
    return saved ? JSON.parse(saved) : null;
  });

  const login = useCallback((provider: "google" | "apple" | "guest") => {
    // Mock login — replace with real auth later
    const mockUser: User = {
      id: crypto.randomUUID(),
      name: provider === "guest" ? "Guest User" : "Tamil Nadu User",
      email: provider === "guest" ? "guest@example.com" : "user@example.com",
      avatar: undefined,
      provider,
    };
    setUser(mockUser);
    localStorage.setItem("tn-bus-user", JSON.stringify(mockUser));
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("tn-bus-user");
  }, []);

  const updateUser = useCallback((data: Partial<User>) => {
    setUser((prev) => {
      if (!prev) return prev;
      const updated = { ...prev, ...data };
      localStorage.setItem("tn-bus-user", JSON.stringify(updated));
      return updated;
    });
  }, []);

  return (
    <AuthContext.Provider value={{ user, isAuthenticated: !!user, login, logout, updateUser }}>
      {children}
    </AuthContext.Provider>
  );
};

export const useAuth = () => {
  const ctx = useContext(AuthContext);
  if (!ctx) throw new Error("useAuth must be used within AuthProvider");
  return ctx;
};
