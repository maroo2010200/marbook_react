import axios from "axios";

const api = axios.create({
  baseURL: "http://localhost:5244",
  headers: {
    "Content-Type": "application/json",
  },
});

api.interceptors.request.use((config) => {
  const token = localStorage.getItem("token");

  if (token) {
    config.headers.Authorization = `Bearer ${token}`;
  }

  return config;
});

// API FUNCTION
export const login = async (email: string, password: string) => {
  const response = await api.post("/api/Auth/login", { email, password });
  return response.data;
};

export default api;
