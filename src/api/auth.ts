import api from "./api";

export interface User {
  id: number;
  name: string;
  username: string | null;
  email: string;
  bio?: string | null;
  isEmailVerified: boolean;
  birthdate: string;
  createdAt: string;
  updatedAt: string;
}

export interface RegisterData {
  email: string;
  name: string;
  username: string | null;
  password: string;
  birthdate: string;
}

export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface VerifyResponse {
  token: string;
  expiresAt: string;
  user: User;
}

export interface ResendResponse {
  message: string;
}

/** The backend returns plain text on a 401 (e.g. "Please verify your email."). */
export interface PlainTextError {
  message: string;
}

/**
 * Authenticate a user with email + password.
 * Throws on 401 so the caller can show a domain-specific message.
 */
export const login = async (
  email: string,
  password: string,
): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", {
    email,
    password,
  });
  return response.data;
};

export const verify = async (token: string): Promise<VerifyResponse> => {
  const response = await api.post<VerifyResponse>(
    "/auth/verify",
    {},
    { params: { token } },
  );
  return response.data;
};

export const resendVerificationEmail = async (
  email: string,
): Promise<ResendResponse> => {
  const response = await api.post<ResendResponse>(
    "/auth/resend-verification",
    {},
    { params: { email } },
  );
  return response.data;
};
