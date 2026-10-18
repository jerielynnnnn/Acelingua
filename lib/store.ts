import type { SupabaseClient } from "@supabase/supabase-js";
import { avatarItemFields, type AvatarItem } from "@/lib/avatar";

export function validStorePrice(item: Pick<AvatarItem, "price_coins" | "price_gems">) {
  return [item.price_coins, item.price_gems].every(value => Number.isSafeInteger(value) && value >= 0);
}
export async function loadStore(supabase: SupabaseClient, userId: string) {
  const [catalog, ownership, profile] = await Promise.all([
    supabase.from("avatar_items").select(avatarItemFields).eq("is_active", true).order("name").order("id"),
    supabase.from("user_avatar_items").select("avatar_item_id").eq("user_id", userId),
    supabase.from("profiles").select("coins, gems, hearts").eq("id", userId).maybeSingle(),
  ]);
  for (const result of [catalog, ownership, profile]) if (result.error) throw new Error(`We couldn't load your store: ${result.error.message}`);
  if (!profile.data) throw new Error("Your learner profile is unavailable. Please sign in again.");
  return { items: (catalog.data ?? []) as AvatarItem[], ownedIds: new Set<string>((ownership.data ?? []).map(row => row.avatar_item_id)),
    coins: Number(profile.data.coins), gems: Number(profile.data.gems), hearts: Number(profile.data.hearts) };
}
export async function purchaseAvatarItem(supabase: SupabaseClient, expectedUserId: string, item: AvatarItem) {
  const { data: { user }, error: authError } = await supabase.auth.getUser();
  if (authError || !user || user.id !== expectedUserId) throw new Error("Your session changed. Please sign in again before purchasing.");
  if (!validStorePrice(item)) throw new Error("This item is temporarily unavailable.");
  // Confirm the displayed price on the server. The RPC uses database prices,
  // locks balances, and returns a no-charge result for repeat purchases.
  const result = await supabase.rpc("acelingua_purchase_avatar_item", {
    p_item_id: item.id, p_expected_coins: item.price_coins, p_expected_gems: item.price_gems,
  });
  if (result.error) {
    if (["PGRST202", "42883"].includes(result.error.code)) throw new Error("Purchases are not available yet. Please try again later.");
    throw new Error(result.error.message);
  }
  const receipt = result.data as { already_owned: boolean; coins: number; gems: number } | null;
  if (!receipt || typeof receipt.already_owned !== "boolean" || !Number.isFinite(receipt.coins) || !Number.isFinite(receipt.gems)) {
    throw new Error("We couldn't confirm the purchase. Refresh the store to check your owned items before retrying.");
  }
  return receipt;
}
