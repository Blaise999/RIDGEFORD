"use client";

import { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { Logo } from "@/components/landing/Logo";
import LogoutButton from "@/components/auth/LogoutButton";
import {
  ACCOUNT_PURPOSE,
  COUNTRIES,
  CRYPTO_EXPERIENCE,
  DOCUMENT_KINDS,
  EMPLOYMENT_STATUS,
  GENDERS,
  ID_DOCUMENT_TYPES,
  INCOME_BANDS,
  INDUSTRIES,
  KYC_STEPS,
  NET_WORTH_BANDS,
  SOURCE_OF_FUNDS,
  TITLES,
  TURNOVER_BANDS,
  tinLabel,
  countryName,
  validateStep,
  type KycStepKey,
} from "@/lib/kyc";
import {
  Area,
  Block,
  CheckRow,
  ChipGroup,
  CountrySelect,
  Field,
  Select,
  Text,
  YesNo,
} from "@/components/kyc/Fields";
import { cx } from "@/lib/utils";
import {
  AlertTriangle,
  ArrowLeft,
  ArrowRight,
  Check,
  FileCheck2,
  Loader2,
  Lock,
  ShieldCheck,
  Trash2,
  Upload,
} from "lucide-react";

/**
 * Customer due diligence, the way a European bank actually runs it:
 * identity → residence → tax residency (CRS/FATCA) → finances →
 * expected activity → PEP & sanctions declarations → documents →
 * signature. Every step is re-validated server-side on submit.
 */
export default function KycWizard() {
  const router = useRouter();
  const [d, setD] = useState<Record<string, any>>({});
  const [docs, setDocs] = useState<any[]>([]);
  const [step, setStep] = useState(0);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [banner, setBanner] = useState<string | null>(null);
  const [infoRequest, setInfoRequest] = useState<string | null>(null);
  const topRef = useRef<HTMLDivElement>(null);

  const set = useCallback((k: string, v: any) => {
    setD((s) => ({ ...s, [k]: v }));
    setErrors((e) => (e[k] ? { ...e, [k]: "" } : e));
  }, []);

  // ── load draft ───────────────────────────────────────────────────────────
  useEffect(() => {
    (async () => {
      try {
        const r = await fetch("/api/kyc", { credentials: "same-origin" });
        const j = await r.json();
        if (j?.ok) {
          const app = j.application || {};
          if (app.status === "submitted" || app.status === "in_review") {
            router.replace("/pending-review");
            return;
          }
          if (app.status === "approved") {
            router.replace("/dashboard");
            return;
          }
          setD({
            ...app,
            legal_first_name: app.legal_first_name || j.user?.first_name || "",
            legal_last_name: app.legal_last_name || j.user?.last_name || "",
            phone: app.phone || j.user?.phone || "",
          });
          setDocs(j.documents || []);
          setInfoRequest(app.status === "more_info" ? app.info_request : null);
          const saved = Number(app.step) || 1;
          setStep(Math.min(KYC_STEPS.length - 1, Math.max(0, saved - 1)));
        }
      } catch {
        setBanner("We couldn't load your saved progress. You can still continue.");
      } finally {
        setLoading(false);
      }
    })();
  }, [router]);

  const uploadedKinds = useMemo(() => docs.map((x) => x.kind), [docs]);
  const current = KYC_STEPS[step];

  const draftWithDocs = useMemo(() => ({ ...d, __uploaded: uploadedKinds }), [d, uploadedKinds]);

  async function save(nextStep?: number) {
    setSaving(true);
    try {
      await fetch("/api/kyc", {
        method: "PATCH",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({ ...d, step: (nextStep ?? step) + 1 }),
      });
    } catch {
      /* draft saving is best-effort; the customer never loses the form itself */
    } finally {
      setSaving(false);
    }
  }

  function goTo(n: number) {
    setStep(n);
    setErrors({});
    topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
  }

  async function next() {
    const e = validateStep(current.key as KycStepKey, draftWithDocs);
    setErrors(e);
    if (Object.keys(e).length) {
      topRef.current?.scrollIntoView({ behavior: "smooth", block: "start" });
      return;
    }
    if (step === KYC_STEPS.length - 1) return submit();
    await save(step + 1);
    goTo(step + 1);
  }

  /**
   * Any document the vault refused earlier is sent again now. The server
   * re-checks every step on submit, so a file that only ever existed in the
   * browser would be rejected there — retrying here is what makes the
   * optimistic upload honest rather than a lie the user discovers late.
   */
  async function flushPendingUploads(): Promise<string[]> {
    const pending = docs.filter((x) => x?.pending_sync && x?.file);
    if (!pending.length) return [];

    const stillFailing: string[] = [];
    for (const rec of pending) {
      try {
        const fd = new FormData();
        fd.append("file", rec.file);
        fd.append("kind", rec.kind);
        const r = await fetch("/api/kyc/upload", {
          method: "POST",
          body: fd,
          credentials: "same-origin",
        });
        const j = await r.json().catch(() => ({}));
        if (!r.ok || !j.ok) throw new Error(j.error || "Upload failed");
        setDocs((cur) => [
          ...cur.filter((x) => x.kind !== rec.kind),
          { ...j.document, preview: rec.preview },
        ]);
      } catch {
        stillFailing.push(rec.kind);
      }
    }
    return stillFailing;
  }

  async function submit() {
    setSubmitting(true);
    setBanner(null);
    try {
      const failed = await flushPendingUploads();
      if (failed.length) {
        setBanner(
          `We couldn't upload ${failed.length === 1 ? "one of your documents" : "some of your documents"}. Check your connection and try submitting again — nothing else you've entered is lost.`
        );
        topRef.current?.scrollIntoView({ behavior: "smooth" });
        return;
      }

      const r = await fetch("/api/kyc", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify(d),
      });
      const j = await r.json();
      if (!r.ok || !j.ok) {
        if (j?.errors) {
          setErrors(j.errors);
          setBanner("Some details are still missing — check the highlighted steps.");
        } else {
          setBanner(j?.error || "We couldn't submit your application.");
        }
        topRef.current?.scrollIntoView({ behavior: "smooth" });
        return;
      }
      router.push("/pending-review");
      router.refresh();
    } catch (e: any) {
      setBanner(e?.message || "We couldn't submit your application.");
    } finally {
      setSubmitting(false);
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-ink-50 grid place-items-center">
        <Loader2 className="h-6 w-6 animate-spin text-gold-400" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-ink-50">
      <header className="sticky top-0 z-30 h-16 px-5 sm:px-8 flex items-center justify-between bg-ink-50/90 backdrop-blur border-b border-ink-100">
        <Logo />
        <div className="flex items-center gap-4">
          <span className="hidden sm:inline-flex items-center gap-1.5 text-[11px] font-semibold uppercase tracking-[0.16em] text-ink-500">
            <Lock className="h-3.5 w-3.5 text-gold-400" />
            {saving ? "Saving…" : "Progress saved"}
          </span>
          <LogoutButton />
        </div>
      </header>

      <div className="mx-auto max-w-6xl px-5 sm:px-8 py-8 lg:py-12 grid lg:grid-cols-[260px_minmax(0,1fr)] gap-8 lg:gap-12">
        {/* ── step rail ───────────────────────────────────────────────── */}
        <nav className="lg:sticky lg:top-24 lg:self-start">
          <div className="text-[11px] font-bold uppercase tracking-[0.22em] text-gold-400">
            Identity verification
          </div>
          <p className="mt-2 text-[12.5px] leading-relaxed text-ink-500">
            Required of every EU bank before an account can be opened.
          </p>

          <ol className="mt-6 space-y-1">
            {KYC_STEPS.map((s, i) => {
              const done = i < step;
              const active = i === step;
              return (
                <li key={s.key}>
                  <button
                    onClick={() => i <= step && goTo(i)}
                    disabled={i > step}
                    className={cx(
                      "w-full flex items-start gap-3 rounded-xl px-3 py-2.5 text-left transition",
                      active ? "bg-panel-2 ring-1 ring-gold-500/25" : "hover:bg-panel-2/60",
                      i > step && "opacity-45 cursor-not-allowed"
                    )}
                  >
                    <span
                      className={cx(
                        "mt-px h-6 w-6 shrink-0 rounded-full grid place-items-center text-[11px] font-bold",
                        done
                          ? "bg-up/15 text-up"
                          : active
                          ? "bg-gold-500 text-ink-50"
                          : "bg-ink-100 text-ink-500"
                      )}
                    >
                      {done ? <Check className="h-3.5 w-3.5" strokeWidth={3} /> : i + 1}
                    </span>
                    <span className="min-w-0">
                      <span
                        className={cx(
                          "block text-[13.5px] font-semibold",
                          active ? "text-ink-900" : "text-ink-600"
                        )}
                      >
                        {s.title}
                      </span>
                      <span className="block text-[11.5px] text-ink-400 leading-snug">{s.blurb}</span>
                    </span>
                  </button>
                </li>
              );
            })}
          </ol>

          <div className="mt-6 rounded-xl border border-ink-200 bg-panel/60 p-4">
            <div className="flex items-center gap-2 text-[11.5px] font-semibold text-ink-700">
              <ShieldCheck className="h-4 w-4 text-gold-400" />
              How we use this
            </div>
            <p className="mt-2 text-[11.5px] leading-relaxed text-ink-500">
              Your answers are processed under GDPR Art. 6(1)(c) — a legal
              obligation under anti-money-laundering law — and retained for
              five years after the relationship ends. Documents are stored
              encrypted and are never public.
            </p>
          </div>
        </nav>

        {/* ── step body ───────────────────────────────────────────────── */}
        <main ref={topRef} className="min-w-0">
          <div className="card p-6 sm:p-8">
            <div className="text-[11px] font-bold uppercase tracking-[0.2em] text-ink-500">
              Step {step + 1} of {KYC_STEPS.length}
            </div>
            <h1 className="mt-2 font-display text-[30px] sm:text-[36px] leading-tight tracking-tight text-ink-900">
              {current.title}
            </h1>

            {infoRequest && (
              <div className="mt-5 rounded-xl border border-amber-500/30 bg-amber-500/10 p-4">
                <div className="flex items-center gap-2 text-[12.5px] font-bold text-amber-300">
                  <AlertTriangle className="h-4 w-4" /> Compliance needs more from you
                </div>
                <p className="mt-1.5 text-[13px] leading-relaxed text-ink-700">{infoRequest}</p>
              </div>
            )}

            {banner && (
              <div className="mt-5 rounded-xl border border-red-500/30 bg-red-500/10 px-4 py-3 text-[13px] text-red-300">
                {banner}
              </div>
            )}

            <div className="mt-7 space-y-8">
              <StepBody
                stepKey={current.key as KycStepKey}
                d={d}
                set={set}
                errors={errors}
                docs={docs}
                setDocs={setDocs}
                goTo={goTo}
              />
            </div>

            <div className="mt-9 pt-6 border-t border-ink-100 flex items-center justify-between gap-3">
              <button
                onClick={() => (step === 0 ? router.push("/login") : goTo(step - 1))}
                className="btn btn-ghost h-11"
                type="button"
              >
                <ArrowLeft className="h-4 w-4" />
                Back
              </button>

              <button onClick={next} disabled={submitting} className="btn btn-primary h-11" type="button">
                {submitting ? (
                  <Loader2 className="h-4 w-4 animate-spin" />
                ) : step === KYC_STEPS.length - 1 ? (
                  <>
                    <FileCheck2 className="h-4 w-4" /> Sign &amp; submit
                  </>
                ) : (
                  <>
                    Continue <ArrowRight className="h-4 w-4" />
                  </>
                )}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  );
}

/* ── step content ─────────────────────────────────────────────────────── */

function StepBody({
  stepKey,
  d,
  set,
  errors,
  docs,
  setDocs,
  goTo,
}: {
  stepKey: KycStepKey;
  d: Record<string, any>;
  set: (k: string, v: any) => void;
  errors: Record<string, string>;
  docs: any[];
  setDocs: React.Dispatch<React.SetStateAction<any[]>>;
  goTo: (n: number) => void;
}) {
  const e = errors;

  if (stepKey === "identity") {
    return (
      <>
        <Block
          title="Legal identity"
          note="Enter your details exactly as they appear on the ID you'll upload later. Mismatches are the number one reason applications get delayed."
        >
          <div className="grid sm:grid-cols-[120px_1fr_1fr] gap-4">
            <Field label="Title">
              <Select
                value={d.title}
                onChange={(v) => set("title", v)}
                options={TITLES.map((t) => ({ v: t, l: t }))}
              />
            </Field>
            <Field label="First name" required error={e.legal_first_name}>
              <Text value={d.legal_first_name} onChange={(v) => set("legal_first_name", v)} error={e.legal_first_name} />
            </Field>
            <Field label="Last name" required error={e.legal_last_name}>
              <Text value={d.legal_last_name} onChange={(v) => set("legal_last_name", v)} error={e.legal_last_name} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Middle name(s)" hint="Leave blank if none.">
              <Text value={d.legal_middle_name} onChange={(v) => set("legal_middle_name", v)} />
            </Field>
            <Field label="Name at birth" hint="Only if different from your current name.">
              <Text value={d.birth_name} onChange={(v) => set("birth_name", v)} />
            </Field>
          </div>
        </Block>

        <Block title="Birth & nationality">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Date of birth" required error={e.date_of_birth}>
              <Text type="date" value={d.date_of_birth} onChange={(v) => set("date_of_birth", v)} error={e.date_of_birth} />
            </Field>
            <Field label="Gender">
              <Select value={d.gender} onChange={(v) => set("gender", v)} options={GENDERS} />
            </Field>
            <Field label="Place of birth" required error={e.place_of_birth} hint="Town or city.">
              <Text value={d.place_of_birth} onChange={(v) => set("place_of_birth", v)} error={e.place_of_birth} />
            </Field>
            <Field label="Country of birth" required error={e.country_of_birth}>
              <CountrySelect value={d.country_of_birth} onChange={(v) => set("country_of_birth", v)} error={e.country_of_birth} />
            </Field>
            <Field label="Nationality" required error={e.nationality}>
              <CountrySelect value={d.nationality} onChange={(v) => set("nationality", v)} error={e.nationality} />
            </Field>
            <Field label="Second nationality" hint="If you hold more than one passport.">
              <CountrySelect value={d.second_nationality} onChange={(v) => set("second_nationality", v)} placeholder="None" />
            </Field>
          </div>
        </Block>

        <Block title="Contact">
          <Field
            label="Mobile number"
            required
            error={e.phone}
            hint="Include the country code. We use this to authorise payments."
            className="sm:max-w-sm"
          >
            <Text value={d.phone} onChange={(v) => set("phone", v)} error={e.phone} placeholder="+49 151 23456789" />
          </Field>
        </Block>
      </>
    );
  }

  if (stepKey === "address") {
    return (
      <>
        <Block
          title="Residential address"
          note="Your actual home address — not a PO box, a company address, or a care-of address. You'll upload proof of it later."
        >
          <Field label="Country of residence" required error={e.residence_country} className="sm:max-w-sm">
            <CountrySelect value={d.residence_country} onChange={(v) => set("residence_country", v)} error={e.residence_country} />
          </Field>

          <div className="grid sm:grid-cols-[1fr_140px] gap-4">
            <Field label="Street" required error={e.street}>
              <Text value={d.street} onChange={(v) => set("street", v)} error={e.street} />
            </Field>
            <Field label="Number" required error={e.street_number}>
              <Text value={d.street_number} onChange={(v) => set("street_number", v)} error={e.street_number} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-3 gap-4">
            <Field label="Additional address line" hint="Flat, floor, c/o.">
              <Text value={d.address_extra} onChange={(v) => set("address_extra", v)} />
            </Field>
            <Field label="Postal code" required error={e.postal_code}>
              <Text value={d.postal_code} onChange={(v) => set("postal_code", v)} error={e.postal_code} />
            </Field>
            <Field label="City" required error={e.city}>
              <Text value={d.city} onChange={(v) => set("city", v)} error={e.city} />
            </Field>
          </div>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="State / region">
              <Text value={d.region} onChange={(v) => set("region", v)} />
            </Field>
            <Field
              label="Living here since"
              required
              error={e.resident_since}
              hint="Month and year is enough."
            >
              {/*
                A month input speaks YYYY-MM. The database column is a DATE, so
                we store YYYY-MM-01 — but we must feed the input back only the
                YYYY-MM part, or the browser rejects the value it was just
                given and the field fights the user on every keystroke.
              */}
              <Text
                type="month"
                max={new Date().toISOString().slice(0, 7)}
                value={String(d.resident_since || "").slice(0, 7)}
                onChange={(v) => set("resident_since", v ? `${v}-01` : "")}
                error={e.resident_since}
              />
            </Field>
          </div>

          <Field
            label="Previous address"
            hint="Only if you've lived at your current address for less than 12 months."
          >
            <Area value={d.previous_address} onChange={(v) => set("previous_address", v)} rows={2} />
          </Field>
        </Block>
      </>
    );
  }

  if (stepKey === "tax") {
    return (
      <>
        <Block
          title="Tax residency self-certification"
          note="Under the Common Reporting Standard (DAC2) we're required to establish where you're tax resident and report balances to that country's tax authority."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Country of tax residence" required error={e.tax_residence_country}>
              <CountrySelect value={d.tax_residence_country} onChange={(v) => set("tax_residence_country", v)} error={e.tax_residence_country} />
            </Field>
            <Field
              label={tinLabel(d.tax_residence_country).name}
              error={e.tax_id}
              hint={tinLabel(d.tax_residence_country).hint}
            >
              <Text value={d.tax_id} onChange={(v) => set("tax_id", v)} error={e.tax_id} />
            </Field>
          </div>

          <Field
            label="If you have no TIN, why not?"
            hint="For example: my country doesn't issue TINs, or I'm not required to have one."
          >
            <Text value={d.tin_unavailable_reason} onChange={(v) => set("tin_unavailable_reason", v)} />
          </Field>
        </Block>

        <Block title="Second tax residence" note="Only if you're tax resident in more than one country.">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Second country of tax residence">
              <CountrySelect value={d.second_tax_residence} onChange={(v) => set("second_tax_residence", v)} placeholder="None" />
            </Field>
            <Field label="TIN for that country" error={e.second_tax_id}>
              <Text value={d.second_tax_id} onChange={(v) => set("second_tax_id", v)} error={e.second_tax_id} />
            </Field>
          </div>
        </Block>

        <Block
          title="FATCA — US person status"
          note="A US person includes US citizens (including dual nationals), green-card holders, and anyone tax resident in the United States."
        >
          <Field label="Are you a US person for tax purposes?" required error={e.us_person}>
            <YesNo value={d.us_person} onChange={(v) => set("us_person", v)} error={e.us_person} />
          </Field>
          {d.us_person === true && (
            <Field label="US TIN / SSN" required error={e.us_tin} className="sm:max-w-sm">
              <Text value={d.us_tin} onChange={(v) => set("us_tin", v)} error={e.us_tin} />
            </Field>
          )}
        </Block>
      </>
    );
  }

  if (stepKey === "financial") {
    const employed = ["employed", "self_employed", "business_owner"].includes(d.employment_status);
    return (
      <>
        <Block title="Employment">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Employment status" required error={e.employment_status}>
              <Select value={d.employment_status} onChange={(v) => set("employment_status", v)} options={EMPLOYMENT_STATUS} error={e.employment_status} />
            </Field>
            {employed && (
              <>
                <Field label="Job title / occupation" required error={e.occupation}>
                  <Text value={d.occupation} onChange={(v) => set("occupation", v)} error={e.occupation} />
                </Field>
                <Field label="Industry" required error={e.industry}>
                  <Select value={d.industry} onChange={(v) => set("industry", v)} options={INDUSTRIES.map((i) => ({ v: i, l: i }))} error={e.industry} />
                </Field>
                <Field label={d.employment_status === "employed" ? "Employer" : "Business name"} required={d.employment_status === "employed"} error={e.employer_name}>
                  <Text value={d.employer_name} onChange={(v) => set("employer_name", v)} error={e.employer_name} />
                </Field>
                <Field label="Country of employer / business">
                  <CountrySelect value={d.employer_country} onChange={(v) => set("employer_country", v)} placeholder="Same as residence" />
                </Field>
              </>
            )}
          </div>
        </Block>

        <Block title="Income & wealth">
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Gross annual income" required error={e.annual_income_band}>
              <Select value={d.annual_income_band} onChange={(v) => set("annual_income_band", v)} options={INCOME_BANDS} error={e.annual_income_band} />
            </Field>
            <Field label="Estimated total net worth" required error={e.net_worth_band}>
              <Select value={d.net_worth_band} onChange={(v) => set("net_worth_band", v)} options={NET_WORTH_BANDS} error={e.net_worth_band} />
            </Field>
          </div>

          <Field
            label="Source of the funds you'll pay in"
            required
            error={e.source_of_funds}
            hint="Select everything that applies."
          >
            <ChipGroup value={d.source_of_funds} onChange={(v) => set("source_of_funds", v)} options={SOURCE_OF_FUNDS} error={e.source_of_funds} />
          </Field>

          <Field label="Any detail you'd like to add about those funds">
            <Text value={d.source_of_funds_detail} onChange={(v) => set("source_of_funds_detail", v)} />
          </Field>

          <Field
            label="Source of wealth"
            required
            error={e.source_of_wealth}
            hint="How your overall wealth was built up over time — this is a different question from where a single payment comes from."
          >
            <Area
              value={d.source_of_wealth}
              onChange={(v) => set("source_of_wealth", v)}
              error={e.source_of_wealth}
              rows={3}
              placeholder="e.g. Fifteen years of salaried employment as a software engineer, plus proceeds from selling a flat in Leipzig in 2021."
            />
          </Field>
        </Block>
      </>
    );
  }

  if (stepKey === "activity") {
    return (
      <>
        <Block
          title="How you'll use the account"
          note="This sets the baseline we monitor against. If your activity later looks very different, we may need to ask about it."
        >
          <Field label="What will you use the account for?" required error={e.account_purpose}>
            <ChipGroup value={d.account_purpose} onChange={(v) => set("account_purpose", v)} options={ACCOUNT_PURPOSE} error={e.account_purpose} />
          </Field>

          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Expected money in, per month" required error={e.expected_monthly_inflow}>
              <Select value={d.expected_monthly_inflow} onChange={(v) => set("expected_monthly_inflow", v)} options={TURNOVER_BANDS} error={e.expected_monthly_inflow} />
            </Field>
            <Field label="Expected money out, per month" required error={e.expected_monthly_outflow}>
              <Select value={d.expected_monthly_outflow} onChange={(v) => set("expected_monthly_outflow", v)} options={TURNOVER_BANDS} error={e.expected_monthly_outflow} />
            </Field>
          </div>

          <Field
            label="Countries you'll regularly send money to or receive from"
            hint="Leave empty if you'll only transact within the EEA."
          >
            <ChipGroup
              value={d.expected_countries}
              onChange={(v) => set("expected_countries", v)}
              options={COUNTRIES.filter((c) => c.code !== "OTHER").slice(0, 40).map((c) => ({ v: c.code, l: c.name }))}
            />
          </Field>
        </Block>

        <Block
          title="Digital assets"
          note="The Ridgeford crypto desk is covered by the same suitability rules as our other investment products."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Your experience with digital assets" required error={e.crypto_experience}>
              <Select value={d.crypto_experience} onChange={(v) => set("crypto_experience", v)} options={CRYPTO_EXPERIENCE} error={e.crypto_experience} />
            </Field>
            <Field label="Expected crypto activity per month">
              <Select value={d.expected_crypto_volume} onChange={(v) => set("expected_crypto_volume", v)} options={TURNOVER_BANDS} />
            </Field>
          </div>
        </Block>
      </>
    );
  }

  if (stepKey === "declarations") {
    return (
      <>
        <Block
          title="Politically exposed persons"
          note="A PEP is someone who holds, or has held in the last 12 months, a prominent public function — head of state, minister, senior judge, central bank board, ambassador, senior military officer, board member of a state-owned enterprise, or a senior political party official."
        >
          <Field label="Are you, or have you recently been, a PEP?" required error={e.is_pep}>
            <YesNo value={d.is_pep} onChange={(v) => set("is_pep", v)} error={e.is_pep} />
          </Field>

          {d.is_pep === true && (
            <div className="grid sm:grid-cols-3 gap-4">
              <Field label="Function held" required error={e.pep_role} className="sm:col-span-2">
                <Text value={d.pep_role} onChange={(v) => set("pep_role", v)} error={e.pep_role} />
              </Field>
              <Field label="Country" required error={e.pep_country}>
                <CountrySelect value={d.pep_country} onChange={(v) => set("pep_country", v)} error={e.pep_country} />
              </Field>
              <Field label="Held since / until" className="sm:col-span-3">
                <Text value={d.pep_since} onChange={(v) => set("pep_since", v)} placeholder="e.g. 2019 – present" />
              </Field>
            </div>
          )}

          <Field label="Is an immediate family member or close associate of yours a PEP?" required>
            <YesNo value={d.associate_pep} onChange={(v) => set("associate_pep", v)} />
          </Field>

          {d.associate_pep === true && (
            <Field label="Their relationship to you, and the function they hold" required error={e.associate_pep_detail}>
              <Area value={d.associate_pep_detail} onChange={(v) => set("associate_pep_detail", v)} error={e.associate_pep_detail} rows={2} />
            </Field>
          )}
        </Block>

        <Block
          title="Beneficial ownership"
          note="We have to know whether the money in this account will really be yours."
        >
          <Field label="Are you opening this account for yourself, on your own behalf?" required>
            <YesNo
              value={d.acting_own_behalf === undefined ? true : d.acting_own_behalf}
              onChange={(v) => set("acting_own_behalf", v)}
              yes="Yes, for myself"
              no="No, for someone else"
            />
          </Field>
          {d.acting_own_behalf === false && (
            <Field
              label="Who is the beneficial owner?"
              required
              error={e.third_party_detail}
              hint="Full name, date of birth, address and their relationship to you."
            >
              <Area value={d.third_party_detail} onChange={(v) => set("third_party_detail", v)} error={e.third_party_detail} rows={3} />
            </Field>
          )}
        </Block>

        <Block title="Sanctions & criminal declarations">
          <div className="space-y-1">
            <CheckRow
              checked={d.sanctions_declaration}
              onChange={(v) => set("sanctions_declaration", v)}
              error={e.sanctions_declaration}
            >
              I confirm that neither I, nor anyone who will benefit from this account, is
              subject to financial sanctions imposed by the European Union, the United
              Nations, the United Kingdom or OFAC, and that I am not resident in a
              comprehensively sanctioned territory.
            </CheckRow>
            <CheckRow
              checked={d.criminal_declaration}
              onChange={(v) => set("criminal_declaration", v)}
              error={e.criminal_declaration}
            >
              I confirm that I have not been convicted of, and am not currently under
              investigation for, money laundering, terrorist financing, tax evasion, fraud
              or any other financial crime.
            </CheckRow>
          </div>
        </Block>
      </>
    );
  }

  if (stepKey === "documents") {
    return (
      <>
        <Block
          title="Identity document"
          note="Details must match the document you upload below, exactly."
        >
          <div className="grid sm:grid-cols-2 gap-4">
            <Field label="Document type" required error={e.id_document_type}>
              <Select value={d.id_document_type} onChange={(v) => set("id_document_type", v)} options={ID_DOCUMENT_TYPES} error={e.id_document_type} />
            </Field>
            <Field label="Document number" required error={e.id_document_number}>
              <Text value={d.id_document_number} onChange={(v) => set("id_document_number", v)} error={e.id_document_number} />
            </Field>
            <Field label="Issuing country" required error={e.id_issuing_country}>
              <CountrySelect value={d.id_issuing_country} onChange={(v) => set("id_issuing_country", v)} error={e.id_issuing_country} />
            </Field>
            <Field label="Issuing authority" hint="As printed on the document.">
              <Text value={d.id_issuing_authority} onChange={(v) => set("id_issuing_authority", v)} />
            </Field>
            <Field label="Date of issue">
              <Text type="date" value={d.id_issue_date} onChange={(v) => set("id_issue_date", v)} />
            </Field>
            <Field label="Expiry date" required error={e.id_expiry_date}>
              <Text type="date" value={d.id_expiry_date} onChange={(v) => set("id_expiry_date", v)} error={e.id_expiry_date} />
            </Field>
          </div>
        </Block>

        <Block
          title="Uploads"
          note="JPG, PNG or PDF, up to 12 MB each. Files are stored encrypted in a private vault and are only visible to our compliance team."
        >
          <div className="space-y-3">
            {DOCUMENT_KINDS.map((doc) => (
              <UploadRow
                key={doc.kind}
                doc={doc}
                existing={docs.find((x) => x.kind === doc.kind)}
                error={e[doc.kind]}
                onChange={(rec, removed) => {
                  // Functional updater: the optimistic record and the server
                  // record land back to back, and a stale closure would drop
                  // one of them.
                  setDocs((cur) =>
                    removed
                      ? cur.filter((x) => x.kind !== doc.kind)
                      : [...cur.filter((x) => x.kind !== doc.kind), rec]
                  );
                }}
              />
            ))}
          </div>
        </Block>
      </>
    );
  }

  // ── review ──────────────────────────────────────────────────────────────
  const rows: [string, any, number][] = [
    ["Legal name", [d.title, d.legal_first_name, d.legal_middle_name, d.legal_last_name].filter(Boolean).join(" "), 0],
    ["Date of birth", d.date_of_birth, 0],
    ["Born in", [d.place_of_birth, countryName(d.country_of_birth)].filter(Boolean).join(", "), 0],
    ["Nationality", countryName(d.nationality), 0],
    ["Mobile", d.phone, 0],
    ["Address", [d.street, d.street_number, d.postal_code, d.city, countryName(d.residence_country)].filter(Boolean).join(" · "), 1],
    ["Tax residence", `${countryName(d.tax_residence_country)}${d.tax_id ? ` · TIN ${d.tax_id}` : ""}`, 2],
    ["US person", d.us_person ? "Yes" : "No", 2],
    ["Employment", EMPLOYMENT_STATUS.find((x) => x.v === d.employment_status)?.l, 3],
    ["Income", INCOME_BANDS.find((x) => x.v === d.annual_income_band)?.l, 3],
    ["Source of funds", (Array.isArray(d.source_of_funds) ? d.source_of_funds : []).map((v: string) => SOURCE_OF_FUNDS.find((s) => s.v === v)?.l).filter(Boolean).join(", "), 3],
    ["Expected turnover", TURNOVER_BANDS.find((x) => x.v === d.expected_monthly_inflow)?.l, 4],
    ["PEP", d.is_pep ? "Yes" : "No", 5],
    ["Acting for", d.acting_own_behalf === false ? "A third party" : "Myself", 5],
    ["ID document", [ID_DOCUMENT_TYPES.find((x) => x.v === d.id_document_type)?.l, d.id_document_number].filter(Boolean).join(" · "), 6],
  ];

  return (
    <>
      <Block title="Check your answers" note="Tap any row to go back and change it.">
        <div className="rounded-xl border border-ink-200 divide-y divide-ink-100 overflow-hidden">
          {rows.map(([label, value, jump]) => (
            <button
              key={label}
              type="button"
              onClick={() => goTo(jump)}
              className="w-full flex items-start justify-between gap-4 px-4 py-3 text-left hover:bg-panel-2/60 transition"
            >
              <span className="text-[12.5px] text-ink-500 shrink-0 w-36">{label}</span>
              <span className="text-[13px] font-medium text-ink-900 text-right break-words">
                {value || <span className="text-ink-400">—</span>}
              </span>
            </button>
          ))}
        </div>
      </Block>

      <Block title="Declarations & consents">
        <div className="space-y-1">
          <CheckRow checked={d.consent_terms} onChange={(v) => set("consent_terms", v)} error={e.consent_terms}>
            I accept the General Terms and Conditions, the Price and Services List, and the
            deposit protection information sheet.
          </CheckRow>
          <CheckRow checked={d.consent_privacy} onChange={(v) => set("consent_privacy", v)} error={e.consent_privacy}>
            I have read the Privacy Notice. I understand Ridgeford will verify my identity
            against sanctions, PEP and adverse-media databases, and will retain my data for
            five years after our relationship ends, as anti-money-laundering law requires.
          </CheckRow>
          <CheckRow checked={d.consent_crs_fatca} onChange={(v) => set("consent_crs_fatca", v)} error={e.consent_crs_fatca}>
            I certify that the tax residency information above is correct and complete, and
            I undertake to inform Ridgeford within 30 days if it changes (CRS/DAC2 and FATCA
            self-certification).
          </CheckRow>
          <CheckRow checked={d.consent_credit_check} onChange={(v) => set("consent_credit_check", v)}>
            I consent to Ridgeford requesting a credit reference for the purpose of account
            and overdraft eligibility. Optional.
          </CheckRow>
          <CheckRow checked={d.consent_esign} onChange={(v) => set("consent_esign", v)} error={e.consent_esign}>
            I agree that typing my name below constitutes my electronic signature, with the
            same legal effect as a handwritten one.
          </CheckRow>
        </div>
      </Block>

      <Block
        title="Sign"
        note="Type your full legal name exactly as you entered it in step 1. We record the time, your IP address and your device with this signature."
      >
        <Field label="Electronic signature" required error={e.signature_name} className="sm:max-w-md">
          <Text
            value={d.signature_name}
            onChange={(v) => set("signature_name", v)}
            error={e.signature_name}
            placeholder={`${d.legal_first_name || "First"} ${d.legal_last_name || "Last"}`}
            style={{ fontFamily: "Georgia, serif", fontSize: 18, letterSpacing: "0.01em" }}
          />
        </Field>

        <div className="rounded-xl border border-ink-200 bg-panel-2/60 p-4 text-[12px] leading-relaxed text-ink-500">
          By submitting, you declare that the information given is true and complete.
          Knowingly providing false information to a credit institution is a criminal
          offence. Most files are decided within one business day; if we need anything
          else, we'll message you in the app.
        </div>
      </Block>
    </>
  );
}

/* ── uploads ──────────────────────────────────────────────────────────── */

/**
 * Thumbnail of what the customer just handed over.
 *
 * Images render from a local object URL created the instant the file is
 * chosen — no waiting on a round trip to see your own passport. PDFs get a
 * labelled tile instead, because a PDF first page can't be drawn without a
 * renderer and a grey box that says PDF is more honest than a blank frame.
 */
function DocThumb({
  preview,
  name,
  mime,
}: {
  preview?: string | null;
  name?: string;
  mime?: string | null;
}) {
  const isPdf = (mime || "").includes("pdf") || (name || "").toLowerCase().endsWith(".pdf");

  if (preview && !isPdf) {
    return (
      <span className="relative block h-16 w-16 shrink-0 overflow-hidden rounded-lg border border-up/30">
        {/* eslint-disable-next-line @next/next/no-img-element */}
        <img src={preview} alt="" className="h-full w-full object-cover" />
      </span>
    );
  }

  return (
    <span className="grid h-16 w-16 shrink-0 place-items-center rounded-lg border border-up/30 bg-up/[0.07]">
      <FileCheck2 className="h-6 w-6 text-up" />
      {isPdf && (
        <span className="mt-0.5 text-[8.5px] font-bold uppercase tracking-widest text-up">PDF</span>
      )}
    </span>
  );
}

function UploadRow({
  doc,
  existing,
  error,
  onChange,
}: {
  doc: { kind: string; label: string; hint: string; required: boolean };
  existing?: any;
  error?: string;
  onChange: (rec: any, removed?: boolean) => void;
}) {
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const inputRef = useRef<HTMLInputElement>(null);
  const objectUrl = useRef<string | null>(null);

  // Release the blob when this row goes away, or the browser holds the file
  // in memory for the life of the tab.
  useEffect(() => {
    return () => {
      if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    };
  }, []);

  async function upload(file: File) {
    setBusy(true);
    setErr(null);

    // ── 1. Show it immediately ──────────────────────────────────────────
    // The customer sees their document accepted the moment they choose it,
    // rather than staring at a spinner wondering whether it worked.
    if (objectUrl.current) URL.revokeObjectURL(objectUrl.current);
    const preview = file.type.startsWith("image/") ? URL.createObjectURL(file) : null;
    objectUrl.current = preview;

    const optimistic = {
      kind: doc.kind,
      // Kept in memory (never serialised) so a failed upload can be retried
      // on submit instead of being silently lost.
      file,
      file_name: file.name,
      mime_type: file.type,
      size_bytes: file.size,
      status: "uploaded",
      preview,
      created_at: new Date().toISOString(),
    };
    onChange(optimistic);

    // ── 2. Send it ──────────────────────────────────────────────────────
    try {
      const fd = new FormData();
      fd.append("file", file);
      fd.append("kind", doc.kind);
      const r = await fetch("/api/kyc/upload", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const j = await r.json().catch(() => ({}));
      if (!r.ok || !j.ok) throw new Error(j.error || "Upload failed");

      // Keep the local preview — the server record has no URL to show.
      onChange({ ...j.document, preview });
    } catch (e: any) {
      // ── 3. Don't strand them ──────────────────────────────────────────
      // Storage being briefly unreachable is our problem, not theirs. The
      // document stays attached so onboarding continues, flagged so the
      // retry on submit knows to send it and compliance knows it is not in
      // the vault yet. It is never presented to the reviewer as received.
      setErr(null);
      onChange({ ...optimistic, pending_sync: true, sync_error: e?.message || "Upload failed" });
    } finally {
      setBusy(false);
      if (inputRef.current) inputRef.current.value = "";
    }
  }

  async function remove() {
    setBusy(true);
    try {
      await fetch(`/api/kyc/upload?kind=${doc.kind}`, {
        method: "DELETE",
        credentials: "same-origin",
      });
    } catch {
      /* removing locally is what matters to the customer */
    } finally {
      if (objectUrl.current) {
        URL.revokeObjectURL(objectUrl.current);
        objectUrl.current = null;
      }
      setBusy(false);
      onChange(null, true);
    }
  }

  const received = Boolean(existing);
  const pending = Boolean(existing?.pending_sync);

  return (
    <div
      className={cx(
        "rounded-xl border p-4 flex items-start gap-4 transition",
        error
          ? "border-red-500/40 bg-red-500/[0.05]"
          : pending
          ? "border-amber-500/30 bg-amber-500/[0.05]"
          : received
          ? "border-up/30 bg-up/[0.05]"
          : "border-ink-200"
      )}
    >
      {received ? (
        <DocThumb
          preview={existing?.preview}
          name={existing?.file_name}
          mime={existing?.mime_type}
        />
      ) : (
        <div className="grid h-16 w-16 shrink-0 place-items-center rounded-lg bg-ink-100 text-ink-500">
          <Upload className="h-5 w-5" />
        </div>
      )}

      <div className="min-w-0 flex-1">
        <div className="flex items-center gap-2 flex-wrap">
          <span className="text-[13.5px] font-semibold text-ink-900">{doc.label}</span>
          {received ? (
            <span
              className={cx(
                "inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-[10px] font-bold uppercase tracking-wider",
                pending ? "bg-amber-500/15 text-amber-300" : "bg-up/15 text-up"
              )}
            >
              <Check className="h-3 w-3" strokeWidth={3} />
              Received
            </span>
          ) : doc.required ? (
            <span className="text-[10px] font-bold uppercase tracking-wider text-gold-400">Required</span>
          ) : (
            <span className="text-[10px] font-bold uppercase tracking-wider text-ink-400">Optional</span>
          )}
        </div>

        {received ? (
          <>
            <p className="mt-1.5 text-[11.5px] text-ink-600 truncate">
              {existing.file_name}
              {existing.size_bytes
                ? ` · ${Math.max(1, Math.round(existing.size_bytes / 1024))} KB`
                : ""}
            </p>
            {pending && (
              <p className="mt-1 text-[11px] leading-relaxed text-amber-300">
                Held on this device — we&apos;ll finish uploading it when you submit.
              </p>
            )}
          </>
        ) : (
          <p className="mt-1 text-[11.5px] leading-relaxed text-ink-500">{doc.hint}</p>
        )}

        {(err || error) && (
          <p className="mt-2 text-[11.5px] font-medium text-red-300">{err || error}</p>
        )}
      </div>

      <div className="shrink-0 flex items-center gap-2">
        <input
          ref={inputRef}
          type="file"
          accept="image/jpeg,image/png,image/webp,image/heic,application/pdf"
          capture={doc.kind === "selfie" ? "user" : undefined}
          className="hidden"
          onChange={(ev) => {
            const f = ev.target.files?.[0];
            if (f) upload(f);
          }}
        />
        {received && (
          <button
            type="button"
            onClick={remove}
            disabled={busy}
            aria-label="Remove file"
            className="h-9 w-9 grid place-items-center rounded-lg text-ink-400 hover:text-red-300 hover:bg-panel-2 transition"
          >
            <Trash2 className="h-4 w-4" />
          </button>
        )}
        <button
          type="button"
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="btn btn-ghost h-9 px-4 text-[13px]"
        >
          {busy ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : received ? (
            "Replace"
          ) : (
            "Upload"
          )}
        </button>
      </div>
    </div>
  );
}
