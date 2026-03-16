const API_BASE = import.meta.env.VITE_API_BASE || "http://localhost:3000";
export const getToken = () => localStorage.getItem("cl_token") || "";
export const setToken = (token) => localStorage.setItem("cl_token", token);
export const clearToken = () => localStorage.removeItem("cl_token");

async function request(path, options = {}) {
  const headers = { "Content-Type": "application/json", ...(options.headers || {}) };
  const token = getToken();
  if (token) headers.Authorization = `Bearer ${token}`;
  const response = await fetch(`${API_BASE}${path}`, { ...options, headers });
  const data = await response.json().catch(() => null);
  if (!response.ok) throw new Error(data?.error || "Erro na API");
  return data;
}
export const login = (email, password) => request("/api/auth/login", { method: "POST", body: JSON.stringify({ email, password }) });
export const getClients = () => request("/api/clients");
export const getQuotes = () => request("/api/quotes");
export const createQuote = (payload) => request("/api/quotes", { method: "POST", body: JSON.stringify(payload) });
export const getPlans = () => request("/api/billing/plans");
