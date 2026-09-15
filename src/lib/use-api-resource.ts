"use client";
import { useEffect, useState } from "react";

export function useApiResource<T>(url: string, interval = 10000) {
  const [result, setResult] = useState<{
    url: string;
    data?: T;
    error?: string;
  }>({ url });
  const [revision, setRevision] = useState(0);
  useEffect(() => {
    let disposed = false;
    let timer: ReturnType<typeof setTimeout>;
    const controller = new AbortController();
    async function load() {
      try {
        const response = await fetch(url, {
          cache: "no-store",
          signal: controller.signal,
        });
        const data = await response.json();
        if (!response.ok)
          throw new Error(data.error ?? "Não foi possível carregar os dados.");
        if (!disposed) setResult({ url, data });
      } catch (error) {
        if (!disposed)
          setResult({
            url,
            error: error instanceof Error ? error.message : "Falha de conexão.",
          });
      } finally {
        if (!disposed) timer = setTimeout(load, interval);
      }
    }
    void load();
    return () => {
      disposed = true;
      controller.abort();
      clearTimeout(timer);
    };
  }, [url, interval, revision]);
  return {
    data: result.url === url ? result.data : undefined,
    error: result.url === url ? result.error : undefined,
    refresh: () => setRevision((v) => v + 1),
  };
}
