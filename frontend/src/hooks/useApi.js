import { useCallback, useEffect, useState } from "react";
import api, { errorMessage } from "../lib/api.js";

// GET `path` when it changes: const { data, loading, error, status, reload, setData } = useApi("/cafes?sort=popular")
// Pass null to skip fetching. Old data stays on screen while a reload is in flight.
// `setData` lets a page update what's shown after a mutation without refetching.
export function useApi(path) {
  const [version, setVersion] = useState(0);
  //each request is identified by path + version; `loading` is simply "the latest request hasn't finished"
  const key = path ? `${path}#${version}` : null;
  const [result, setResult] = useState({ key: null, data: null, error: null, status: null });

  useEffect(() => {
    if (!key) return;
    let cancelled = false;

    api
      .get(path)
      .then((res) => !cancelled && setResult({ key, data: res.data, error: null, status: res.status }))
      .catch(
        (err) =>
          !cancelled &&
          setResult({ key, data: null, error: errorMessage(err), status: err.response?.status ?? null }),
      );

    //a newer request (or unmount) wins; ignore the stale response
    return () => {
      cancelled = true;
    };
  }, [key, path]);

  const loading = key !== null && result.key !== key;
  const reload = useCallback(() => setVersion((v) => v + 1), []);
  const setData = useCallback(
    (update) => setResult((r) => ({ ...r, data: typeof update === "function" ? update(r.data) : update })),
    [],
  );

  return {
    data: result.data,
    loading,
    error: loading ? null : result.error,
    status: loading ? null : result.status,
    reload,
    setData,
  };
}
