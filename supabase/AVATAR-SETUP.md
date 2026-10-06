# Avatar setup

`/avatar/setup` uses the existing catalog, ownership, and equipped tables. It
requires an authenticated Supabase user, restores active equipped items, and
offers active free starters or already owned items. The UI never purchases an
item or writes progress, XP, or coins.

The confirmed schema supports `base_id`, `face_id`, `hair_id`, and `clothes_id`,
one equipped record per `user_id`, and unique ownership on
`(user_id, avatar_item_id)`. No schema changes are needed.

The owner reported that all three tables have RLS enabled but no policies and
that `avatar_items` is empty. These prevent live customization and saving.

## Database preparation

Review and run `migrations/202610060002_avatar_setup_rls.sql` in Supabase SQL Editor.
The migration preserves RLS and defines active catalog reads, owned-row reads,
free-starter acquisition, and equipped-avatar INSERT/UPDATE. Equipped selections
must be owned, active, and match their categories. It does not create or seed
catalog items, alter columns, grant paid items, or spend currency.

Its restrictive guards also constrain authenticated access under other policies
to the owner and constrain ownership writes to free starters. A future shop or
administrator feature will need its own reviewed policy design; this migration
implements initial setup only. No live policy changes were applied by the agent.

Populate the existing `avatar_items` catalog with real, ready-to-use images after
review. Use the actual public paths and database category `clothes` for files
under `public/avatar/outfit`. No catalog seed was prepared: the current eight
1024x1024 PNG files have no alpha channel and would obscure underlying layers.
All layers need a common canvas, aligned artwork, and actual transparency.

## Validation

Run `node --test tests/avatar.test.mjs tests/auth-onboarding.test.mjs` for selection,
ownership, retry, session-change, and onboarding-cleanup checks. Test doubles in
these tests are not application catalog data.

After catalog/policy preparation, test in an authenticated browser:

1. Open `/avatar/setup`; verify all four categories and layered preview.
2. Change hair/clothes; verify the preview changes without database writes.
3. Save; verify one equipped row owned by the authenticated user and selected
   free ownership rows. Successful completion redirects to `/dashboard`.
4. Revisit; verify saved selections restore. Save again; row counts stay stable.
5. Verify another account cannot read or write those rows, acquire an unowned paid
   item, or equip an item in the wrong category.

Onboarding state is retained on save/finalization failure. It is cleared only
after avatar saving and verification of course enrollment and course progress.
