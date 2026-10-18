# Play Island

World links to `/world/minigames`. Travel Match pairs six English words with pictures. Practice rounds run locally and never award currency.

Review and manually apply `migrations/202610180004_minigame_rewards.sql` to enable daily challenges and rewards. No SQL was executed during implementation. Proposed reward: 20 coins and 2 gems for the first valid completion per UTC day, shared across devices. Review these rates and existing profile balance triggers before applying.

The server creates shuffled boards and keeps matching keys private. Completion validates that all twelve positions appear once in six correct pairs. Sessions expire after twenty minutes; completion requires at least ten seconds. Requests lock the profile before checking the daily reward record. Repeated session completion never credits twice. Clients cannot insert sessions, daily reward records, or their own award amounts. This is a small capped casual-game bonus, not proof that a human played without automation.

After installation, verify correct and incorrect pairs, duplicate positions, other-user sessions, expired sessions, replayed submissions, concurrent finishes, and the next UTC day's reward. An unsuccessful transaction must leave both balances and reward records unchanged. Static UI checks do not validate live SQL or RLS. Existing user reward records require no access from the browser.

The game starts without a background timer. Leaving the page cancels pending card flips. Reduced-motion preferences disable the floating island animation.
