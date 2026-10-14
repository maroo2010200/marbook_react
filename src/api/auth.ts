import api from "./api";

export interface User {
  id: number;
  name: string;
  username: string | null;
  email: string;
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

/** Login / Verify success response (backend returns these shapes). */
export interface AuthResponse {
  token: string;
  expiresAt: string;
  user: User;
}

/** /verify?token= success response. */
export interface VerifyResponse {
  token: string;
  expiresAt: string;
  user: User;
}

/** /resend-verification success response. */
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
export const login = async (email: string, password: string): Promise<AuthResponse> => {
  const response = await api.post<AuthResponse>("/auth/login", { email, password });
  return response.data;
};

/**
 * Verify an email verification token from a link click (/verify?token=...).
 * Sets the returned JWT + user in local storage so the session becomes active.
 */
export const verify = async (token: string): Promise<VerifyResponse> => {
  const response = await api.post<VerifyResponse>("/auth/verify", {}, { params: { token } });
  return response.data;
};

/**
 * Resend the verification email for an unverified account.
 */
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
