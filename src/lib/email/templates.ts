/* ------------------------------------------------------------------------- */
/*  Ridgeford Capital Bank — transactional email templates                            */
/*                                                                           */
/*  Designed to render well in:                                              */
/*    Gmail (web + iOS + Android), Apple Mail, Outlook 2016+,                */
/*    Outlook.com, Yahoo, Proton.                                            */
/*                                                                           */
/*  Rules followed:                                                          */
/*    - Tables for layout (Outlook hates flexbox).                           */
/*    - Inline CSS only.                                                     */
/*    - 600px max width, mobile-friendly (single column).                    */
/*    - System fonts (no @import; many clients strip <style>).               */
/* ------------------------------------------------------------------------- */

export type TransferEmailPayload = {
  firstName: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  rail: string;
  reason?: string;
};

/**
 * EMAIL BRAND
 *
 * These were still the old blue Crest values. Now the Ridgeford scheme, but
 * adapted for the inbox rather than copied from the app:
 *
 * The app is near-black. Email is NOT. Dark-background HTML email is a known
 * mess — Gmail and Outlook invert or partially invert it, dark-mode clients
 * invert it a second time, and the result is unreadable in a way you cannot
 * test for. So the emails are on paper, in the same warm off-white the
 * dashboard hero uses, with the steel accent and a near-black masthead. The
 * brand survives; the medium is respected.
 */
const BRAND = {
  brand: "#8a9bab",        // steel
  brandDark: "#5f6d7a",
  green: "#3d9b6e",        // aliases kept — existing templates reference these
  greenDark: "#2f7a56",
  ink900: "#14110d",
  ink700: "#3f3a31",
  ink500: "#6b6357",
  ink400: "#8b8375",
  ink200: "#ddd7cb",
  ink100: "#eae5da",
  bg: "#f2efe8",           // the paper the message sits on
  white: "#ffffff",
  masthead: "#0c0c0c",     // the one dark band, top of the message
  // Status palette — muted, matching the app's data colours
  amberBg: "#fdf3e7",
  amberFg: "#8a5320",
  blueBg: "#eef1f4",
  blueFg: "#4a5560",
  redBg: "#fbecea",
  redFg: "#9d3527",
  greenBg: "#eaf3ee",
  greenFg: "#2b6e4f",
};

/**
 * The Ridgeford Capital Bank logo, inlined as a base64 data URI so it renders without
 * an external image host. Apple Mail / iOS Mail / most webmail render data
 * URIs; Outlook (mso) ignores them, so the shell provides an mso fallback.
 * This is the exact artwork from /public/logo.svg.
 */
/**
 * The Ridgeford mark, as an inline SVG data URI. Same geometry as
 * components/brand/Logo.tsx — three strata narrowing upward on a heavier
 * steel base — so the email and the app are unmistakably the same bank.
 *
 * The previous version was the old blue Crest artwork: a completely different
 * mark still going out on every transactional email.
 *
 * Apple Mail, iOS Mail and most webmail render data URIs. Outlook (mso) does
 * not, so the shell keeps a VML-free text fallback beneath it.
 */
const LOGO_SVG = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 64 64" width="64" height="64"><rect x="8" y="16" width="48" height="7" rx="1.5" fill="#ffffff" opacity="0.42"/><rect x="14" y="27" width="36" height="7" rx="1.5" fill="#ffffff" opacity="0.68"/><rect x="20" y="38" width="24" height="7" rx="1.5" fill="#ffffff"/><rect x="4" y="50" width="56" height="9" rx="2" fill="#8a9bab"/></svg>`;

/**
 * WHY THE EMAIL LOGO WAS INVISIBLE.
 *
 * It was an inline SVG served as a base64 data URI. Two independent reasons
 * that can never work in an inbox:
 *
 *   1. Gmail does not render SVG images AT ALL — web, iOS or Android. It
 *      strips them. Neither does Outlook.com.
 *   2. Gmail also strips `data:` URIs on <img src>, so even a PNG encoded
 *      that way would not have shown.
 *
 * Email clients want a PNG at an absolute https URL. /public already has the
 * mark rendered at every size, so the masthead now points at the 192px one.
 * NEXT_PUBLIC_APP_URL must be set to your real domain in production, or the
 * image resolves against localhost and breaks for everyone but you.
 */
