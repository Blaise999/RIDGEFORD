"use client";

import Link from "next/link";
import { useState } from "react";
import { useRouter } from "next/navigation";
import { COUNTRIES, EMPLOYMENT_STATUS } from "@/lib/kyc";
import { formatIban } from "@/lib/iban";
import { ArrowLeft, Check, ChevronDown, Copy, Loader2, RefreshCw, UserPlus } from "lucide-react";
import { cx } from "@/lib/utils";

/**
 * Open an account — in two fields.
 *
 * The first version of this screen asked for fifteen, which just moved the
 * pain of the signup form onto the desk. A name and an email is enough to open
 * an account; the password generates itself, the IBAN issues itself, and
 * everything else can be edited on the customer record afterwards.
 *
 * The extra fields still exist, folded away, for the times you happen to have
 * the details in front of you.
 */
export default function NewUserPage() {
  const router = useRouter();
  const [full_name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [balance, setBalance] = useState("");
  const [more, setMore] = useState(false);
  const [extra, setExtra] = useState<Record<string, any>>({
    password: "",
    phone: "",
    date_of_birth: "",
    country: "DE",
    street: "",
    street_number: "",
    postal_code: "",
    city: "",
    employment_status: "",
    balance_savings: "",
    iban: "",
  });

  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const [done, setDone] = useState<any>(null);
  const [copied, setCopied] = useState(false);

  const set = (k: string, v: any) => setExtra((s) => ({ ...s, [k]: v }));
  const ready = full_name.trim().length > 1 && /.+@.+\..+/.test(email);

  async function submit(e: React.FormEvent) {
    e.preventDefault();
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/admin/users/create", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ full_name, email, balance_checking: balance, ...extra }),
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Could not open the account");
      setDone(d);
    } catch (e: any) {
      setErr(e?.message || "Something went wrong");
    } finally {
      setBusy(false);
    }
  }

  if (done) {
    const creds = `Email: ${done.credentials.email}\nPassword: ${done.credentials.password}\nIBAN: ${done.user.iban}`;
    return (
      <div className="max-w-lg mx-auto pt-10">
        <div className="rounded-2xl border border-ink-200 bg-panel p-7 text-center">
          <div className="mx-auto h-14 w-14 rounded-full bg-[rgba(61,155,110,0.14)] grid place-items-center">
            <Check className="h-7 w-7 up" strokeWidth={3} />
          </div>
          <h1 className="dash-h1 mt-4 text-[24px] text-ink-900">Account open</h1>
          <p className="mt-2 text-[13.5px] text-ink-500">
            {done.user.first_name} {done.user.last_name} can sign in now.
          </p>

          <div className="mt-6 rounded-xl border border-ink-200 bg-ink-2 p-4 text-left font-mono text-[12.5px] text-ink-800 space-y-1.5">
            <div>{done.credentials.email}</div>
            <div>{done.credentials.password}</div>
            <div className="text-ink-500">{formatIban(done.user.iban)}</div>
          </div>

          <p className="mt-3 text-[11.5px] leading-relaxed text-ink-400">
            The password is shown once — it is stored hashed and cannot be read
            back. Copy it now.
          </p>

          <div className="mt-5 flex gap-2">
            <button
              onClick={() => {
                navigator.clipboard?.writeText(creds);
                setCopied(true);
                setTimeout(() => setCopied(false), 1800);
              }}
              className="btn btn-ghost h-11 flex-1"
            >
              {copied ? <Check className="h-4 w-4 up" /> : <Copy className="h-4 w-4" />}
              {copied ? "Copied" : "Copy"}
            </button>
            <button
              onClick={() => {
                setDone(null);
                setName("");
                setEmail("");
                setBalance("");
                setExtra((s) => ({ ...s, password: "", iban: "", phone: "" }));
              }}
              className="btn btn-primary h-11 flex-1"
            >
              Open another
            </button>
          </div>

          <button
            onClick={() => router.push("/admin/users")}
            className="mt-3 w-full text-[12.5px] font-semibold text-ink-500 hover:text-ink-900"
          >
            Back to customers
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-xl mx-auto pb-16">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[12.5px] font-semibold text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-3.5 w-3.5" /> Customers
      </Link>

      <h1 className="dash-h1 mt-3 text-[28px] text-ink-900">Open an account</h1>
      <p className="mt-1 text-[13px] text-ink-500">
        A name and an email is all it takes. The password and IBAN generate
        themselves, and the account is ready to sign into immediately.
      </p>

      <form onSubmit={submit} className="mt-7 space-y-4">
        {err && (
          <div className="rounded-xl border border-[rgba(196,92,92,0.35)] bg-[rgba(196,92,92,0.08)] px-4 py-3 text-[13px] down">
            {err}
          </div>
        )}

        <div className="rounded-2xl border border-ink-200 bg-panel p-5 sm:p-6 space-y-4">
          <label className="block">
            <span className="label">Full name</span>
            <input
              autoFocus
              required
              className="field h-12 text-[16px]"
              value={full_name}
              onChange={(e) => setName(e.target.value)}
              placeholder="Anna Weber"
            />
          </label>

          <label className="block">
            <span className="label">Email</span>
            <input
              type="email"
              required
              className="field h-12 text-[16px]"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="anna@example.com"
            />
          </label>

          <div className="grid sm:grid-cols-2 gap-4">
            <label className="block">
              <span className="label">Date of birth</span>
              <input
                type="date"
                className="field h-12"
                max={new Date().toISOString().slice(0, 10)}
                value={extra.date_of_birth}
                onChange={(e) => set("date_of_birth", e.target.value)}
              />
            </label>

            <label className="block">
              <span className="label">Password</span>
              <div className="flex gap-2">
                <input
                  className="field h-12 font-mono"
                  value={extra.password}
                  onChange={(e) => set("password", e.target.value)}
                  placeholder="Auto"
                />
                <button
                  type="button"
                  onClick={() => {
                    const w = ["Harbour", "Granite", "Meridian", "Lantern", "Cobalt", "Foundry"];
                    set("password", `${w[Math.floor(Math.random() * w.length)]}-${Math.floor(1000 + Math.random() * 9000)}`);
                  }}
                  className="btn btn-ghost h-12 px-3 shrink-0"
                  title="Generate a password"
                >
                  <RefreshCw className="h-4 w-4" />
                </button>
              </div>
              <span className="hint">Leave blank and one is generated.</span>
            </label>
          </div>

          <label className="block">
            <span className="label">IBAN</span>
            <input
              className="field h-12 font-mono"
              value={extra.iban}
              onChange={(e) => set("iban", formatIban(e.target.value))}
              placeholder="Leave blank to issue one automatically"
            />
            <span className="hint">
              Generated with valid mod-97 check digits if you leave it empty.
            </span>
          </label>

          <label className="block">
            <span className="label">Opening balance (optional)</span>
            <div className="relative">
              <input
                inputMode="decimal"
                className="field h-12 pr-10 text-[16px] tnum"
                value={balance}
                onChange={(e) => setBalance(e.target.value.replace(/[^0-9.]/g, ""))}
                placeholder="0"
              />
              <span className="absolute right-4 top-1/2 -translate-y-1/2 text-ink-500">€</span>
            </div>
            <span className="hint">Posted as a real &ldquo;Opening balance&rdquo; transaction.</span>
          </label>
        </div>

        {/* Everything else, out of the way until it's wanted. */}
        <div className="rounded-2xl border border-ink-200 bg-panel overflow-hidden">
          <button
            type="button"
            onClick={() => setMore((v) => !v)}
            className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-panel-2 transition"
          >
            <span>
              <span className="block text-[13.5px] font-medium text-ink-900">More details</span>
              <span className="block text-[11.5px] text-ink-400">
                Address, phone, nationality, savings — all optional
              </span>
            </span>
            <ChevronDown className={cx("h-4 w-4 text-ink-500 transition", more && "rotate-180")} />
          </button>

          {more && (
            <div className="border-t border-ink-200 p-5 space-y-4">
              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Mobile</span>
                  <input className="field" value={extra.phone} onChange={(e) => set("phone", e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Nationality</span>
                  <select className="field" value={extra.nationality || ""} onChange={(e) => set("nationality", e.target.value)}>
                    <option value="">Not stated</option>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid sm:grid-cols-[1fr_110px] gap-4">
                <label className="block">
                  <span className="label">Street</span>
                  <input className="field" value={extra.street} onChange={(e) => set("street", e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">No.</span>
                  <input className="field" value={extra.street_number} onChange={(e) => set("street_number", e.target.value)} />
                </label>
              </div>

              <div className="grid sm:grid-cols-3 gap-4">
                <label className="block">
                  <span className="label">Postal code</span>
                  <input className="field" value={extra.postal_code} onChange={(e) => set("postal_code", e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">City</span>
                  <input className="field" value={extra.city} onChange={(e) => set("city", e.target.value)} />
                </label>
                <label className="block">
                  <span className="label">Country</span>
                  <select className="field" value={extra.country} onChange={(e) => set("country", e.target.value)}>
                    {COUNTRIES.map((c) => (
                      <option key={c.code} value={c.code}>{c.name}</option>
                    ))}
                  </select>
                </label>
              </div>

              <div className="grid sm:grid-cols-2 gap-4">
                <label className="block">
                  <span className="label">Employment</span>
                  <select className="field" value={extra.employment_status} onChange={(e) => set("employment_status", e.target.value)}>
                    <option value="">Not stated</option>
                    {EMPLOYMENT_STATUS.map((o) => (
                      <option key={o.v} value={o.v}>{o.l}</option>
                    ))}
                  </select>
                </label>
                <label className="block">
                  <span className="label">Savings opening balance</span>
                  <input
                    inputMode="decimal"
                    className="field tnum"
                    value={extra.balance_savings}
                    onChange={(e) => set("balance_savings", e.target.value.replace(/[^0-9.]/g, ""))}
                    placeholder="0"
                  />
                </label>
              </div>

            </div>
          )}
        </div>

        <button type="submit" disabled={busy || !ready} className="btn btn-primary w-full h-12">
          {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : <><UserPlus className="h-4 w-4" /> Open account</>}
        </button>

        <p className="text-[11.5px] text-center text-ink-400">
          The account is yours — it appears in your customer list and nobody
          else&apos;s.
        </p>
      </form>
    </div>
  );
}
