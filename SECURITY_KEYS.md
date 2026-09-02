# ⚠️ Rotate your service-role key

Decoding the JWT from the websocket URL in your browser console showed a
`"role": "service_role"` claim — in `NEXT_PUBLIC_SUPABASE_ANON_KEY`.

`NEXT_PUBLIC_` variables are compiled into the JavaScript bundle. That key has
been served to every visitor of ridgeford.vercel.app. It bypasses RLS entirely:
anyone who opened devtools had full read/write on your database.

## Do this now

1. **Rotate.** Supabase → Settings → API Keys → roll the service-role / secret
   key. Treat the old one as burned — it was also pasted into a chat.
2. **Reassign**, in Vercel → Settings → Environment Variables:

   | Variable | Which key | Public? |
   |---|---|---|
   | `SUPABASE_SERVICE_ROLE_KEY` | secret / service_role | **never** |
   | `NEXT_PUBLIC_SUPABASE_ANON_KEY` | publishable / anon | yes |
   | `NEXT_PUBLIC_SUPABASE_URL` | `https://byuokzoxfavaobdzvdpx.supabase.co` | yes |
   | `SUPABASE_URL` | same as above | server |

   `NEXT_PUBLIC_SUPABASE_URL` is currently the literal placeholder
   `your-project.supabase.co` — that is the failing websocket in your console.
3. **Redeploy.** Vercel reads env vars at build time; saving them changes
   nothing on the running deployment.
4. Check the Supabase logs for queries you did not make while the key was out.

## This was also your 401

The keys are swapped, which means `SUPABASE_SERVICE_ROLE_KEY` holds the *anon*
key. Every server-side query therefore runs as `anon` and is subject to RLS:

- `verifyOtp` selects from `otp_codes` → RLS returns nothing → the code appears
  not to exist → `fail(401, "invalid or expired")`
- the earlier `new row violates row-level security policy for table "users"` on
  signup was the same swap, from the other direction

Not the OTP logic, not the dev bypass, not the client. One misassigned variable
producing two unrelated-looking failures weeks apart.

## So it cannot happen silently again

`src/lib/supabase/key-guard.ts` decodes the `role` claim (and understands the
newer `sb_secret_` / `sb_publishable_` prefixes) and is wired into both clients:

- **Server** — an anon key in `SUPABASE_SERVICE_ROLE_KEY` now throws at the
  first query, naming the problem and the fix, instead of surfacing as RLS
  errors on unrelated screens.
- **Browser** — a service key in a `NEXT_PUBLIC_` variable refuses to build the
  client and logs a security warning. Realtime stays off until corrected. A
  broken chat widget beats a public database.
- Both reject the placeholder `your-project.supabase.co`.

Verified against your actual key: detected as `service_role`, blocked.
