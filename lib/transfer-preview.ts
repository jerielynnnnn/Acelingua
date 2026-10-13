import type { SupabaseClient, User } from "@supabase/supabase-js";
import { PREVIEW_KEY, readPreview, validatePreview, writePreview } from "@/lib/guest-preview";

export async function prepareRegistrationPreview(supabase: SupabaseClient, user: User) {
  if (localStorage.getItem("acelingua_registration_pending") !== "true") return user;
  const enrollment = await supabase.from("user_courses").select("course_id").eq("user_id", user.id).limit(1).maybeSingle();
  if (enrollment.error) throw enrollment.error;
  localStorage.removeItem("acelingua_registration_pending");
  if (enrollment.data) return user;
  const preview = readPreview();
  if (!preview?.completed || (preview.ownerId && preview.ownerId !== user.id)) return user;
  const { data, error } = await supabase.auth.updateUser({ data: {
    acelingua_onboarding: { languageId: preview.languageId, languageCode: preview.languageCode, courseId: preview.courseId, introCompleted: true, source: "guest_preview" },
    acelingua_guest_preview: preview,
  } });
  if (error) { localStorage.setItem("acelingua_registration_pending", "true"); throw error; }
  return data.user ?? user;
}

export async function transferPreview(supabase: SupabaseClient, user: User) {
  const local = readPreview();
  const preview = validatePreview(user.user_metadata.acelingua_guest_preview)
    ?? (user.user_metadata.acelingua_onboarding?.source === "guest_preview" ? local : null);
  if (!preview?.completed || (preview.ownerId && preview.ownerId !== user.id)) return;
  // Bind the local copy before the request; keep it on any server failure.
  if (local?.lessonId === preview.lessonId) writePreview({ ...preview, ownerId: user.id });
  const { error } = await supabase.rpc("acelingua_save_guest_preview", { p_preview: preview });
  if (error) throw new Error(`Your preview is still saved. We couldn't transfer it yet: ${error.message}`);
  if (local?.lessonId === preview.lessonId) localStorage.removeItem(PREVIEW_KEY);
}
