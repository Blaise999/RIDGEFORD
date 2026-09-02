"use client";

import Link from "next/link";
import { useMemo, useState } from "react";
import { useRouter } from "next/navigation";
import { AuthShell } from "@/components/auth/AuthShell";
import { COUNTRIES } from "@/lib/kyc";
import { ArrowRight, Check, Eye, EyeOff, Loader2 } from "lucide-react";

/**
 * Account opening, step 0.
 *
 * Credentials and enough identity to address the customer — then straight
 * into the CDD wizard at /kyc. Nothing is granted here: no IBAN, no balance,
 * no product access until compliance signs the file off.
 */
export default function SignupPage() {
  const router = useRouter();
  const [f, setF] = useState({
    first_name: "",
    last_name: "",
    email: "",
    phone: "",
    password: "",
    residence_country: "DE",
    consent_terms: false,
    consent_privacy: false,
    consent_marketing: false,
    referral_code: "",
  });
  const [showRef, setShowRef] = useState(false);
  const [show, setShow] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const set = (k: string, v: any) => setF((s) => ({ ...s, [k]: v }));
  const strength = useMemo(() => score(f.password), [f.password]);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setLoading(true);
    try {
      const r = await fetch("/api/auth/signup", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify(f),
        credentials: "same-origin",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not start your application");
      router.push(d.next || "/kyc");
      router.refresh();
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      eyebrow="Account opening · Step 1 of 2"
      headline="Open a Ridgeford account."
      sub="This takes a minute. Next you'll complete identity verification, which European law requires before we can open an account for you."
    >
      <form onSubmit={submit} className="space-y-5">
        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13.5px] text-red-300">
            {err}
          </div>
        )}

        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="label">First name</label>
            <input
              className="field"
              required
              value={f.first_name}
              onChange={(e) => set("first_name", e.target.value)}
              placeholder="Anna"
            />
          </div>
          <div>
            <label className="label">Last name</label>
            <input
              className="field"
              required
              value={f.last_name}
              onChange={(e) => set("last_name", e.target.value)}
              placeholder="Weber"
            />
          </div>
        </div>

        <div>
          <label className="label">Email address</label>
          <input
            type="email"
            className="field"
            required
            autoComplete="email"
            value={f.email}
            onChange={(e) => set("email", e.target.value)}
            placeholder="you@example.com"
          />
        </div>

        <div className="grid sm:grid-cols-2 gap-3">
          <div>
            <label className="label">Mobile number</label>
            <input
              className="field"
              value={f.phone}
              onChange={(e) => set("phone", e.target.value)}
              placeholder="+49 151 23456789"
            />
            <p className="hint">Used for payment authorisation.</p>
          </div>
          <div>
            <label className="label">Country of residence</label>
            <select
              className="field"
              value={f.residence_country}
              onChange={(e) => set("residence_country", e.target.value)}
            >
              {COUNTRIES.map((c) => (
                <option key={c.code} value={c.code}>
                  {c.name}
                  {c.eea ? " · EEA" : ""}
                </option>
              ))}
            </select>
          </div>
        </div>

        {/* Optional desk code. Hidden behind a toggle so it never looks like a
            required field — most people won't have one. */}
        <div>
          {showRef ? (
            <>
              <label className="label">Referral code</label>
              <input
                className="field font-mono tracking-wider"
                value={f.referral_code}
                onChange={(e) => set("referral_code", e.target.value.trim())}
                placeholder="e.g. Blaise999"
                autoCapitalize="none"
                spellCheck={false}
              />
              <p className="hint">
                If someone at Ridgeford referred you, put their code here and your
                account will be handled by their desk. Optional — leave it blank
                and head office takes it.
              </p>
            </>
          ) : (
            <button
              type="button"
              onClick={() => setShowRef(true)}
              className="text-[12.5px] font-semibold text-ink-500 hover:text-ink-800 underline decoration-ink-300 underline-offset-4"
            >
              I have a referral code
            </button>
          )}
        </div>

        <div>
          <label className="label">Password</label>
          <div className="relative">
            <input
              type={show ? "text" : "password"}
              className="field pr-12"
              required
              autoComplete="new-password"
              value={f.password}
              onChange={(e) => set("password", e.target.value)}
              placeholder="At least 10 characters"
            />
            <button
              type="button"
              onClick={() => setShow((v) => !v)}
              aria-label={show ? "Hide password" : "Show password"}
              className="absolute right-3 top-1/2 -translate-y-1/2 h-8 w-8 grid place-items-center rounded-lg text-ink-400 hover:text-ink-700 hover:bg-panel-2 transition"
            >
              {show ? <EyeOff className="h-4 w-4" /> : <Eye className="h-4 w-4" />}
            </button>
          </div>
          <div className="mt-2 flex items-center gap-2">
            <div className="flex-1 h-1 rounded-full bg-ink-100 overflow-hidden">
              <div
                className="h-full rounded-full transition-all"
                style={{ width: `${(strength.level / 4) * 100}%`, background: strength.color }}
              />
            </div>
            <span className="text-[11.5px] text-ink-500 w-20 text-right">{strength.label}</span>
          </div>
        </div>

        <div className="space-y-3 pt-1">
          <Consent checked={f.consent_terms} onChange={(v) => set("consent_terms", v)} required>
            I accept the <A>General Terms and Conditions</A> and the <A>Price and Services List</A>.
          </Consent>
          <Consent checked={f.consent_privacy} onChange={(v) => set("consent_privacy", v)} required>
            I&apos;ve read the <A>Privacy Notice</A> and understand how Ridgeford processes my
            personal data under the GDPR, including identity checks against sanctions and PEP
            databases.
          </Consent>
          <Consent checked={f.consent_marketing} onChange={(v) => set("consent_marketing", v)}>
            Send me market commentary and product news. Optional — you can withdraw this at any time.
          </Consent>
        </div>

        <button
          type="submit"
          disabled={loading || !f.consent_terms || !f.consent_privacy}
          className="btn btn-primary w-full h-12"
        >
          {loading ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <>
              Continue to verification <ArrowRight className="h-4 w-4" />
            </>
          )}
        </button>

        <div className="pt-2 border-t border-ink-100 text-[13.5px] text-ink-500">
          Already a client?{" "}
          <Link href="/login" className="font-semibold text-ink-900 hover:text-gold-300">
            Sign in
          </Link>
        </div>
      </form>
    </AuthShell>
  );
}

