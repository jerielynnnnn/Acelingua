"use client";
import Image from "next/image";
import Link from "next/link";
import { useEffect, useRef, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import coinIcon from "@/public/icons/coins.png";
import gemIcon from "@/public/icons/gems.png";
import gameIcon from "@/public/icons/minigames.png";

const vocabulary = [["Cat", "🐱"], ["Sun", "☀️"], ["Apple", "🍎"], ["Book", "📚"], ["House", "🏠"], ["Tree", "🌳"]];
type Board = { id: string | null; tiles: string[] };
export default function MinigamesPage() {
  const [board, setBoard] = useState<Board | null>(null);
  const [open, setOpen] = useState<number[]>([]);
  const [pairs, setPairs] = useState<number[][]>([]);
  const [busy, setBusy] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const inFlight = useRef(false);
  const completed = pairs.length === 6;
  const matched = new Set(pairs.flat());
  useEffect(() => () => { if (timer.current) clearTimeout(timer.current); }, []);
  function reset(next: Board) {
    if (timer.current) clearTimeout(timer.current);
    setBoard(next); setOpen([]); setPairs([]); setResult(""); setError("");
  }
  async function start() {
    if (inFlight.current) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const response = await createClient().rpc("start_travel_match");
      if (response.error) throw new Error(["PGRST202", "42883"].includes(response.error.code) ? "Daily reward games are not available yet. You can play a practice round below." : response.error.message);
      const next = response.data as Board;
      if (!next || typeof next.id !== "string" || !Array.isArray(next.tiles) || next.tiles.length !== 12 || next.tiles.some(tile => typeof tile !== "string")) throw new Error("The board could not be loaded. Please retry.");
      reset(next);
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Game unavailable. Try practice instead."); }
    finally { setBusy(false); inFlight.current = false; }
  }
  function practice() {
    const tiles = vocabulary.flat();
    for (let i = tiles.length - 1; i > 0; i--) { const j = Math.floor(Math.random() * (i + 1)); [tiles[i], tiles[j]] = [tiles[j], tiles[i]]; }
    reset({ id: null, tiles });
  }
  function flip(index: number) {
    if (!board || busy || completed || open.length === 2 || open.includes(index) || matched.has(index)) return;
    const next = [...open, index]; setOpen(next);
    if (next.length === 2) {
      const [a, b] = next;
      if (vocabulary.some(pair => pair.includes(board.tiles[a]) && pair.includes(board.tiles[b]) && board.tiles[a] !== board.tiles[b])) {
        setPairs(previous => [...previous, next]); setOpen([]);
      } else timer.current = setTimeout(() => setOpen([]), 1000);
    }
  }
  async function claim() {
    if (!board?.id || !completed || inFlight.current || result) return;
    inFlight.current = true; setBusy(true); setError("");
    try {
      const response = await createClient().rpc("finish_travel_match", { p_session_id: board.id, p_pairs: pairs });
      if (response.error) throw new Error(response.error.message);
      const receipt = response.data as { coins: number; gems: number; already_completed: boolean };
      if (!receipt || !Number.isSafeInteger(receipt.coins) || !Number.isSafeInteger(receipt.gems)) throw new Error("Could not confirm your reward. Retry to check this round.");
      setResult(receipt.coins > 0 ? `Daily bonus earned! +${receipt.coins} coins and +${receipt.gems} gems.` : receipt.already_completed ? "This round was already saved. Check your current balance in the header." : "Great matching! Today's bonus has already been collected. Keep practicing, or return tomorrow.");
      window.dispatchEvent(new Event("acelingua:balance-updated"));
    } catch (cause) { setError(cause instanceof Error ? cause.message : "Could not save your game. Retry."); }
    finally { setBusy(false); inFlight.current = false; }
  }
  return <main className="mx-auto max-w-4xl px-5 py-8 text-[#071A4A]">
    <Link href="/world" className="text-sm font-bold text-[#3558AE]">← Back to World</Link>
    <header className="my-6 flex items-center gap-5 rounded-3xl bg-gradient-to-r from-[#071A4A] to-[#3558AE] p-6 text-white"><Image src={gameIcon} alt="" width={75} height={75} /><div><p className="text-xs font-bold uppercase tracking-widest text-[#C7A9D4]">Play Island</p><h1 className="mt-1 text-3xl font-extrabold">Travel Match</h1><p className="mt-2 text-sm text-white/80">Find six pairs: match each English word with its picture.</p></div></header>
    <div className="mb-5 flex flex-wrap items-center gap-3 rounded-2xl border border-[#C7A9D4]/40 bg-white p-4 text-sm"><Image src={coinIcon} alt="" width={24} height={24} /><strong>20 coins</strong><Image src={gemIcon} alt="" width={24} height={24} /><strong>2 gems</strong><span className="text-xs text-[#62759C]">First validated completion each day · Resets at 00:00 UTC</span></div>
    <div className="flex flex-wrap gap-3"><button type="button" disabled={busy} onClick={() => void start()} className="rounded-full bg-[#3558AE] px-5 py-3 text-sm font-bold text-white disabled:opacity-40">{busy ? "Please wait…" : board ? "Start another daily round" : "Start daily challenge"}</button><button type="button" disabled={busy} onClick={practice} className="rounded-full border border-[#C7A9D4] bg-white px-5 py-3 text-sm font-bold disabled:opacity-40">Practice · No rewards</button></div>
    {error && <p role="alert" className="mt-5 rounded-xl bg-[#F9C3D7]/25 p-4 text-sm">{error}</p>}
    {board && <section className="mt-6 rounded-3xl border border-[#C7A9D4]/40 bg-white p-5"><div className="mb-5 flex justify-between text-sm font-bold"><span>{board.id ? "Daily challenge" : "Practice round"}</span><span aria-live="polite">{pairs.length} / 6 pairs</span></div><div className="grid grid-cols-3 gap-3 sm:grid-cols-4">{board.tiles.map((tile, index) => {
      const visible = open.includes(index) || matched.has(index);
      return <button type="button" key={index} disabled={busy || matched.has(index) || completed || (open.length === 2 && !visible)} aria-label={visible ? `Card ${index + 1}: ${tile}${matched.has(index) ? ", matched" : ""}` : `Reveal card ${index + 1}`} aria-pressed={visible} onClick={() => flip(index)} className={`flex min-h-24 items-center justify-center rounded-2xl border-2 p-2 text-2xl font-bold focus-visible:outline-3 focus-visible:outline-[#3558AE] ${matched.has(index) ? "border-[#C7A9D4] bg-[#F5EAF8]" : visible ? "border-[#3558AE] bg-[#EAF5FF]" : "border-[#3558AE]/10 bg-[#3558AE] text-white"}`}>{visible ? tile : "?"}</button>;
    })}</div>{completed && <div className="mt-6 text-center"><p className="font-bold">All pairs found!</p>{board.id && !result ? <button type="button" disabled={busy} onClick={() => void claim()} className="mt-4 rounded-full bg-[#071A4A] px-6 py-3 text-sm font-bold text-white disabled:opacity-40">{busy ? "Checking your game…" : "Save round & check daily bonus"}</button> : !board.id ? <p className="mt-2 text-sm text-[#62759C]">Practice complete. Start the daily challenge to earn a bonus when rewards are available.</p> : null}</div>}</section>}
    {result && <p role="status" className="mt-5 rounded-2xl bg-[#C7A9D4]/25 p-5 font-bold">{result}</p>}
  </main>;
}
