import type { SupabaseClient } from "@supabase/supabase-js";

export type CourseTravelAccess = { arrived: boolean; href: string; countryName: string };
export class ArrivalRequired extends Error {
  constructor(public href: string) { super("Complete your country arrival before opening lessons."); }
}
/** Read-only presentation check. Migration 007 independently enforces RPC access. */
export async function loadCourseTravelAccess(db: SupabaseClient, userId: string, languageId: string, languageCode: string, unitIds: string[]): Promise<CourseTravelAccess> {
  const associations = await db.from("travel_country_languages").select("country_id").eq("language_id", languageId);
  if (associations.error) throw new Error("Travel access could not be verified. Please retry.");
  const countryIds = associations.data.map(row => row.country_id as string);
  if (!countryIds.length) return { arrived: false, href: `/world/${encodeURIComponent(languageCode)}`, countryName: "your destination" };
  const [countries, visits, links] = await Promise.all([
    db.from("travel_countries").select("id,name").in("id", countryIds).order("code"),
    db.from("travel_visits").select("country_id,introduction_completed_at").eq("user_id", userId).in("country_id", countryIds),
    unitIds.length ? db.from("travel_country_units").select("country_id,unit_id").in("unit_id", unitIds) : Promise.resolve({ data: [], error: null }),
  ]);
  for (const result of [countries, visits, links]) if (result.error) throw new Error("Travel access could not be verified. Please retry.");
  const linked = new Set((links.data ?? []).map(row => row.country_id));
  const eligible = (countries.data ?? []).filter(country => !linked.size || linked.has(country.id));
  return { arrived: eligible.some(country => visits.data?.some(visit => visit.country_id === country.id && visit.introduction_completed_at)), href: `/world/${encodeURIComponent(languageCode)}`, countryName: eligible[0]?.name ?? "your destination" };
}
