"use server";

import { createClient } from "@/lib/supabase/server";
import { travelDestinations } from "./countries";
import type { BoardingTicket, TravelPassport, TravelResult } from "./types";

async function travelClient() {
  const client = await createClient();
  const { data: { user }, error } = await client.auth.getUser();
  if (error || !user) throw new Error("Please sign in again to continue your journey.");
  return client;
}
function rpcError(error: { code?: string; message: string }) {
  return error.code === "PGRST202" || error.code === "42883"
    ? "Travel setup is pending. Apply migration 202610180006_travel_arrival.sql in Supabase, then retry."
    : error.message;
}
async function callTravel<T>(name: string, args?: Record<string, string>): Promise<TravelResult<T>> {
  try {
    const client = await travelClient();
    const { data, error } = await client.rpc(name, args);
    if (error) return { data: null, error: rpcError(error) };
    if (!data) return { data: null, error: "Travel data is unavailable. Please retry." };
    return { data: data as T, error: null };
  } catch {
    return { data: null, error: "Please sign in again or retry your connection to continue your journey." };
  }
}
export async function ensureTravelPassport(): Promise<TravelResult<TravelPassport>> {
  return callTravel<TravelPassport>("acelingua_ensure_travel_passport");
}
export async function ensureBoardingPass(languageCode: string): Promise<TravelResult<BoardingTicket>> {
  const destination = travelDestinations[languageCode];
  if (!destination) return { data: null, error: "Travel passes are not yet available for this destination." };
  return callTravel<BoardingTicket>("acelingua_ensure_boarding_pass", { p_country_code: destination.countryCode, p_language_code: languageCode });
}
export async function boardTravelFlight(ticketId: string): Promise<TravelResult<BoardingTicket>> {
  return callTravel<BoardingTicket>("acelingua_board_travel_flight", { p_ticket_id: ticketId });
}
export async function finishTravelArrival(ticketId: string): Promise<TravelResult<BoardingTicket>> {
  return callTravel<BoardingTicket>("acelingua_finish_travel_arrival", { p_ticket_id: ticketId });
}
/** Reconcile historical completions without accepting learner completion flags. */
export async function refreshPassportStamps(): Promise<{ pending: boolean }> {
  try {
    const client = await travelClient();
    const { data: { user } } = await client.auth.getUser();
    if (!user) return { pending: true };
    const enrollment = await client.from("user_courses").select("course_id").eq("user_id", user.id).eq("status", "active");
    if (enrollment.error) return { pending: true };
    let pending = false;
    for (const course of enrollment.data ?? []) {
      const result = await client.rpc("acelingua_refresh_country_stamps", { p_course_id: course.course_id });
      // Courses with no arrival cannot earn stamps yet; that is normal.
      if (result.error && !result.error.message.includes("Arrive and enroll")) pending = true;
    }
    return { pending };
  } catch { return { pending: true }; }
}
