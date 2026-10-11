export type LanguageLocation = { country: string; latitude: number; longitude: number; markerOffset: [number, number] };
// Representative destinations, not a claim that a language is exclusive to a country.
// Availability comes from Supabase. This file supplies geography only.
export const languageLocations: Record<string, LanguageLocation> = {
  ja: { country: "Japan", latitude: 36, longitude: 138, markerOffset: [18, -8] },
  ko: { country: "South Korea", latitude: 36, longitude: 128, markerOffset: [-16, -34] },
  zh: { country: "China", latitude: 35, longitude: 104, markerOffset: [-8, 12] },
  es: { country: "Spain", latitude: 40, longitude: -4, markerOffset: [-28, 16] },
  de: { country: "Germany", latitude: 51, longitude: 10, markerOffset: [22, -28] },
  th: { country: "Thailand", latitude: 15, longitude: 101, markerOffset: [0, 22] },
  fr: { country: "France", latitude: 46, longitude: 2, markerOffset: [-22, -26] },
};
export function mapPosition(location: LanguageLocation) {
  return { x: (location.longitude + 180) / 360 * 100, y: (90 - location.latitude) / 180 * 100 };
}
