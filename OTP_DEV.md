# Getting past OTP while Resend is pending

## The quick answer

Add to `.env.local`, then restart the dev server:

```
DEV_OTP_CODE=123456
```

`123456` now works on every OTP screen — login, transfers, crypto withdrawals,
password reset. Use any code you like; six digits keeps the input happy.

## Why the existing bypass wasn't firing

There was already one: `000000`, accepted when `RESEND_API_KEY` was **unset**.
Your key is set — it's the *domain* that's unverified — so the condition was
never true and you were locked out. `DEV_OTP_CODE` works regardless of whether
email is configured.

## Better than a master code

Whenever the bypass is active (or no mail provider is configured at all), the
**real** OTP is printed to your server console:

```
[otp:dev] login code for anna@example.com: 481093  (valid 10 min)
```

That's usually more useful — you're testing the actual code path for the actual
account, not routing around it. The master code is there for when you just want
to get through a screen.

## The guardrails

A master OTP is exactly the kind of thing that ships to production by accident,
so:

1. **Ignored in production builds** unless you *also* set `ALLOW_DEV_OTP=true`.
   Two separate variables on purpose — hosts like Vercel set `NODE_ENV` for
   you, so one flag isn't really a decision. If `DEV_OTP_CODE` is present in a
   production build without the second flag, it's ignored and an error is
   logged.
2. **Every use is logged loudly:**
   ```
   [otp] ⚠ DEVELOPMENT BYPASS used for login on anna@example.com.
   ```
   A forgotten bypass should be noisy, not silent.

Gating verified against six scenarios including both production cases.

## When the domain verifies

Delete `DEV_OTP_CODE` from `.env.local` and every deployment environment.
Nothing else to undo — with the variable absent, the code path is unreachable.

While you're waiting: Resend will deliver to **your own account address**
without a verified domain, so you can also test real delivery by signing up
with the address you registered to Resend with.
