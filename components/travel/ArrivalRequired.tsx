import Link from "next/link";
import type { CourseTravelAccess } from "@/lib/travel/access";

export default function ArrivalRequiredNotice({ access }: { access: CourseTravelAccess }) {
  return <section className="my-6 rounded-3xl border border-[#85D8FA] bg-[#FFFCF7] p-6 text-[#102452]" aria-label="Prepare your journey"><p className="text-xs font-bold uppercase tracking-widest">Your adventure starts with an arrival</p><h2 className="mt-3 text-xl font-bold">Welcome to your {access.countryName} journey</h2><p className="mt-3 text-sm leading-7">Prepare your passport, board your flight, and collect your arrival stamp. Then your lessons will be ready here.</p><Link href={access.href} className="mt-5 inline-flex min-h-11 items-center rounded-xl bg-[#102452] px-5 py-3 text-sm font-bold text-white">Visit Country</Link><Link href="/passport" className="ml-3 inline-flex min-h-11 items-center rounded-xl border border-[#102452]/15 px-5 py-3 text-sm font-bold">Open Passport</Link></section>;
}
