import { Resend } from "resend";
import {
  transferSubmittedTemplate,
  transferApprovedTemplate,
  transferRejectedTemplate,
  accountBlockedTemplate,
  accountUnblockedTemplate,
  welcomeTemplate,
  receiptTemplate,
  otpTemplate,
  onboardingApprovedTemplate,
  onboardingRejectedTemplate,
  transactionPostedTemplate,
  type TransferEmailPayload,
  type ReceiptPayload,
  type TransactionPostedPayload,
} from "./templates";

export function getResend() {
  const key = process.env.RESEND_API_KEY;
  if (!key) return null;
  return new Resend(key);
}

async function send(to: string, subject: string, html: string) {
  const from = process.env.MAIL_FROM || "Ridgeford Capital Bank <noreply@ridgefordbank.eu>";
  const resend = getResend();
  if (!resend) {
    console.log("\n[email:dev] →", to);
    console.log("[email:dev] subject:", subject);
    return { ok: true, dev: true as const };
  }
  try {
    const r = await resend.emails.send({ from, to, subject, html });
    return { ok: true, id: (r as any)?.data?.id || null };
  } catch (e: any) {
    console.warn("[email] send failed:", e?.message || e);
    return { ok: false, error: String(e?.message || e) };
  }
}

/**
 * Run an email send AFTER the HTTP response is returned, but guarantee that the
 * serverless runtime stays alive long enough to complete it.
 *
 * Why this exists: the previous pattern was `sendX(...).catch(() => {})` — a
 * fire-and-forget Promise. On Vercel / Lambda style hosts the function freezes
 * the moment the response is sent, so those promises pause mid-flight and only
 * resume when the same container is reused (can be 20+ minutes apart on low
 * traffic). `after()` tells Next to keep the invocation alive until the work
 * settles, which is what we actually want.
 */
export function deferEmail(task: () => Promise<unknown>) {
  // Lazy require so this file still works in non-Next contexts (tests, scripts).
  let after:
    | ((cb: () => unknown | Promise<unknown>) => void)
    | undefined;
  try {
    // eslint-disable-next-line @typescript-eslint/no-var-requires
    const mod = require("next/server") as Record<string, unknown>;
    after =
      (mod.after as typeof after) ||
      (mod.unstable_after as typeof after);
  } catch {
    after = undefined;
  }

  const wrapped = async () => {
    try {
      await task();
    } catch (e: any) {
      console.warn("[email] deferred send failed:", e?.message || e);
    }
  };

  if (typeof after === "function") {
    try {
      after(wrapped);
      return;
    } catch {
      // after() can throw if called outside a request scope — fall through.
    }
  }
  // Fallback: plain fire-and-forget. Better than nothing in dev / scripts.
  void wrapped();
}

export async function sendWelcome(to: string, firstName: string) {
  return send(to, "Welcome to Ridgeford Capital Bank", welcomeTemplate({ firstName }));
}
export async function sendTransferSubmitted(to: string, p: TransferEmailPayload) {
  return send(to, `Transfer ${p.reference} submitted for review`, transferSubmittedTemplate(p));
}
export async function sendTransferApproved(to: string, p: TransferEmailPayload) {
  return send(to, `Transfer ${p.reference} approved`, transferApprovedTemplate(p));
}
export async function sendTransferRejected(to: string, p: TransferEmailPayload & { reason?: string }) {
  return send(to, `Transfer ${p.reference} rejected`, transferRejectedTemplate(p));
}
export async function sendAccountBlocked(to: string, firstName: string, reason?: string) {
  return send(to, "Your Ridgeford Capital Bank account has been suspended", accountBlockedTemplate({ firstName, reason }));
}
export async function sendAccountUnblocked(to: string, firstName: string) {
  return send(to, "Your Ridgeford Capital Bank account is active again", accountUnblockedTemplate({ firstName }));
}
export async function sendReceipt(to: string, p: ReceiptPayload) {
  return send(to, `Receipt — ${p.reference}`, receiptTemplate(p));
}
export async function sendOtp(
  to: string,
  code: string,
  purpose: "login" | "password_reset" | "transfer" | "crypto_withdrawal",
  context?: { amount?: string; beneficiary?: string }
) {
  const subject =
    purpose === "login"
      ? "Your Ridgeford Capital Bank sign-in code"
      : purpose === "transfer"
      ? "Authorise your Ridgeford Capital Bank transfer"
      : purpose === "crypto_withdrawal"
      ? "Authorise your Ridgeford crypto withdrawal"
      : "Reset your Ridgeford Capital Bank password";
  return send(to, subject, otpTemplate({ code, purpose, context }));
}
export async function sendOnboardingApproved(to: string, firstName: string, iban?: string) {
  return send(to, "Welcome to Ridgeford Capital Bank — your account is open", onboardingApprovedTemplate({ firstName, iban }));
}
export async function sendOnboardingRejected(to: string, firstName: string, reason?: string) {
  return send(to, "Your Ridgeford Capital Bank application", onboardingRejectedTemplate({ firstName, reason }));
}
export async function sendTransactionPosted(to: string, p: TransactionPostedPayload) {
  const subject =
    p.direction === "credit"
      ? `You received ${p.amountFmt}`
      : `${p.amountFmt} debited from your account`;
  return send(to, subject, transactionPostedTemplate(p));
}