function assetBase() {
  const raw =
    process.env.NEXT_PUBLIC_APP_URL ||
    (process.env.VERCEL_URL ? `https://${process.env.VERCEL_URL}` : "") ||
    "http://localhost:3000";
  return raw.replace(/\/+$/, "");
}

const LOGO_URL = `${assetBase()}/android-chrome-192x192.png`;

function escape(s: string) {
  return String(s ?? "").replace(/[&<>"']/g, (m) =>
    ({ "&": "&amp;", "<": "&lt;", ">": "&gt;", '"': "&quot;", "'": "&#39;" } as any)[m]
  );
}

function fmt(n: number, cur = "EUR") {
  const rounded = Math.round(Number(n || 0));
  try {
    return new Intl.NumberFormat("de-DE", {
      style: "currency",
      currency: cur,
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(rounded);
  } catch {
    return `${cur} ${rounded.toLocaleString("en-GB")}`;
  }
}

function railLabel(rail: string) {
  if (rail === "sepa_instant") return "SEPA Instant";
  if (rail === "sepa") return "SEPA Transfer";
  if (rail === "internal") return "Internal Transfer";
  if (rail === "swift") return "SWIFT Wire";
  return String(rail || "").toUpperCase();
}

/* -------------------------- shell ---------------------------------------- */

function shell({
  inner,
  preheader,
  accent,
}: {
  inner: string;
  preheader: string;
  accent?: { color: string; label: string };
}) {
  // Logo: rendered as a coloured square + brand wordmark, table-based so Outlook keeps it in line.
  const accentBar = accent
    ? `<tr><td style="height:3px;line-height:3px;font-size:0;background:${accent.color};">&nbsp;</td></tr>`
    : `<tr><td style="height:3px;line-height:3px;font-size:0;background:${BRAND.brand};">&nbsp;</td></tr>`;

  return `<!doctype html>
<html lang="en">
<head>
<meta charset="utf-8"/>
<meta name="viewport" content="width=device-width,initial-scale=1"/>
<meta name="x-apple-disable-message-reformatting"/>
<meta name="color-scheme" content="light only"/>
<meta name="supported-color-schemes" content="light"/>
<title>Ridgeford Capital Bank</title>
</head>
<body style="margin:0;padding:0;background:${BRAND.bg};font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',Roboto,Helvetica,Arial,sans-serif;color:${BRAND.ink900};-webkit-font-smoothing:antialiased;">
<div style="display:none;visibility:hidden;opacity:0;height:0;width:0;overflow:hidden;mso-hide:all;">${escape(preheader)}</div>

<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.bg};">
  <tr><td align="center" style="padding:32px 16px 40px 16px;">

    <!-- Card -->
    <table role="presentation" width="600" cellspacing="0" cellpadding="0" border="0" style="max-width:600px;width:100%;background:${BRAND.white};border-radius:10px;overflow:hidden;border:1px solid ${BRAND.ink200};">

      <!-- Masthead: the one dark band in the message, so the mark reads the
           way it does everywhere else. Table-based and inline-styled, because
           Outlook renders neither flexbox nor a stylesheet. -->
      <tr><td style="background:${BRAND.masthead};padding:22px 32px;">
        <table role="presentation" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="padding-right:13px;vertical-align:middle;">
              <img src="${LOGO_URL}" width="36" height="36" alt="Ridgeford"
                   style="display:block;width:36px;height:36px;border:0;outline:none;text-decoration:none;border-radius:8px;" />
            </td>
            <td style="vertical-align:middle;">
              <div style="font-family:Georgia,'Times New Roman',serif;font-weight:700;font-size:21px;letter-spacing:0.055em;color:#ffffff;line-height:1;">RIDGEFORD</div>
              <div style="margin-top:6px;font-size:9.5px;font-weight:600;letter-spacing:0.2em;text-transform:uppercase;color:${BRAND.brand};line-height:1;">The foundation of European wealth</div>
            </td>
          </tr>
        </table>
      </td></tr>

      ${accentBar}

      <!-- Body -->
      <tr><td style="padding:24px 32px 8px 32px;">${inner}</td></tr>

      <!-- Footer -->
      <tr><td style="padding:24px 32px 28px 32px;border-top:1px solid ${BRAND.ink100};">
        <p style="margin:0 0 6px 0;font-size:12px;line-height:18px;color:${BRAND.ink500};">
          <strong style="color:${BRAND.ink700};">Ridgeford Capital Bank AG</strong> — Kaiserstraße 16, 60311 Frankfurt am Main, Germany
        </p>
        <p style="margin:0 0 10px 0;font-size:12px;line-height:18px;color:${BRAND.ink500};">
          Supervised by BaFin and the Deutsche Bundesbank · Deposits protected up to €100,000.
        </p>
        <p style="margin:0;font-size:11.5px;line-height:17px;color:${BRAND.ink400};">
          This is a transactional notification from Ridgeford Capital Bank. If you didn't expect it, please contact <a href="mailto:support@ridgefordbank.eu" style="color:${BRAND.ink500};text-decoration:underline;">support@ridgefordbank.eu</a>.
        </p>
      </td></tr>

    </table>

  </td></tr>
</table>

</body>
</html>`;
}

/* -------------------------- pieces --------------------------------------- */

function h1(t: string) {
  return `<h1 style="margin:0 0 8px 0;font-size:22px;font-weight:700;letter-spacing:-0.015em;color:${BRAND.ink900};line-height:1.25;">${t}</h1>`;
}
function p(t: string) {
  return `<p style="margin:0 0 14px 0;font-size:15px;line-height:1.55;color:${BRAND.ink700};">${t}</p>`;
}
function muted(t: string) {
  return `<p style="margin:0 0 14px 0;font-size:13px;line-height:1.55;color:${BRAND.ink500};">${t}</p>`;
}

function eyebrow(text: string, color = BRAND.ink400) {
  return `<div style="margin:0 0 8px 0;font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${color};">${escape(text)}</div>`;
}

/** Big amount block — used in receipts / approvals. */
function amountBlock(amount: number, currency: string, sublabel?: string) {
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0 6px 0;background:${BRAND.bg};border-radius:14px;">
    <tr><td style="padding:18px 20px;">
      <div style="font-size:11px;font-weight:700;letter-spacing:0.16em;text-transform:uppercase;color:${BRAND.ink400};">Amount</div>
      <div style="margin-top:4px;font-size:30px;font-weight:800;color:${BRAND.ink900};letter-spacing:-0.02em;line-height:1.1;">${escape(fmt(amount, currency))}</div>
      ${sublabel ? `<div style="margin-top:4px;font-size:12.5px;color:${BRAND.ink500};">${escape(sublabel)}</div>` : ""}
    </td></tr>
  </table>`;
}

/** Detail card — k/v rows with nice spacing & dividers. */
function card(rows: [string, string][]) {
  const lines = rows
    .map(
      ([k, v], i) =>
        `<tr>
          <td style="padding:11px 0;${i > 0 ? `border-top:1px solid ${BRAND.ink100};` : ""}color:${BRAND.ink500};font-size:13px;line-height:1.4;width:42%;">${escape(k)}</td>
          <td style="padding:11px 0;${i > 0 ? `border-top:1px solid ${BRAND.ink100};` : ""}color:${BRAND.ink900};font-size:14px;text-align:right;font-weight:600;line-height:1.4;word-break:break-word;">${escape(v)}</td>
        </tr>`
    )
    .join("");
  return `<table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="background:${BRAND.white};border:1px solid ${BRAND.ink100};border-radius:12px;padding:4px 16px;margin:12px 0 18px 0;">${lines}</table>`;
}

function badge(text: string, bg: string, fg: string) {
  return `<span style="display:inline-block;padding:5px 12px;border-radius:999px;background:${bg};color:${fg};font-size:11.5px;font-weight:700;letter-spacing:0.02em;text-transform:uppercase;">${escape(text)}</span>`;
}

/* -------------------------- WELCOME -------------------------------------- */

export function welcomeTemplate({ firstName }: { firstName: string }) {
  return shell({
    inner: `
    ${h1(`Welcome, ${escape(firstName || "there")}`)}
    ${p("Your Ridgeford Capital Bank application has been received. We're reviewing it now — most are approved within a few business hours.")}
    ${p("Once approved you'll be able to send SEPA, SEPA Instant and SWIFT transfers, organise savings into Spaces, and use your Ridgeford Capital Bank debit Mastercard anywhere.")}
    ${muted("You'll get another email the moment your account is opened.")}
    `,
    preheader: "Your Ridgeford Capital Bank application has been received.",
  });
}

/* -------------------------- TRANSFERS ------------------------------------ */

export function transferSubmittedTemplate(p_: TransferEmailPayload) {
  return shell({
    accent: { color: BRAND.amberFg, label: "Pending" },
    inner: `
    ${eyebrow("Transfer submitted")}
    ${h1("We've received your transfer")}
    ${p(`Hi ${escape(p_.firstName)}, your ${escape(railLabel(p_.rail))} of <strong>${escape(fmt(p_.amount, p_.currency))}</strong> to <strong>${escape(p_.beneficiaryName)}</strong> is now under review by our compliance team.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Under review"],
    ])}
    ${p("Most transfers are reviewed within minutes during business hours. You'll get another email the moment the review is complete.")}
    <p style="margin:6px 0 0 0;">${badge("Pending review", BRAND.amberBg, BRAND.amberFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} is under review.`,
  });
}

export function transferApprovedTemplate(p_: TransferEmailPayload) {
  return shell({
    accent: { color: BRAND.green, label: "Approved" },
    inner: `
    ${eyebrow("Transfer approved", BRAND.greenFg)}
    ${h1("Your transfer is on its way")}
    ${p(`Good news, ${escape(p_.firstName)} — your transfer to <strong>${escape(p_.beneficiaryName)}</strong> has been approved and is being settled.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Approved"],
    ])}
    ${muted("A separate receipt has also been emailed to you for your records.")}
    <p style="margin:6px 0 0 0;">${badge("Approved", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} approved — ${fmt(p_.amount, p_.currency)} to ${p_.beneficiaryName}.`,
  });
}

export function transferRejectedTemplate(p_: TransferEmailPayload) {
  const reason = p_.reason
    ? card([["Reason", p_.reason]])
    : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Rejected" },
    inner: `
    ${eyebrow("Transfer rejected", BRAND.redFg)}
    ${h1("We weren't able to approve this transfer")}
    ${p(`Hi ${escape(p_.firstName)}, your transfer to <strong>${escape(p_.beneficiaryName)}</strong> couldn't be approved. <strong>No funds were moved</strong> — your balance is unchanged.`)}
    ${amountBlock(p_.amount, p_.currency, `to ${p_.beneficiaryName}`)}
    ${card([
      ["Reference", p_.reference],
      ["Beneficiary", p_.beneficiaryName],
      ["Rail", railLabel(p_.rail)],
      ["Status", "Rejected"],
    ])}
    ${reason}
    ${p("If you believe this was a mistake, please contact <a href=\"mailto:support@ridgefordbank.eu\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@ridgefordbank.eu</a> and reference the ID above.")}
    <p style="margin:6px 0 0 0;">${badge("Rejected", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: `Transfer ${p_.reference} was not approved. No funds moved.`,
  });
}

/* -------------------------- ACCOUNT STATE -------------------------------- */

export function accountBlockedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  const reasonRows = reason ? card([["Reason", reason]]) : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Suspended" },
    inner: `
    ${eyebrow("Account suspended", BRAND.redFg)}
    ${h1("Your account has been suspended")}
    ${p(`Hi ${escape(firstName)}, your Ridgeford Capital Bank account has been temporarily suspended by our compliance team. Until this is resolved you won't be able to initiate transfers or use your card.`)}
    ${reasonRows}
    ${p("Please contact <a href=\"mailto:support@ridgefordbank.eu\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@ridgefordbank.eu</a> as soon as possible so we can review your case together.")}
    <p style="margin:6px 0 0 0;">${badge("Account suspended", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: "Your Ridgeford Capital Bank account has been suspended.",
  });
}

export function accountUnblockedTemplate({ firstName }: { firstName: string }) {
  return shell({
    accent: { color: BRAND.green, label: "Active" },
    inner: `
    ${eyebrow("Account active", BRAND.greenFg)}
    ${h1("Your account is active again")}
    ${p(`Good news, ${escape(firstName)} — the suspension on your Ridgeford Capital Bank account has been lifted. You can sign in, transfer money and use your card as normal.`)}
    <p style="margin:6px 0 0 0;">${badge("Active", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: "Your Ridgeford Capital Bank account is active again.",
  });
}

/* -------------------------- OTP ------------------------------------------ */

export function otpTemplate({
  code,
  purpose,
  context,
}: {
  code: string;
  purpose: "login" | "password_reset" | "transfer" | "crypto_withdrawal";
  context?: { amount?: string; beneficiary?: string };
}) {
  const title =
    purpose === "login"
      ? "Your sign-in code"
      : purpose === "transfer"
      ? "Authorise your transfer"
      : purpose === "crypto_withdrawal"
      ? "Authorise your crypto withdrawal"
      : "Reset your password";

  const body =
    purpose === "login"
      ? "Enter this 6-digit code to finish signing in to Ridgeford Capital Bank."
      : purpose === "transfer"
      ? "For your security, confirm this payment by entering the 6-digit code below in the app. The transfer will not be sent until you do."
      : purpose === "crypto_withdrawal"
      ? "You asked us to send digital assets to an external address. Crypto transfers cannot be reversed once they are broadcast, so enter the 6-digit code below to confirm the address is yours. If you did not request this, contact us immediately and do not share this code."
      : "Enter this 6-digit code to set a new password on your Ridgeford Capital Bank account.";

  // Spaced groups: "123 456" — easier to read & retype.
  const safe = String(code || "").replace(/\D/g, "").slice(0, 6);
  const display = safe.length === 6 ? `${safe.slice(0, 3)} ${safe.slice(3)}` : safe;

  const txnCard =
    (purpose === "transfer" || purpose === "crypto_withdrawal") && context
      ? card(
          [
            context.amount ? (["Amount", context.amount] as [string, string]) : null,
            context.beneficiary
              ? (["To", context.beneficiary] as [string, string])
              : null,
          ].filter(Boolean) as [string, string][]
        )
      : "";

  return shell({
    accent:
      purpose === "transfer"
        ? { color: BRAND.brand, label: "Authorise" }
        : undefined,
    inner: `
    ${eyebrow(
      purpose === "login"
        ? "Sign-in"
        : purpose === "transfer"
        ? "Payment authorisation"
        : "Password reset"
    )}
    ${h1(title)}
    ${p(body)}
    ${txnCard}
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:18px 0;">
      <tr><td align="center">
        <div style="display:inline-block;background:${BRAND.bg};border:1px solid ${BRAND.ink200};border-radius:14px;padding:18px 28px;font-size:34px;letter-spacing:0.18em;font-weight:800;color:${BRAND.ink900};font-family:'SF Mono',Menlo,Consolas,'Liberation Mono',monospace;">${escape(display)}</div>
      </td></tr>
    </table>
    ${muted(
      purpose === "transfer"
        ? "This code expires in 10 minutes. If you didn't start this payment, do NOT share this code — contact support@ridgefordbank.eu immediately and your account will be secured."
        : "This code expires in 10 minutes. If you didn't request it, you can safely ignore this email — no changes will be made to your account."
    )}
    `,
    preheader:
      purpose === "transfer"
        ? `Authorise your transfer — code ${display} (expires in 10 minutes).`
        : `${title} — code expires in 10 minutes.`,
  });
}

/* -------------------------- ONBOARDING ----------------------------------- */

export function onboardingApprovedTemplate({ firstName, iban }: { firstName: string; iban?: string }) {
  return shell({
    accent: { color: BRAND.green, label: "Approved" },
    inner: `
    ${eyebrow("Application approved", BRAND.greenFg)}
    ${h1(`Welcome aboard, ${escape(firstName)}`)}
    ${p("Your Ridgeford Capital Bank application has been reviewed and approved. Your account is now live and ready to use.")}
    ${iban ? card([["Your German IBAN", iban]]) : ""}
    ${p("You can now sign in, receive money, send SEPA / SEPA Instant / SWIFT transfers, and organise your balance into Spaces. On first sign-in we'll ask for a one-time code — that's normal, it keeps your account safe.")}
    <p style="margin:6px 0 0 0;">${badge("Account open", BRAND.greenBg, BRAND.greenFg)}</p>
    `,
    preheader: "Welcome to Ridgeford Capital Bank — your account is open.",
  });
}

export function onboardingRejectedTemplate({ firstName, reason }: { firstName: string; reason?: string }) {
  const reasonRows = reason ? card([["Reason", reason]]) : "";
  return shell({
    accent: { color: BRAND.redFg, label: "Not approved" },
    inner: `
    ${eyebrow("Application update", BRAND.redFg)}
    ${h1("We couldn't approve your application")}
    ${p(`Hi ${escape(firstName)}, after reviewing your application we're unable to open a Ridgeford Capital Bank account for you at this time.`)}
    ${reasonRows}
    ${p("If you believe this is a mistake or you'd like us to reconsider with updated information, please contact our compliance team at <a href=\"mailto:support@ridgefordbank.eu\" style=\"color:" + BRAND.blueFg + ";text-decoration:underline;\">support@ridgefordbank.eu</a>.")}
    <p style="margin:6px 0 0 0;">${badge("Not approved", BRAND.redBg, BRAND.redFg)}</p>
    `,
    preheader: "Your Ridgeford Capital Bank application was not approved.",
  });
}

/* -------------------------- RECEIPT -------------------------------------- */

export type ReceiptPayload = {
  firstName: string;
  reference: string;
  amount: number;
  currency: string;
  beneficiaryName: string;
  beneficiaryIban?: string;
  beneficiaryBic?: string;
  beneficiaryCountry?: string;
  rail: string;
  fee?: number;
  completedAt: string;
  senderName: string;
  senderIban?: string;
  reference_note?: string;
};

export function receiptTemplate(p_: ReceiptPayload) {
  const when = (() => {
    try {
      return new Date(p_.completedAt).toLocaleString("de-DE", {
        year: "numeric",
        month: "short",
        day: "2-digit",
        hour: "2-digit",
        minute: "2-digit",
      });
    } catch {
      return p_.completedAt;
    }
  })();

  const txnRows: [string, string][] = [
    ["Reference", p_.reference],
    ["Status", "Completed"],
    ["Date", when],
    ["Method", railLabel(p_.rail)],
  ];
  if (p_.fee && p_.fee > 0) txnRows.push(["Fee", fmt(p_.fee, p_.currency)]);

  const senderRows: [string, string][] = [["Name", p_.senderName]];
  if (p_.senderIban) senderRows.push(["IBAN", p_.senderIban]);

  const benRows: [string, string][] = [["Name", p_.beneficiaryName]];
  if (p_.beneficiaryIban) benRows.push(["IBAN", p_.beneficiaryIban]);
  if (p_.beneficiaryBic) benRows.push(["BIC / SWIFT", p_.beneficiaryBic]);
  if (p_.beneficiaryCountry) benRows.push(["Country", p_.beneficiaryCountry]);
  if (p_.reference_note) benRows.push(["Reference", p_.reference_note]);

  return shell({
    accent: { color: BRAND.brand, label: "Receipt" },
    inner: `
    <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0" style="margin:4px 0 18px 0;background:linear-gradient(135deg,${BRAND.brand},${BRAND.brandDark});border-radius:14px;">
      <tr><td style="padding:20px 22px;">
        <table role="presentation" width="100%" cellspacing="0" cellpadding="0" border="0">
          <tr>
            <td style="vertical-align:middle;">
              <div style="font-size:11px;font-weight:700;letter-spacing:0.18em;text-transform:uppercase;color:rgba(255,255,255,0.75);">Official payment receipt</div>
              <div style="margin-top:6px;font-size:24px;font-weight:800;letter-spacing:-0.02em;color:#ffffff;line-height:1.1;">${escape(fmt(p_.amount, p_.currency))}</div>
              <div style="margin-top:3px;font-size:12.5px;color:rgba(255,255,255,0.8);">paid to ${escape(p_.beneficiaryName)}</div>
            </td>
            <td style="vertical-align:middle;text-align:right;">
              <img src="${LOGO_URL}" width="44" height="44" alt="Ridgeford Capital Bank" style="display:inline-block;width:44px;height:44px;border:0;border-radius:10px;" />
            </td>
          </tr>
        </table>
      </td></tr>
    </table>

    ${p(`Hi ${escape(p_.firstName)}, your transfer has settled. This is your official receipt — please keep it for your records. You can show this email or your in-app receipt as proof of payment.`)}

    ${eyebrow("Transaction")}
    ${card(txnRows)}

    ${eyebrow("From")}
    ${card(senderRows)}

    ${eyebrow("Beneficiary")}
    ${card(benRows)}

    <p style="margin:6px 0 0 0;">${badge("Settled", BRAND.greenBg, BRAND.greenFg)}</p>
    ${muted(`Receipt number ${escape(p_.reference)}. Ridgeford Capital Bank AG, Kaiserstraße 16, 60311 Frankfurt am Main — supervised by BaFin and the Deutsche Bundesbank. This receipt was generated automatically and is valid without a signature.`)}
    `,
    preheader: `Receipt ${p_.reference} — ${fmt(p_.amount, p_.currency)} to ${p_.beneficiaryName}.`,
  });
}

/* -------------------------- TRANSACTION POSTED --------------------------- */

export type TransactionPostedPayload = {
  firstName: string;
  direction: "credit" | "debit";
  amount: number;
  currency: string;
  amountFmt: string;
  counterparty?: string;
  category?: string;
  accountType: "checking" | "savings";
  description?: string;
  reference?: string;
};

export function transactionPostedTemplate(p_: TransactionPostedPayload) {
  const isCredit = p_.direction === "credit";
  const accent = isCredit ? BRAND.green : BRAND.ink700;
  const accentFg = isCredit ? BRAND.greenFg : BRAND.ink700;
  const acctLabel = p_.accountType === "savings" ? "Savings account" : "Current account";

  const rows: [string, string][] = [
    [isCredit ? "From" : "To", p_.counterparty || "—"],
    ["Account", acctLabel],
  ];
  if (p_.category) rows.push(["Category", p_.category]);
  if (p_.description) rows.push(["Description", p_.description]);
  if (p_.reference) rows.push(["Reference", p_.reference]);

  return shell({
    accent: { color: accent, label: isCredit ? "Credit" : "Debit" },
    inner: `
    ${eyebrow(isCredit ? "Money in" : "Money out", accentFg)}
    ${h1(isCredit ? `You received ${escape(p_.amountFmt)}` : `${escape(p_.amountFmt)} was debited`)}
    ${p(`Hi ${escape(p_.firstName)}, a transaction has just posted to your ${acctLabel.toLowerCase()}.`)}
    ${amountBlock(p_.amount, p_.currency, p_.counterparty ? (isCredit ? `from ${p_.counterparty}` : `to ${p_.counterparty}`) : undefined)}
    ${card(rows)}
    ${muted("If you don't recognise this activity, please contact support immediately.")}
    `,
    preheader: isCredit
      ? `You received ${p_.amountFmt}${p_.counterparty ? ` from ${p_.counterparty}` : ""}.`
      : `${p_.amountFmt} debited${p_.counterparty ? ` — ${p_.counterparty}` : ""}.`,
  });
}
