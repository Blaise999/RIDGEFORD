"use client";

import { Check, ChevronDown } from "lucide-react";
import { COUNTRIES } from "@/lib/kyc";
import { cx } from "@/lib/utils";

/** One labelled field with inline validation + optional helper text. */
export function Field({
  label,
  error,
  hint,
  required,
  children,
  className,
}: {
  label: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
  className?: string;
}) {
  return (
    <div className={className}>
      <label className="label">
        {label}
        {required && <span className="text-gold-400"> *</span>}
      </label>
      {children}
      {error ? (
        <p className="mt-1.5 text-[11.5px] font-medium text-red-300">{error}</p>
      ) : hint ? (
        <p className="hint">{hint}</p>
      ) : null}
    </div>
  );
}

export function Text({
  value,
  onChange,
  error,
  ...rest
}: {
  value: any;
  onChange: (v: string) => void;
  error?: string;
} & Omit<React.InputHTMLAttributes<HTMLInputElement>, "value" | "onChange">) {
  return (
    <input
      {...rest}
      className={cx("field", rest.className)}
      aria-invalid={error ? "true" : undefined}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Area({
  value,
  onChange,
  error,
  rows = 3,
  ...rest
}: {
  value: any;
  onChange: (v: string) => void;
  error?: string;
  rows?: number;
} & Omit<React.TextareaHTMLAttributes<HTMLTextAreaElement>, "value" | "onChange" | "rows">) {
  return (
    <textarea
      {...rest}
      rows={rows}
      className="field"
      aria-invalid={error ? "true" : undefined}
      value={value ?? ""}
      onChange={(e) => onChange(e.target.value)}
    />
  );
}

export function Select({
  value,
  onChange,
  options,
  placeholder = "Select…",
  error,
}: {
  value: any;
  onChange: (v: string) => void;
  options: { v: string; l: string }[];
  placeholder?: string;
  error?: string;
}) {
  return (
    <div className="relative">
      <select
        className="field"
        aria-invalid={error ? "true" : undefined}
        value={value ?? ""}
        onChange={(e) => onChange(e.target.value)}
      >
        <option value="">{placeholder}</option>
        {options.map((o) => (
          <option key={o.v} value={o.v}>
            {o.l}
          </option>
        ))}
      </select>
      <ChevronDown className="pointer-events-none absolute right-3.5 top-1/2 -translate-y-1/2 h-4 w-4 text-ink-400" />
    </div>
  );
}

export function CountrySelect({
  value,
  onChange,
  error,
  placeholder = "Select a country…",
}: {
  value: any;
  onChange: (v: string) => void;
  error?: string;
  placeholder?: string;
}) {
  return (
    <Select
      value={value}
      onChange={onChange}
      error={error}
      placeholder={placeholder}
      options={COUNTRIES.map((c) => ({ v: c.code, l: c.eea ? `${c.name} · EEA` : c.name }))}
    />
  );
}

/** Multi-select rendered as toggle chips — far better on a phone than a listbox. */
export function ChipGroup({
  value,
  onChange,
  options,
  error,
}: {
  value: string[] | undefined;
  onChange: (v: string[]) => void;
  options: { v: string; l: string }[];
  error?: string;
}) {
  const sel = Array.isArray(value) ? value : [];
  return (
    <div className={cx("flex flex-wrap gap-2", error && "ring-1 ring-red-500/40 rounded-xl p-2")}>
      {options.map((o) => {
        const on = sel.includes(o.v);
        return (
          <button
            key={o.v}
            type="button"
            onClick={() => onChange(on ? sel.filter((x) => x !== o.v) : [...sel, o.v])}
            className={cx(
              "inline-flex items-center gap-1.5 rounded-full border px-3.5 py-2 text-[12.5px] font-medium transition",
              on
                ? "border-gold-500/60 bg-gold-500/12 text-gold-200"
                : "border-ink-200 text-ink-600 hover:border-ink-300 hover:text-ink-800"
            )}
          >
            {on && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
            {o.l}
          </button>
        );
      })}
    </div>
  );
}

/** Yes / no with an explicit "not answered" state — no silent defaults. */
export function YesNo({
  value,
  onChange,
  yes = "Yes",
  no = "No",
  error,
}: {
  value: boolean | undefined | null;
  onChange: (v: boolean) => void;
  yes?: string;
  no?: string;
  error?: string;
}) {
  return (
    <div className={cx("inline-flex rounded-xl border p-1 gap-1", error ? "border-red-500/40" : "border-ink-200")}>
      {[
        { v: true, l: yes },
        { v: false, l: no },
      ].map((o) => (
        <button
          key={String(o.v)}
          type="button"
          onClick={() => onChange(o.v)}
          className={cx(
            "px-5 py-2 rounded-lg text-[13px] font-semibold transition",
            value === o.v ? "bg-gold-500 text-ink-50" : "text-ink-600 hover:bg-panel-2"
          )}
        >
          {o.l}
        </button>
      ))}
    </div>
  );
}

export function CheckRow({
  checked,
  onChange,
  error,
  children,
}: {
  checked: boolean | undefined;
  onChange: (v: boolean) => void;
  error?: string;
  children: React.ReactNode;
}) {
  return (
    <label
      className={cx(
        "flex gap-3 cursor-pointer group rounded-xl p-3 -mx-1 transition",
        error ? "bg-red-500/[0.06] ring-1 ring-red-500/25" : "hover:bg-panel-2/60"
      )}
    >
      <span
        className={cx(
          "mt-0.5 h-5 w-5 shrink-0 rounded-md border grid place-items-center transition",
          checked ? "bg-gold-500 border-gold-500 text-ink-50" : "border-ink-200 group-hover:border-ink-300"
        )}
      >
        {checked && <Check className="h-3.5 w-3.5" strokeWidth={3} />}
      </span>
      <input
        type="checkbox"
        className="sr-only"
        checked={Boolean(checked)}
        onChange={(e) => onChange(e.target.checked)}
      />
      <span className="text-[12.5px] leading-relaxed text-ink-500">{children}</span>
    </label>
  );
}

/** Section heading inside a step. */
export function Block({
  title,
  note,
  children,
}: {
  title: string;
  note?: string;
  children: React.ReactNode;
}) {
  return (
    <section className="space-y-4">
      <div>
        <h3 className="text-[13px] font-bold uppercase tracking-[0.16em] text-ink-700">{title}</h3>
        {note && <p className="mt-1.5 text-[12.5px] leading-relaxed text-ink-500">{note}</p>}
      </div>
      {children}
    </section>
  );
}
