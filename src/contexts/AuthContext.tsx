import React, { createContext, useContext, useState, useEffect, useCallback } from "react";
import { supabase } from "@/integrations/supabase/client";

interface User {
  id: string;
  username: string;
}

interface AuthContextType {
  user: User | null;
  isLoading: boolean;
  login: (username: string, password: string) => Promise<{ error?: string }>;
  register: (username: string, password: string) => Promise<{ error?: string }>;
  logout: () => void;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check for stored user on mount
    const storedUser = localStorage.getItem("balloon-user");
    if (storedUser) {
      try {
        setUser(JSON.parse(storedUser));
      } catch {
        localStorage.removeItem("balloon-user");
      }
    }
    setIsLoading(false);
  }, []);

  const hashPassword = async (password: string): Promise<string> => {
    const encoder = new TextEncoder();
    const data = encoder.encode(password);
    const hashBuffer = await crypto.subtle.digest('SHA-256', data);
    const hashArray = Array.from(new Uint8Array(hashBuffer));
    return hashArray.map(b => b.toString(16).padStart(2, '0')).join('');
  };

  const login = useCallback(async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const passwordHash = await hashPassword(password);
      
      const { data, error } = await supabase
        .from("users")
        .select("id, username, password_hash")
        .eq("username", username.toLowerCase().trim())
        .single();

      if (error || !data) {
        return { error: "Invalid username or password" };
      }

      if (data.password_hash !== passwordHash) {
        return { error: "Invalid username or password" };
      }

      const userData = { id: data.id, username: data.username };
      setUser(userData);
      localStorage.setItem("balloon-user", JSON.stringify(userData));
      return {};
    } catch (err) {
      return { error: "Login failed. Please try again." };
    }
  }, []);

  const register = useCallback(async (username: string, password: string): Promise<{ error?: string }> => {
    try {
      const trimmedUsername = username.toLowerCase().trim();
      
      if (trimmedUsername.length < 3) {
        return { error: "Username must be at least 3 characters" };
      }
      if (password.length < 6) {
        return { error: "Password must be at least 6 characters" };
      }
      if (!/^[a-z0-9_]+$/.test(trimmedUsername)) {
        return { error: "Username can only contain letters, numbers, and underscores" };
      }

      const passwordHash = await hashPassword(password);

      const { data, error } = await supabase
        .from("users")
        .insert({ username: trimmedUsername, password_hash: passwordHash })
        .select("id, username")
        .single();

      if (error) {
        if (error.code === "23505") {
          return { error: "Username already taken" };
        }
        return { error: "Registration failed. Please try again." };
      }

      const userData = { id: data.id, username: data.username };
      setUser(userData);
      localStorage.setItem("balloon-user", JSON.stringify(userData));
      return {};
    } catch (err) {
      return { error: "Registration failed. Please try again." };
    }
  }, []);

  const logout = useCallback(() => {
    setUser(null);
    localStorage.removeItem("balloon-user");
  }, []);

  return (
    <AuthContext.Provider value={{ user, isLoading, login, register, logout }}>
      {children}
    </AuthContext.Provider>
  );
}

export function useAuth() {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
}
