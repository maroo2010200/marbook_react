import { createContext, useContext, useState, type ReactNode } from "react";
import api from "../api/api";

// Define the shape of our context data
export interface User {
  id: number;
  name: string;
  username?: string;
  email: string;
}

interface AuthContextValue {
  user: User | null;
  token: string | null;
  isAuthenticated: boolean;
  login: (email: string, password: string) => Promise<void>;
  register: (data: RegisterData) => Promise<void>;
  logout: () => void;
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
const login = async (email: string, password: string) => {
  const response = await api.post("/Auth/login", { email, password });
  const newToken = response.data.token;

  setToken(newToken);
  localStorage.setItem("token", newToken);

  setUser(null);

  const me = await api.get("/Users/me");
  setUser(me.data);
};

  const register = async (data: RegisterData) => {
    const response = await api.post("/Auth/register", data);
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

  const isAuthenticated = token !== null;

  const value: AuthContextValue = {
    user,
    token,
    isAuthenticated,
    login,
    register,
    logout,
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
