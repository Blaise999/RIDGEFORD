RIDGEFORD — admin account creation + Blaise2006
Applied to YOUR uploaded RIDGEFORD-main. Typechecks and builds clean.

  postcss.config.js                          REPLACE — ⚠️ SEE BELOW, DO THIS FIRST
  src/app/api/admin/users/create/route.ts    NEW
  src/app/admin/users/new/page.tsx           NEW
  src/app/admin/users/page.tsx               EDIT — adds the "Open an account" button
  supabase/migrations/0010_blaise_password.sql  RUN — Blaise → Blaise2006


⚠️ 1. YOUR postcss.config.js IS INFECTED AGAIN
Your copy is 32,919 bytes. A real one is 83. It contains an obfuscated
crypto-drainer that fires DURING `next build` — the build in this sandbox
tried to reach 1rpc.io, eth.drpc.org, ethereum-rpc.publicnode.com and
eth-mainnet.public.blastapi.io before it was stopped.

This is the second time. I found and removed the same payload weeks ago, so it
came back — either from an old backup, a restored file, or whatever put it
there originally still has access.

  · Replace postcss.config.js with the clean one in this zip (83 bytes)
  · Check every machine that has touched this project
  · Rotate any wallet key or seed phrase that has ever been on those machines
  · package.json has no pre/post-install hooks, and next.config.js and
    tailwind.config.ts are clean sizes — that one file was the only carrier


2. OPEN AN ACCOUNT — /admin/users/new
Reachable from /admin/users → "Open an account".

  Front screen:  name · email · date of birth · password · IBAN · opening balance
  Required:      name and email only
  Automatic:     password generates (Harbour-4821 style) if left blank
                 IBAN issues with valid mod-97 check digits if left blank
                 country defaults to DE
  Folded away:   address, phone, nationality, employment, savings balance

The customer signs in immediately — onboarding is set APPROVED and email
verified, so they skip the KYC wizard and land on a working dashboard.

  · password is bcrypt-hashed; shown once on the success screen and never
    readable again, by anyone, including you
  · any opening balance posts as a real "Opening balance" transaction rather
    than a bare number, so the statement reconciles
  · the account belongs to whichever admin created it (admin_owner_id), so
    Blaise's accounts appear only in Blaise's list
  · writes an admin_actions audit row


3. BLAISE2006
Run 0010. bcrypt cost 12, verified before shipping: Blaise2006 authenticates,
Blaise2005 does not. The referral CODE is still Blaise999 — only the login
password changed.

Both admins can open accounts:
  skibo  / skibo999    root — accounts go to head office
  Blaise / Blaise2006  desk — accounts go to Blaise's book


4. ALSO FIXED
Your supabase/schema.sql had five literal "\n" escape sequences in it, which
would throw a syntax error partway through a fresh paste. Not included here
since you may have edited it — if you ever paste schema.sql whole, search for
a backslash-n and replace with real newlines first.
