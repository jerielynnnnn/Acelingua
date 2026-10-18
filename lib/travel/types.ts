export type TravelCountry = { id: string; code: string; name: string; flag_emoji: string; welcome_message: string };
export type TravelPassport = { id: string; passport_number: string; issued_at: string };
export type BoardingTicket = { id: string; country_id: string; passenger_name: string; ticket_number: string; flight_code: string; departure_label: string; destination_label: string; seat_label: string; status: "issued" | "boarded" | "arrived" | "cancelled"; created_at: string };
export type TravelStamp = { id: string; country_id: string; name: string; description: string; requirement_type: string };
export type EarnedStamp = { stamp_id: string; earned_at: string };
export type TravelResult<T> = { data: T; error: null } | { data: null; error: string };
export function travelValue<T>(result: TravelResult<T>): T {
  if (result.error !== null) throw new Error(result.error);
  return result.data;
}
