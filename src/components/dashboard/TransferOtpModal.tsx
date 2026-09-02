"use client";

import { useEffect, useRef, useState } from "react";
import { ShieldCheck, Loader2, X } from "lucide-react";

/**
 * Bank-style transfer authorisation modal.
 *
 * Flow:
 *  1. Parent collects the transfer form and calls `requestOtp()` which hits
 *     POST /api/transfers/otp (sends the email), then opens this modal.
 *  2. User types the 6-digit code.
 *  3. On submit, this calls `onVerified(code)` — the parent then POSTs to
 *     /api/transfers WITH the code. If the server rejects the code, the
 *     parent passes the error back via the `error` prop.
 */
export function TransferOtpModal({
  open,
  emailMasked,
  devHint,
  submitting,
  error,
  onSubmit,
  onResend,
  onClose,
}: {
  open: boolean;
  emailMasked?: string;
  devHint?: string;
  submitting: boolean;
  error?: string | null;
  onSubmit: (code: string) => void;
  onResend: () => void;
  onClose: () => void;
}) {
  const [code, setCode] = useState<string[]>(Array(6).fill(""));
  const inputs = useRef<(HTMLInputElement | null)[]>([]);
  const [resending, setResending] = useState(false);
  const [cooldown, setCooldown] = useState(0);

  useEffect(() => {
    if (open) {
      setCode(Array(6).fill(""));
      setTimeout(() => inputs.current[0]?.focus(), 60);
      setCooldown(30);
    }
  }, [open]);

  useEffect(() => {
    if (cooldown <= 0) return;
    const t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    return () => clearTimeout(t);
  }, [cooldown]);

  if (!open) return null;

  function setDigit(i: number, v: string) {
    const d = v.replace(/\D/g, "").slice(0, 1);
    const next = [...code];
    next[i] = d;
    setCode(next);
    if (d && i < 5) inputs.current[i + 1]?.focus();
    if (next.every((x) => x) && !submitting) {
      onSubmit(next.join(""));
    }
  }

  function onKey(i: number, e: React.KeyboardEvent<HTMLInputElement>) {
    if (e.key === "Backspace" && !code[i] && i > 0) {
      inputs.current[i - 1]?.focus();
    }
  }

  function onPaste(e: React.ClipboardEvent) {
    const t = e.clipboardData.getData("text").replace(/\D/g, "").slice(0, 6);
    if (!t) return;
    e.preventDefault();
    const next = Array(6).fill("");
    for (let i = 0; i < t.length; i++) next[i] = t[i];
    setCode(next);
    if (t.length === 6 && !submitting) onSubmit(t);
    else inputs.current[Math.min(t.length, 5)]?.focus();
  }

  async function doResend() {
    if (cooldown > 0 || resending) return;
    setResending(true);
    try {
      await onResend();
      setCooldown(30);
      setCode(Array(6).fill(""));
      inputs.current[0]?.focus();
    } finally {
      setResending(false);
    }
  }

  return (
    <div className="fixed inset-0 z-50 grid place-items-center px-4 bg-night-900/50 backdrop-blur-sm">
      <div className="w-full max-w-md rounded-2xl bg-panel shadow-2xl overflow-hidden">
        <div className="flex items-center justify-between px-5 py-4 border-b border-ink-100">
          <div className="flex items-center gap-2.5">
            <div className="h-9 w-9 rounded-xl bg-brand-500/10 text-brand-600 grid place-items-center">
              <ShieldCheck className="h-5 w-5" />
            </div>
            <div>
              <div className="text-[15px] font-bold text-ink-900">
                Authorise transfer
              </div>
              <div className="text-[12px] text-ink-500">
                Security check required
              </div>
            </div>
          </div>
          <button
            onClick={onClose}
            disabled={submitting}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-ink-100 disabled:opacity-50"
            aria-label="Cancel"
          >
            <X className="h-4 w-4" />
          </button>
        </div>

        <div className="px-5 py-5">
          <p className="text-[13.5px] text-ink-600 leading-relaxed">
            For your security we&apos;ve emailed a 6-digit authorisation code
            {emailMasked ? (
              <>
                {" "}
                to <span className="font-semibold text-ink-900">{emailMasked}</span>
              </>
            ) : null}
            . Enter it below to send this transfer.
          </p>

          <div className="mt-5 flex gap-2 justify-between">
            {code.map((d, i) => (
              <input
                key={i}
                ref={(el) => {
                  inputs.current[i] = el;
                }}
                inputMode="numeric"
                pattern="[0-9]*"
                maxLength={1}
                value={d}
                onChange={(e) => setDigit(i, e.target.value)}
                onKeyDown={(e) => onKey(i, e)}
                onPaste={onPaste}
                disabled={submitting}
                className="h-14 w-full max-w-[52px] rounded-xl border border-ink-200 bg-panel text-center text-[22px] font-bold text-ink-900 outline-none focus:border-brand-500 focus:ring-2 focus:ring-brand-500/30 disabled:opacity-60"
              />
            ))}
          </div>

          {error && (
            <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13px] p-3">
              {error}
            </div>
          )}

          {devHint && !error && (
            <div className="mt-4 rounded-xl border border-amber-500/30 bg-amber-500/10 text-amber-300 text-[12.5px] p-2.5">
              Dev mode: {devHint}
            </div>
          )}

          <div className="mt-5 flex items-center justify-between">
            <button
              onClick={doResend}
              disabled={cooldown > 0 || resending || submitting}
              className="text-[13px] font-semibold text-brand-600 hover:underline disabled:text-ink-400 disabled:no-underline"
            >
              {resending
                ? "Sending…"
                : cooldown > 0
                ? `Resend code in ${cooldown}s`
                : "Resend code"}
            </button>
            {submitting && (
              <span className="inline-flex items-center gap-1.5 text-[13px] text-ink-500">
                <Loader2 className="h-3.5 w-3.5 animate-spin" />
                Verifying…
              </span>
            )}
          </div>

          <button
            onClick={() => onSubmit(code.join(""))}
            disabled={submitting || code.some((d) => !d)}
            className="btn btn-primary w-full mt-5 disabled:opacity-60"
          >
            {submitting ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <ShieldCheck className="h-4 w-4" />
            )}
            Confirm &amp; send transfer
          </button>

          <p className="mt-3 text-[11px] text-ink-400 text-center leading-relaxed">
            Ridgeford Capital Bank will never ask you to share this code with anyone.
            The code expires in 10 minutes.
          </p>
        </div>
      </div>
    </div>
  );
}
