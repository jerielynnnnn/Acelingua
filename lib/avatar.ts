import type { SupabaseClient } from "@supabase/supabase-js";

export const avatarCategories = ["base", "face", "hair", "clothes"] as const;
export type AvatarCategory = typeof avatarCategories[number];
// Existing DB category clothes uses the public/avatar/outfit assets and Outfit UI.
// Image paths still come directly from avatar_items.image_path, never guessed here.
export const avatarCategoryLabels: Record<AvatarCategory, string> = {
  base: "Base", face: "Face", hair: "Hair", clothes: "Outfit",
};
export type AvatarItem = {
  id: string; name: string; category: AvatarCategory; image_path: string;
  price_coins: number; price_gems: number; is_default: boolean; is_active: boolean;
};
export type AvatarSelection = Record<AvatarCategory, string | null>;
export type EquippedAvatar = { user_id: string; base_id: string | null; face_id: string | null; hair_id: string | null; clothes_id: string | null };
export const avatarItemFields = "id, name, category, image_path, price_coins, price_gems, is_default, is_active";

export async function loadLearnerAvatar(supabase: SupabaseClient, userId: string) {
  const [catalog, ownership, equipped] = await Promise.all([
    supabase.from("avatar_items").select(avatarItemFields).eq("is_active", true).order("name").order("id"),
    supabase.from("user_avatar_items").select("avatar_item_id").eq("user_id", userId),
    supabase.from("user_avatar_equipped").select("user_id, base_id, face_id, hair_id, clothes_id").eq("user_id", userId).maybeSingle(),
  ]);
  for (const result of [catalog, ownership, equipped]) if (result.error) throw new Error(`Loading your avatar: ${result.error.message}`);
  return { items: (catalog.data ?? []) as AvatarItem[],
    ownedIds: new Set<string>((ownership.data ?? []).map(row => row.avatar_item_id)),
    equipped: equipped.data as EquippedAvatar | null };
}

export function avatarLayers(items: AvatarItem[], selection: AvatarSelection) {
  return avatarCategories.flatMap(category => {
    const item = items.find(candidate => candidate.id === selection[category] && candidate.category === category);
    return item ? [{ category, name: item.name, imagePath: item.image_path }] : [];
  });
}

export function isFreeStarter(item: AvatarItem) {
  return item.is_active && item.price_coins === 0 && item.price_gems === 0;
}

export function canUseAvatarItem(item: AvatarItem, ownedIds: Set<string>) {
  return item.is_active && (isFreeStarter(item) || ownedIds.has(item.id));
}

export function initialAvatarSelection(items: AvatarItem[], ownedIds: Set<string>, equipped: EquippedAvatar | null): AvatarSelection {
  const selected: AvatarSelection = { base: null, face: null, hair: null, clothes: null };
  for (const category of avatarCategories) {
    const available = items.filter((item) => item.category === category && canUseAvatarItem(item, ownedIds));
    const equippedId = equipped?.[`${category}_id`];
    selected[category] = (available.find((item) => item.id === equippedId)
      ?? available.find((item) => item.is_default && isFreeStarter(item))
      ?? available.find(isFreeStarter)
      ?? available[0])?.id ?? null;
  }
  return selected;
}

function fail(operation: string, error: { message: string }) {
  throw new Error(`${operation}: ${error.message}`);
}

