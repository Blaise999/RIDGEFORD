Ridgeford restricted-customer support access fix
================================================

Extract this ZIP into your EXISTING Ridgeford-main project (keep directories).
Do not copy files into a new root-level app/ folder. Paths begin src/.

Fixes:
- Adds a direct /dashboard/support page, accessible from the restriction notice,
  desktop sidebar and mobile navigation.
- Keeps the floating support chat and lifts it above dashboard overlays.
- Removes the global window.fetch interception that could break messaging.
- Ensures support GET, POST, upload and read endpoints use requireSupportUser,
  which allows signed-in blocked customers to use support.
- Non-support banking writes still use requireUser / requireActiveUser and are
  rejected when the customer is blocked.
- No SQL migration or banking/animation changes.

Before pushing, run npm run build. Verify with a blocked test account:
  1. /dashboard/support loads the conversation.
  2. Send a message; it appears in the matching admin inbox.
  3. Reply from that admin; customer sees the reply.
  4. View-only dashboard still works; banking writes return 403.
  5. Restore access and ensure banking actions work again.

This patch was checked for TypeScript syntax and source imports, but it was
not tested against the live Supabase environment.
