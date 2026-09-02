# Crest Capital — New features setup

This bundle adds three things:

1. **Transfer OTP** — bank-style: fill the transfer form → click send →
   you receive a 6-digit code by email → enter it → the transfer is
   actually created. No transfer row exists until the code is verified.
2. **Support image attachments** — customers and admins can send images
   in the support chat (stored in Supabase Storage).
3. **Better emails + logo** — the real Crest Capital logo is embedded in
   every email, the brand colours were corrected, and the receipt now
   has an official stamped header.

---

## 1. Run the database migration (REQUIRED)

In the Supabase dashboard → **SQL Editor**, open and run:

```
supabase/migrations/0002_transfer_otp_and_support_images.sql
```

This is safe to run on your existing database — it only adds/relaxes
things, never drops data. It does three jobs:

- adds `'transfer'` to the allowed OTP purposes,
- adds an `image_url` column to `support_messages` (and lets the message
  body be empty when there's only an image),
- creates the **`support-attachments`** storage bucket and a public-read
  policy on it.

> If you prefer, the same changes are also folded into the full
> `supabase/schema.sql`, so a fresh project that runs `schema.sql` gets
> everything automatically. You only need the migration for an
> already-deployed database.

### Verify the storage bucket exists

Supabase dashboard → **Storage**. You should see a bucket named
`support-attachments` marked **Public**. If for any reason the SQL did
not create it (some projects restrict `storage.buckets` inserts), create
it manually:

1. Storage → **New bucket**
2. Name: `support-attachments`
3. Toggle **Public bucket** ON
4. Create.

That's all the storage setup needed. Uploads are performed **server-side
with your existing `SUPABASE_SERVICE_ROLE_KEY`**, so no extra upload
policy is required — only public read so the `<img>` tags load, which
the migration already sets.

---

## 2. Environment variables

No new variables are required for OTP or images.

- Transfer OTP uses the same email pipeline as login OTP. If
  `RESEND_API_KEY` is **not** set (dev mode), the OTP modal accepts the
  code `000000`, exactly like the existing login OTP. In production set
  `RESEND_API_KEY` and `MAIL_FROM` and real codes are emailed.
- Image upload uses `SUPABASE_URL` + `SUPABASE_SERVICE_ROLE_KEY`, which
  you already have configured.
- (Optional, already documented) `NEXT_PUBLIC_SUPABASE_ANON_KEY` powers
  the realtime chat. Without it, chat + images still work via polling.

---

## 3. How receiving pictures in admin works

There is nothing extra to switch on. The flow:

1. A customer opens the support widget, taps the **image** button
   (next to the text box), picks a photo. It uploads to
   `support-attachments` and is posted as a chat message with an
   `image_url`.
2. In the admin console, go to **Support** in the sidebar → open that
   customer's conversation. The image renders inline in the thread, in
   real time (or within a few seconds via polling). Click it to open
   full size in a new tab.
3. Admins can also attach images the same way from the reply box; the
   customer sees them instantly in their widget.

Unread badges on the admin "Support" nav item already account for
image-only messages (they show as "📷 Photo" in the inbox preview).

---

## 4. What changed (file list)

### New files
- `src/app/api/transfers/otp/route.ts` — sends the transfer OTP email
- `src/components/dashboard/TransferOtpModal.tsx` — the 6-digit modal
- `src/lib/useTransferOtp.ts` — drives request → verify → submit
- `src/app/api/support/upload/route.ts` — customer image upload
- `src/app/api/admin/support/upload/route.ts` — admin image upload
- `supabase/migrations/0002_transfer_otp_and_support_images.sql`

### Changed files
- `src/app/api/transfers/route.ts` — POST now requires + verifies a
  `transfer` OTP before creating anything
- `src/lib/otp.ts` — `'transfer'` purpose
- `src/lib/email/index.ts`, `src/lib/email/templates.ts` — real logo,
  corrected brand palette, transfer-OTP template, upgraded receipt
- `src/lib/support.ts` — `image_url`, `uploadSupportImage()`
- `src/lib/useSupportChat.ts` — `sendImage()` + `uploading` state
- `src/app/api/support/messages/route.ts`,
  `src/app/api/admin/support/[userId]/route.ts` — accept `imageUrl`
- `src/components/support/SupportWidget.tsx`,
  `src/components/admin/SupportThread.tsx` — image picker + rendering
- the three transfer pages (`sepa`, `internal`, `international`) — now
  open the OTP modal instead of submitting directly
- `supabase/schema.sql` — same changes folded in for fresh installs

---

## 5. Verified

- `npx tsc --noEmit` → 0 errors
- `npx next build` → compiles, all routes including
  `/api/transfers/otp`, `/api/support/upload`,
  `/api/admin/support/upload` present.
