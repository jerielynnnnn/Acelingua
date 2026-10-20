"use client";
import { useRouter } from "next/navigation";
export default function StreakRetry(){const router=useRouter();return <button type="button" onClick={()=>router.refresh()} className="mt-5 rounded-xl bg-[#102452] px-5 py-3 font-bold text-white">Retry</button>;}
