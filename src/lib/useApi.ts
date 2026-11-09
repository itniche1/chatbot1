import { useCallback, useEffect, useRef, useState } from "react";
import { api, errorMessage } from "./api";

/** Minimal GET hook: { data, error, loading, reload, setData }. `null` path skips the request. */
export function useApi<T>(path: string | null, params?: Record<string, unknown>) {
  const [data, setData] = useState<T | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState<boolean>(!!path);
  const key = path ? `${path}?${JSON.stringify(params || {})}` : null;
  const latest = useRef(key);
  latest.current = key;

  const reload = useCallback(async () => {
    if (!path) return;
    setLoading(true);
    const requestKey = key;
    try {
      const res = await api.get(path, { params });
      if (latest.current === requestKey) { setData(res.data); setError(null); }
    } catch (e) {
      if (latest.current === requestKey) setError(errorMessage(e, "Couldn't load this data."));
    } finally {
      if (latest.current === requestKey) setLoading(false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [key]);

  useEffect(() => { reload(); }, [reload]);
  return { data, error, loading, reload, setData };
}
