import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
import type { SafeUser, UserRoleType } from "@/shared/schema";
import { useToast } from "@/hooks/use-toast";
import apiClient from "@/configs/axios.ts";

interface AuthContextType {
  user: SafeUser | null;
  isLoading: boolean;
  sendPasswordResetEmail: (email: string) => Promise<void>;
  login: (username: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  refreshUser: () => Promise<void>;
  hasRole: (allowedRoles: UserRoleType[]) => boolean;
  canEdit: boolean;
  canManage: boolean;
  isAdmin: boolean;
}

const AuthContext = createContext<AuthContextType | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<SafeUser | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  const { toast } = useToast();

  const refreshUser = async () => {
    try {
      const response = await fetch("/api/auth/me", {
        credentials: "include",
      });
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
      } else {
        setUser(null);
      }
    } catch {
      setUser(null);
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    refreshUser();
  }, []);

  const login = async (username: string, password: string): Promise<boolean> => {
    try {
      const response = await fetch("localhost:5000/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        credentials: "include",
        body: JSON.stringify({ username, password }),
      });
      
      if (response.ok) {
        const data = await response.json();
        setUser(data.user);
        toast({
          title: "Welcome back!",
          description: `Logged in as ${data.user.username}`,
        });
        return true;
      } else {
        const error = await response.json();
        toast({
          title: "Login failed",
          description: error.message || "Invalid credentials",
          variant: "destructive",
        });
        return false;
      }
    } catch {
      toast({
        title: "Login failed",
        description: "Network error. Please try again.",
        variant: "destructive",
      });
      return false;
    }
  };

  const logout = async () => {
    try {
      await fetch("/api/auth/logout", {
        method: "POST",
        credentials: "include",
      });
      setUser(null);
      toast({
        title: "Logged out",
        description: "You have been successfully logged out.",
      });
    } catch {
      toast({
        title: "Logout failed",
        description: "Please try again.",
        variant: "destructive",
      });
    }
  };

  const sendPasswordResetEmail = async (email: string) => {
    if (!email) throw new Error("Email is required");

    const response = await apiClient.post(`auth/reset-password`, {
      email
    });

    const data = await response.data();

    toast({
      title: "Reset Password",
      description: data?.message,
    });

    if (response.status !== 200) {
      toast({
        title: "Reset Password",
        description: data?.message || "Failed to send reset email",
        variant: "destructive",
      });
      throw new Error(data?.message || "Failed to send reset email");
    }
  };

  const hasRole = (allowedRoles: UserRoleType[]): boolean => {
    if (!user) return false;
    return allowedRoles.includes(user.role as UserRoleType);
  };

  const canEdit = hasRole(["editor", "supervisor", "admin"]);
  const canManage = hasRole(["supervisor", "admin"]);
  const isAdmin = hasRole(["admin"]);

  return (
    <AuthContext.Provider
      value={{
        user,
        isLoading,
        sendPasswordResetEmail,
        login,
        logout,
        refreshUser,
        hasRole,
        canEdit,
        canManage,
        isAdmin,
      }}
    >
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
