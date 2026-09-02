"use client";

import { useState, useCallback } from "react";

type Payload = Record<string, any>;

/**
 * Drives the bank-style transfer authorisation.
 *
 * Usage in a transfer page:
 *
 *   const otp = useTransferOtp();
 *   async function submit(e) {
 *     e.preventDefault();
 *     otp.begin({ rail, amount, beneficiary_name, ... });  // sends the email, opens modal
 *   }
 *   <TransferOtpModal {...otp.modalProps}
 *      onSubmit={(code) => otp.confirm(code, (d) =>
 *        router.push(`/dashboard/transfer/success?ref=${d.transfer.reference_id}`))}/>
 */
export function useTransferOtp() {
  const [open, setOpen] = useState(false);
  const [payload, setPayload] = useState<Payload | null>(null);
  const [emailMasked, setEmailMasked] = useState<string | undefined>();
  const [devHint, setDevHint] = useState<string | undefined>();
  const [submitting, setSubmitting] = useState(false);
  const [requesting, setRequesting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  /** Request an OTP for this transfer and open the modal. */
  const begin = useCallback(async (p: Payload) => {
    setError(null);
    setRequesting(true);
    try {
      const r = await fetch("/api/transfers/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount: p.amount,
          currency: p.currency,
          beneficiary_name: p.beneficiary_name,
        }),
      });
      const raw = await r.text();
      let d: any = {};
      try {
        d = raw ? JSON.parse(raw) : {};
      } catch {
        throw new Error("Unexpected server response. Please try again.");
      }
      if (!r.ok || !d.ok) {
        throw new Error(d.error || "Could not start authorisation");
      }
      setPayload(p);
      setEmailMasked(d.emailMasked);
      setDevHint(d.devHint);
      setOpen(true);
      return true;
    } catch (e: any) {
      setError(e?.message || "Could not start authorisation");
      return false;
    } finally {
      setRequesting(false);
    }
  }, []);

  /** Submit the code together with the transfer payload. */
  const confirm = useCallback(
    async (code: string, onSuccess: (data: any) => void) => {
      if (!payload) return;
      const clean = String(code || "").replace(/\D/g, "");
      if (clean.length !== 6) {
        setError("Enter the full 6-digit code.");
        return;
      }
      setSubmitting(true);
      setError(null);
      try {
        const r = await fetch("/api/transfers", {
          method: "POST",
          headers: { "content-type": "application/json" },
          credentials: "same-origin",
          body: JSON.stringify({ ...payload, otp: clean }),
        });
        const raw = await r.text();
        let d: any = {};
        try {
          d = raw ? JSON.parse(raw) : {};
        } catch {
          throw new Error("Unexpected server response. Please try again.");
        }
        if (!r.ok || !d.ok) {
          throw new Error(d.error || "Transfer failed");
        }
        setOpen(false);
        onSuccess(d);
      } catch (e: any) {
        setError(e?.message || "Transfer failed");
      } finally {
        setSubmitting(false);
      }
    },
    [payload]
  );

  /** Re-request a fresh code (same payload). */
  const resend = useCallback(async () => {
    if (!payload) return;
    setError(null);
    try {
      const r = await fetch("/api/transfers/otp", {
        method: "POST",
        headers: { "content-type": "application/json" },
        credentials: "same-origin",
        body: JSON.stringify({
          amount: payload.amount,
          currency: payload.currency,
          beneficiary_name: payload.beneficiary_name,
        }),
      });
      const d = await r.json().catch(() => ({}));
      if (d?.emailMasked) setEmailMasked(d.emailMasked);
    } catch {
      /* ignore — UX is "we tried" */
    }
  }, [payload]);

  const close = useCallback(() => {
    if (submitting) return;
    setOpen(false);
    setError(null);
  }, [submitting]);

  return {
    begin,
    confirm,
    resend,
    requesting,
    error,
    setError,
    modalProps: {
      open,
      emailMasked,
      devHint,
      submitting,
      error,
      onResend: resend,
      onClose: close,
    },
  };
}
