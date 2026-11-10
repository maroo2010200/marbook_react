/**
 * Centralized environment configuration for Marbook Frontend.
 * Defaults to local development backend if VITE_API_URL is not set.
 */
export const BACKEND_BASE = (
  import.meta.env.VITE_API_URL || "http://localhost:5244"
).replace(/\/+$/, "");

export const API_BASE_URL = `${BACKEND_BASE}/api`;

