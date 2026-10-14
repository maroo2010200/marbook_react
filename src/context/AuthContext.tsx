import { createContext, useContext, useEffect, useState, type ReactNode } from "react";
import type { User } from "../api/auth";
import api from "../api/api";

// Define the shape of our context data (matches the UserResponseDto on the backend)
export interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
  verify: (token: string) => Promise<void>;
  resendVerificationEmail: (email: string) => Promise<string>;
}

interface RegisterData {
  email: string;
  name: string;
  username: string | null; // optional, and position doesn't matter now
  password: string;
  birthdate: string;
}

const AuthContext = createContext<AuthContextValue | undefined>(undefined);

export function AuthProvider({ children }: { children: ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [token, setToken] = useState<string | null>(
    localStorage.getItem("token"),
  );

  useEffect(() => {
    if (!token) return;

    const fetchUser = async () => {
      try {
        const me = await api.get("/users/me");
        setUser(me.data);
      } catch {
        setToken(null);
        localStorage.removeItem("token");
      }
    };

    fetchUser();
  }, [token]);

  const login = async (email: string, password: string) => {
    try {
      const response = await api.post("/auth/login", { email, password });
      const { token: newToken, user: apiUser } = response.data;

      setToken(newToken);
      localStorage.setItem("token", newToken);
      setUser(apiUser);
    } catch (error) {
      // 401 = either wrong credentials or unverified email.
      // Let the caller show a domain-specific message.
      const axiosError = error as { response?: { status?: number; data?: unknown } };
      if (axiosError.response?.status === 401) {
        const data = axiosError.response.data;
        const message =
          typeof data === "string" ? data : "Please verify your email.";
        throw new Error(message);
      }
      throw error;
    }
  };

  const register = async (data: RegisterData) => {
    const response = await api.post("/auth/register", data);
    const { token: newToken, user: apiUser } = response.data;
    setToken(newToken);
    localStorage.setItem("token", newToken);
    setUser(apiUser ?? null);
  };

  const logout = () => {
    setUser(null);
    setToken(null);
    localStorage.removeItem("token");
  };

  const verify = async (token: string) => {
    const response = await api.post("/auth/verify", {}, { params: { token } });
    const { token: newToken, user: apiUser } = response.data;

    setToken(newToken);
    localStorage.setItem("token", newToken);
    setUser(apiUser);
  };

  const resendVerificationEmail = async (email: string) => {
    const response = await api.post(
      "/auth/resend-verification",
      {},
      { params: { email } },
    );
    return response.data.message ?? "Verification email resent.";
  };

  const isAuthenticated = token !== null;

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
    verify,
    resendVerificationEmail,
  };

  return <AuthContext.Provider value={value}>{children}</AuthContext.Provider>;
}

export function useAuth() {
  const context = useContext(AuthContext);

  if (context == undefined) {
    throw new Error("useAuth must be used inside an AuthProvider");
  }

  return context;
}
