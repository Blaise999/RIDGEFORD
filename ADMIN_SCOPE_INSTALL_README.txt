RIDGEFORD — ADMIN DESK ISOLATION PATCH

What it does
- Each admin sees only customers with users.admin_owner_id = that admin's user ID.
- Their transfer, transaction, application, KYC, crypto withdrawal and support queues
  are scoped to those customers, including direct object URLs and write actions.
- The original/root admin retains its own and previously unassigned accounts.
- Admin-created accounts remain assigned to the admin who created them.
- Signups using an admin's referral code continue to belong to that admin.
- SQL migration 0016 removes the root-admin FX-approval bypass and guards ownership.

Installation
1. Back up your Ridgeford source and Supabase database.
2. Extract this ZIP over your EXISTING Ridgeford-main folder, replacing only files in it.
3. In Supabase SQL Editor, execute supabase/migrations/0016_admin_desk_isolation.sql
   AFTER migrations 0004, 0005 and 0015.
4. Run the normal project build. Review changes before pushing to GitHub.

No animations, logos, WebP assets, homepage or existing balance data are packaged.

Verification
- All changed TypeScript/TSX files were syntax-checked with TypeScript.
- Admin endpoints were statically checked for owner scoping.
- This was not tested against the live Supabase database or deployed production app.

Security notes
- The service-role database key must remain server-side.
- Audit role, referral ownership and application actions with multiple test admins
  before granting access to real customers.
