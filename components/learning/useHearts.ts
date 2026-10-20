"use client";
import { useCallback, useEffect, useState } from "react";
export type HeartsSnapshot = { hearts: number; available: boolean; server_now: string; next_heart_at: string | null };
export function useHearts() {
  const [data, setData] = useState<HeartsSnapshot | null>(null); const [error, setError] = useState("");
  const [received, setReceived] = useState(0); const [elapsed, setElapsed] = useState(0);
  const refresh = useCallback(async () => {
    try {
      const response = await fetch("/api/hearts", { cache: "no-store", signal: AbortSignal.timeout(15000) });
      const value = await response.json(); if (!response.ok) throw new Error(value.error);
      setData(value); setReceived(performance.now()); setElapsed(0); setError("");
    } catch { setError("Hearts could not be refreshed."); }
  }, []);
  useEffect(() => {
    const initial = setTimeout(() => void refresh(), 0);
    const visible = () => { if (document.visibilityState === "visible") void refresh(); };
    const changed = () => void refresh();
    document.addEventListener("visibilitychange", visible); window.addEventListener("acelingua:balance-updated", changed);
    return () => { clearTimeout(initial); document.removeEventListener("visibilitychange", visible); window.removeEventListener("acelingua:balance-updated", changed); };
  }, [refresh]);
  useEffect(() => {
    if (!data?.next_heart_at) return;
    const ticker = setInterval(() => setElapsed(performance.now() - received), 1000);
    const due = Date.parse(data.next_heart_at) - Date.parse(data.server_now);
    const reload = setTimeout(() => void refresh(), Math.max(1000, due + 200));
    return () => { clearInterval(ticker); clearTimeout(reload); };
  }, [data, received, refresh]);
  const remaining = data?.next_heart_at ? Math.max(0, Math.ceil((Date.parse(data.next_heart_at) - Date.parse(data.server_now) - elapsed) / 1000)) : null;
  const countdown = remaining === null ? "" : `${Math.floor(remaining / 60)}:${String(remaining % 60).padStart(2, "0")}`;
  return { data, error, refresh, countdown };
}
