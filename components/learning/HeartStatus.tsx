"use client";
import Image from "next/image";
import { useHearts } from "./useHearts";
export default function HeartStatus({ initial }: { initial?: number }) {
  const { data, countdown, error, refresh } = useHearts();
  return <span className="inline-flex items-center gap-2 rounded-xl px-2 py-2 text-[#102452]" aria-label="Your hearts">
    <Image src="/icons/heart.png" alt="" width={26} height={26} /><span className="text-sm font-bold">{data?.hearts ?? initial ?? "—"}<small className="ml-1 text-[10px] font-normal text-[#62759C]">/ 5</small></span>
    {data?.next_heart_at && <span className="text-[10px] text-[#62759C]">+1 in {countdown}</span>}
    {error && <button type="button" title={error} onClick={() => void refresh()} className="text-xs underline">Retry</button>}
  </span>;
}
