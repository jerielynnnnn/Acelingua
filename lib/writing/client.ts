import { isAuthSessionMissingError } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/client";
import content from "./content.json";
import type { CharacterProgress, WritingCharacter, WritingSystem } from "./types";

export type StudioData = {
  language: { id: string; code: string; name: string }; systems: WritingSystem[];
  characters: WritingCharacter[]; progress: CharacterProgress[]; userId: string | null; local: boolean;
};
const missingSchema = (error: { code?: string } | null) => error && ["42P01", "PGRST205"].includes(error.code ?? "");
const key = (userId: string | null, language: string) => `acelingua:writing:v1:${userId ?? "guest"}:${language}`;

export function localProgress(userId: string | null, language: string): CharacterProgress[] {
  try {
    const value: unknown = JSON.parse(localStorage.getItem(key(userId, language)) ?? "[]");
    if (!Array.isArray(value)) return [];
    const valid = value.filter((row): row is CharacterProgress => Boolean(row)
      && typeof row.character_id === "string" && ["learning", "learned", "mastered"].includes(row.status)
      && Number.isInteger(row.practice_count) && row.practice_count >= 0
      && Number.isInteger(row.mastery_score) && row.mastery_score >= 0 && row.mastery_score <= 100);
    return [...new Map(valid.map(row => [row.character_id, row])).values()];
  } catch { return []; }
}

export async function loadWritingStudio(languageCode: string): Promise<StudioData> {
  const client = createClient();
  const [auth, languageResult] = await Promise.all([
    client.auth.getUser(), client.from("languages").select("id,code,name").eq("code", languageCode).eq("is_active", true).maybeSingle(),
  ]);
  if (auth.error && !isAuthSessionMissingError(auth.error)) throw auth.error;
  if (languageResult.error) throw languageResult.error;
  if (!languageResult.data) throw new Error("This language is not available. Please return to your roadmap.");
  const userId = auth.data.user?.id ?? null;
  const language = languageResult.data;
  const systemResult = await client.from("writing_systems").select("id,slug,name,description,display_order").eq("language_id", language.id).eq("is_published", true).order("display_order");
  if (missingSchema(systemResult.error)) {
    const systems = content.systems.filter(system => system.language === languageCode);
    return { language, systems, characters: content.characters.filter(c => systems.some(s => s.id === c.writing_system_id)) as WritingCharacter[],
      progress: localProgress(userId, languageCode), userId, local: true };
  }
  if (systemResult.error) throw systemResult.error;
  const systems = (systemResult.data ?? []).map(system => ({ ...system, language: languageCode })) as WritingSystem[];
  const characterResult = systems.length ? await client.from("writing_characters").select("*")
    .in("writing_system_id", systems.map(system => system.id)).eq("is_published", true).order("display_order") : { data: [], error: null };
  if (characterResult.error) throw characterResult.error;
  const characters = (characterResult.data ?? []).map(c => ({ ...c, group: c.group_name })) as WritingCharacter[];
  let progress: CharacterProgress[] = [];
  if (userId && characters.length) {
    const result = await client.from("user_character_progress").select("character_id,status,practice_count,mastery_score,last_practiced_at,mastered_at")
      .eq("user_id", userId).in("character_id", characters.map(character => character.id));
    if (result.error) throw result.error;
    progress = result.data as CharacterProgress[];
  } else if (!userId) progress = localProgress(null, languageCode);
  return { language, systems, characters, progress, userId, local: !userId };
}

export async function saveWritingPractice(data: StudioData, characterId: string, correct: boolean, traced: boolean) {
  if (!data.characters.some(c => c.id === characterId)) throw new Error("This character is unavailable.");
  const client = createClient();
  const { data: auth, error } = await client.auth.getUser();
  if (error && !isAuthSessionMissingError(error)) throw error;
  if ((auth.user?.id ?? null) !== data.userId) throw new Error("Your account changed. Reload the studio before saving.");
  if (!data.local) {
    const result = await client.rpc("record_writing_practice", { p_character_id: characterId, p_correct: correct, p_traced: traced });
    if (result.error) throw result.error;
    const row = Array.isArray(result.data) ? result.data[0] : result.data;
    if (!row) throw new Error("Your practice result could not be confirmed. Please retry.");
    return row as CharacterProgress;
  }
  const rows = localProgress(data.userId, data.language.code);
  const old = rows.find(row => row.character_id === characterId);
  const mastery = Math.min(100, (old?.mastery_score ?? 0) + (correct && traced ? 25 : 0));
  const now = new Date().toISOString();
  const row: CharacterProgress = { character_id: characterId, status: mastery === 100 ? "mastered" : mastery > 0 ? "learned" : "learning",
    practice_count: (old?.practice_count ?? 0) + 1, mastery_score: mastery, last_practiced_at: now,
    mastered_at: mastery === 100 ? old?.mastered_at ?? now : null };
  localStorage.setItem(key(data.userId, data.language.code), JSON.stringify([...rows.filter(r => r.character_id !== characterId), row]));
  return row;
}