export async function saveLearnerAvatar(supabase: SupabaseClient, expectedUserId: string, selection: AvatarSelection) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError) fail("Checking sign-in", authError);
  if (!user) throw new Error("Please sign in again before saving your avatar.");
  if (user.id !== expectedUserId) throw new Error("Your signed-in account changed. Reload the page before saving.");
  const ids = avatarCategories.map((category) => selection[category]);
  if (ids.some((id) => !id)) throw new Error("Choose a Base, Face, Hair, and Outfit item before continuing.");
  const itemResult = await supabase.from("avatar_items").select(avatarItemFields)
    .eq("is_active", true).in("id", ids as string[]);
  if (itemResult.error) fail("Checking selected items", itemResult.error);
  const items: AvatarItem[] = itemResult.data ?? [];
  const ownershipResult = await supabase.from("user_avatar_items").select("avatar_item_id").eq("user_id", user.id);
  if (ownershipResult.error) fail("Checking avatar ownership", ownershipResult.error);
  const ownedIds = new Set<string>((ownershipResult.data ?? []).map((row) => row.avatar_item_id));
  const selectedItems = avatarCategories.map((category) => {
    const item = items.find((candidate) => candidate.id === selection[category] && candidate.category === category);
    if (!item || !canUseAvatarItem(item, ownedIds)) throw new Error(`Your selected ${avatarCategoryLabels[category].toLowerCase()} item is unavailable or not owned. Choose another item.`);
    return item;
  });
  const starters = selectedItems.filter((item) => !ownedIds.has(item.id));
  if (starters.length) {
    const result = await supabase.from("user_avatar_items").upsert(
      starters.map((item) => ({ user_id: user.id, avatar_item_id: item.id })),
      { onConflict: "user_id,avatar_item_id", ignoreDuplicates: true },
    );
    if (result.error) fail("Saving starter ownership", result.error);
  }
  const result = await supabase.from("user_avatar_equipped").upsert({
    user_id: user.id, base_id: selection.base, face_id: selection.face,
    hair_id: selection.hair, clothes_id: selection.clothes, updated_at: new Date().toISOString(),
  }, { onConflict: "user_id" });
  if (result.error) fail("Saving your avatar", result.error);
  return user;
}

// Keep state if enrollment/progress cannot be verified, or if finalization fails.
export async function finishAvatarOnboarding(supabase: SupabaseClient, user: { id: string; user_metadata: Record<string, unknown> }) {
  const metadata = user.user_metadata.acelingua_onboarding as { languageId?: string; completed?: boolean } | null;
  const owner = localStorage.getItem("acelingua_onboarding_user_id");
  const pending = (owner === user.id && localStorage.getItem("acelingua_onboarding_started") === "true")
    || Boolean(metadata && !metadata.completed);
  if (!pending) return;
  const storedCourse = owner === user.id ? localStorage.getItem("acelingua_onboarding_course_id") : null;
  let courseId = storedCourse;
  if (!courseId && metadata?.languageId) {
    const result = await supabase.from("user_courses").select("course_id, courses!inner(language_id)")
      .eq("user_id", user.id).eq("courses.language_id", metadata.languageId).order("enrolled_at", { ascending: false }).limit(1).maybeSingle();
    if (result.error) fail("Verifying enrollment", result.error);
    courseId = result.data?.course_id ?? null;
  }
  if (!courseId) throw new Error("Your avatar is saved. Please return to onboarding to finish course enrollment.");
  const [enrollment, progress] = await Promise.all([
    supabase.from("user_courses").select("id").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
    supabase.from("course_progress").select("id").eq("user_id", user.id).eq("course_id", courseId).maybeSingle(),
  ]);
  if (enrollment.error) fail("Verifying enrollment", enrollment.error);
  if (progress.error) fail("Verifying course progress", progress.error);
  if (!enrollment.data || !progress.data) throw new Error("Your avatar is saved. Please return to onboarding to finish preparing your course.");
  const result = await supabase.auth.updateUser({ data: {
    acelingua_onboarding: metadata ? { ...metadata, completed: true } : null,
    guest_lesson: null,
  } });
  if (result.error) fail("Finishing onboarding", result.error);
  localStorage.setItem("acelingua_onboarding_completed_user_id", user.id);
  if (!owner || owner === user.id) {
    for (const key of ["acelingua_onboarding_started", "acelingua_intro_completed", "acelingua_intro_lesson_id",
      "acelingua_selected_language", "acelingua_selected_language_id", "acelingua_onboarding_course_id",
      "acelingua_onboarding_user_id", "acelingua:first-lesson"]) localStorage.removeItem(key);
  }
}
