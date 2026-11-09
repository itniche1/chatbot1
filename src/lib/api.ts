import axios, { AxiosError, type InternalAxiosRequestConfig } from "axios";

/**
 * API client — mirrors the previous build exactly:
 *  - base URL: `${VITE_BACKEND_URL}/api` (empty = same origin)
 *  - bearer token in localStorage `chatbase_access_token`
 *  - on 401 (non-auth routes) refresh once via POST /auth/refresh with `chatbase_refresh_token`
 * The storage keys are kept so existing sessions survive the redesign.
 */
export const API_BASE = `${(import.meta.env.VITE_BACKEND_URL as string | undefined) || ""}/api`;

const ACCESS_KEY = "chatbase_access_token";
const REFRESH_KEY = "chatbase_refresh_token";

export function getAccessToken(): string | null {
  try { return localStorage.getItem(ACCESS_KEY); } catch { return null; }
}
export function getRefreshToken(): string | null {
  try { return localStorage.getItem(REFRESH_KEY); } catch { return null; }
}
export function setTokens(access?: string | null, refresh?: string | null) {
  try {
    if (access) localStorage.setItem(ACCESS_KEY, access);
    if (refresh) localStorage.setItem(REFRESH_KEY, refresh);
  } catch { /* storage unavailable */ }
}
export function clearTokens() {
  try { localStorage.removeItem(ACCESS_KEY); localStorage.removeItem(REFRESH_KEY); } catch { /* ignore */ }
}

export const api = axios.create({ baseURL: API_BASE, withCredentials: false });

api.interceptors.request.use((config) => {
  const token = getAccessToken();
  if (token && !config.headers.Authorization) config.headers.Authorization = `Bearer ${token}`;
  return config;
});

let refreshing: Promise<unknown> | null = null;

api.interceptors.response.use(
  (r) => r,
  async (error: AxiosError) => {
    const original = error.config as (InternalAxiosRequestConfig & { _retry?: boolean }) | undefined;
    if (error.response?.status === 401 && original && !original._retry && !(original.url || "").includes("/auth/")) {
      original._retry = true;
      try {
        if (!refreshing) {
          const refreshToken = getRefreshToken();
          if (!refreshToken) throw new Error("no_refresh");
          refreshing = axios
            .post(`${API_BASE}/auth/refresh`, { refresh_token: refreshToken })
            .then((res) => {
              const { access_token, refresh_token } = (res.data || {}) as { access_token?: string; refresh_token?: string };
              if (access_token) setTokens(access_token, refresh_token || refreshToken);
              return res;
            })
            .finally(() => { refreshing = null; });
        }
        await refreshing;
        const token = getAccessToken();
        if (token) original.headers.Authorization = `Bearer ${token}`;
        return api(original);
      } catch {
        clearTokens();
      }
    }
    return Promise.reject(error);
  },
);

/** Turns FastAPI-style `detail` payloads (string | {msg}[] | {msg}) into readable text. */
export function errorMessage(err: unknown, fallback = "Something went wrong. Please try again."): string {
  const detail = (err as AxiosError<{ detail?: unknown }>)?.response?.data?.detail;
  if (detail == null) return fallback;
  if (typeof detail === "string") return detail;
  if (Array.isArray(detail)) {
    return detail
      .map((d) => (d && typeof d.msg === "string" ? d.msg : JSON.stringify(d)))
      .filter(Boolean)
      .join(" ");
  }
  if (typeof (detail as { msg?: unknown }).msg === "string") return (detail as { msg: string }).msg;
  return String(detail);
}
