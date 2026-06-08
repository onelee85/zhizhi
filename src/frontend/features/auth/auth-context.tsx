"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";
import { usePathname, useRouter } from "next/navigation";
import type { User } from "@/features/tasks/types";
import { getStoredUser, storeSession, clearSession, login as apiLogin } from "@/features/api/client";

type AuthContextValue = {
  user: User | null;
  loading: boolean;
  login: (username: string, password: string) => Promise<void>;
  logout: () => void;
};

const AuthContext = createContext<AuthContextValue | null>(null);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname() ?? "";

  useEffect(() => {
    setUser(getStoredUser());
    setLoading(false);
  }, []);

  useEffect(() => {
    if (loading || !user) {
      return;
    }

    if (pathname.startsWith("/parent") && user.role !== "parent") {
      router.replace("/child");
    } else if (pathname.startsWith("/child") && user.role !== "child") {
      router.replace("/parent");
    }
  }, [loading, pathname, router, user]);

  const login = useCallback(async (username: string, password: string) => {
    const session = await apiLogin(username, password);
    storeSession(session.token, session.user);
    setUser(session.user);
    router.push(session.user.role === "parent" ? "/parent" : "/child");
  }, [router]);

  const logout = useCallback(() => {
    clearSession();
    setUser(null);
    router.push("/login");
  }, [router]);

  return (
    <AuthContext.Provider value={{ user, loading, login, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