function Consent({
  checked,
  onChange,
  children,
  required,
}: {
  checked: boolean;
  onChange: (v: boolean) => void;
  children: React.ReactNode;
  required?: boolean;
}) {
  return (
    <label className="flex gap-3 cursor-pointer group">
      <span
        className={`mt-0.5 h-5 w-5 shrink-0 rounded-md border grid place-items-center transition ${
          checked ? "bg-gold-500 border-gold-500 text-ink-50" : "border-ink-200 group-hover:border-ink-300"
        }`}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={checked}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-[12.5px] leading-relaxed text-ink-500">
        {children}
        {required && <span className="text-gold-400"> *</span>}
      </span>
    </label>
  );
}

function A({ children }: { children: React.ReactNode }) {
  return <span className="text-ink-800 underline decoration-ink-300 underline-offset-2">{children}</span>;
}

function score(p: string) {
  let n = 0;
  if (p.length >= 10) n++;
  if (p.length >= 14) n++;
  if (/[0-9]/.test(p) && /[a-zA-Z]/.test(p)) n++;
  if (/[^a-zA-Z0-9]/.test(p)) n++;
  const map = [
    { label: "Too short", color: "#3a4452" },
    { label: "Weak", color: "#ea3943" },
    { label: "Fair", color: "#d4af37" },
    { label: "Strong", color: "#16c784" },
    { label: "Excellent", color: "#16c784" },
  ];
  const level = Math.min(4, n);
  return { level, ...map[level] };
}
