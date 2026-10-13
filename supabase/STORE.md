# Avatar Store

`/store` uses the existing learner shell and real `avatar_items`, `user_avatar_items`, and `profiles` records. It does not invent item packs, prices, balances, or ownership. Search, category filtering, owned-item filtering, missing-image fallback, and free/paid confirmation are available. Equipping stays in `/avatar`.

Review `migrations/202610130002_avatar_store_purchase.sql` against the live schema and profile triggers before manually applying it. No SQL was executed by the implementation. The migration adds an authenticated-only transactional purchase function. It uses server-side catalog prices, locks the profile to prevent overspending, rejects stale displayed prices, and never charges a repeat purchase. If both coin and gem prices are nonzero, both are required. Ownership and balances update together or roll back together.

Existing avatar RLS allows client insertion only for free items. The function's database owner grants paid ownership without broadening that client policy. Keep those policies enabled. The function takes no caller-supplied learner ID and never automatically equips an item.

There is no verified purchase value for the existing currency transaction enums, nor a verified gem transaction table in this repository. This migration uses ownership as the purchase receipt and changes existing profile balances directly; it does not invent ledger columns or enum values. Confirm live balance triggers before applying to avoid conflicting bookkeeping. If a dedicated currency purchase ledger is required, inspect its actual schema before extending this function.

Before the function is installed, catalog browsing still works; confirming a claim or purchase reports that purchases are unavailable. An empty database catalog shows an empty-collection state. Missing local images show a fallback.

Live checks after reviewed installation: purchase a free and paid item; confirm balance deductions; repeat the same purchase; issue concurrent different-item purchases with insufficient combined funds; confirm other learners cannot purchase on your behalf; change an item's price after opening confirmation; equip the owned item; log out/in and verify persistence. Automated client tests do not prove SQL concurrency or live RLS behavior.
