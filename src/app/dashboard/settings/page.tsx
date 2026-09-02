"use client";

import { useRouter } from "next/navigation";

import { useEffect, useRef, useState } from "react";
import { Camera, Check, Loader2, User } from "lucide-react";
import { cx } from "@/lib/utils";

export default function SettingsPage() {
  const router = useRouter();
  const [me, setMe] = useState<any>(null);
  const [firstName, setFirstName] = useState("");
  const [lastName, setLastName] = useState("");
  const [phone, setPhone] = useState("");
  const [avatar, setAvatar] = useState<string | null>(null);
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [err, setErr] = useState<string | null>(null);
  const fileRef = useRef<HTMLInputElement>(null);

  async function load() {
    const r = await fetch("/api/auth/me");
    const d = await r.json();
    if (d.ok) {
      setMe(d.user);
      setFirstName(d.user.first_name || "");
      setLastName(d.user.last_name || "");
      setPhone(d.user.phone || "");
      setAvatar(d.user.avatar_url || null);
    }
  }
  useEffect(() => { load(); }, []);

  const [uploading, setUploading] = useState(false);

  /**
   * Upload immediately to object storage rather than stuffing a base64 data
   * URL into the user row (which is what this used to do — a 3 MB photo became
   * ~4 MB of text carried by every query that selected the user).
   *
   * A local preview shows instantly so it still feels immediate.
   */
  async function onPick(e: React.ChangeEvent<HTMLInputElement>) {
    const f = e.target.files?.[0];
    if (!f) return;
    if (f.size > 4_000_000) return setErr("Image must be under 4 MB");

    setErr(null);
    setUploading(true);
    const preview = URL.createObjectURL(f);
    setAvatar(preview);

    try {
      const fd = new FormData();
      fd.append("file", f);
      const r = await fetch("/api/profile/avatar", {
        method: "POST",
        body: fd,
        credentials: "same-origin",
      });
      const d = await r.json().catch(() => ({}));
      if (!r.ok || !d.ok) throw new Error(d.error || "Upload failed");
      URL.revokeObjectURL(preview);
      setAvatar(d.avatar_url);
      setSaved(true);
      router.refresh();
    } catch (e: any) {
      URL.revokeObjectURL(preview);
      setAvatar(null);
      setErr(e?.message || "Could not upload that image");
    } finally {
      setUploading(false);
      if (fileRef.current) fileRef.current.value = "";
    }
  }

  async function removeAvatar() {
    setUploading(true);
    try {
      await fetch("/api/profile/avatar", { method: "DELETE", credentials: "same-origin" });
      setAvatar(null);
      router.refresh();
    } finally {
      setUploading(false);
    }
  }

  async function save() {
    setErr(null); setSaving(true); setSaved(false);
    try {
      const r = await fetch("/api/profile", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          first_name: firstName,
          last_name: lastName,
          phone,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Save failed");
      setSaved(true);
      setTimeout(() => setSaved(false), 1800);
      await load();
    } catch (e: any) { setErr(e.message); }
    finally { setSaving(false); }
  }

  if (!me) {
    return <div className="pt-10 text-center text-[13px] text-ink-400">
      <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading…
    </div>;
  }

  return (
    <div className="pt-4 sm:pt-6 max-w-2xl space-y-5 pb-12">
      <div>
        <h1 className="dash-h1 text-[24px] sm:text-[30px] text-ink-900">Settings</h1>
        <p className="text-[13px] text-ink-500 mt-0.5">Your profile and sign-in details.</p>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink-900">Profile</h2>
        {/* A bigger, calmer target. 20px was a thumbnail you had to aim at;
            this is a portrait you are meant to look at. */}
        <div className="mt-5 flex items-center gap-5 flex-wrap">
          <div className="relative">
            <div className="h-28 w-28 sm:h-32 sm:w-32 rounded-full bg-ink-100 overflow-hidden grid place-items-center ring-1 ring-ink-200">
              {avatar ? (
                /* eslint-disable-next-line @next/next/no-img-element */
                <img src={avatar} alt="" className="h-full w-full object-cover" />
              ) : (
                <User className="h-10 w-10 text-ink-400" />
              )}
            </div>
            <button
              onClick={() => fileRef.current?.click()}
              disabled={uploading}
              className="absolute bottom-0 right-0 h-10 w-10 rounded-full bg-steel text-[#080808] grid place-items-center ring-4 ring-[#141414] hover:bg-steel-lt transition disabled:opacity-60"
              aria-label="Change picture"
            >
              {uploading ? (
                <span className="h-4 w-4 animate-spin rounded-full border-2 border-current border-t-transparent" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
            </button>
            {avatar && !uploading && (
              <button
                onClick={removeAvatar}
                className="absolute bottom-0 left-0 h-8 w-8 rounded-full bg-panel-2 text-ink-500 grid place-items-center ring-4 ring-[#141414] hover:text-down transition"
                aria-label="Remove picture"
                title="Remove picture"
              >
                ×
              </button>
            )}
            <input ref={fileRef} type="file" accept="image/*" className="hidden" onChange={onPick} />
          </div>
          <div className="flex-1">
            <div className="text-[16px] font-semibold text-ink-900">
              {firstName} {lastName}
            </div>
            <div className="text-[12.5px] text-ink-500">{me.email}</div>
          </div>
        </div>

        <div className="mt-6 grid sm:grid-cols-2 gap-3">
          <Field label="First name" value={firstName} onChange={setFirstName} />
          <Field label="Last name" value={lastName} onChange={setLastName} />
          <Field label="Phone" value={phone} onChange={setPhone} />
          <Field label="Email" value={me.email} onChange={() => {}} readOnly />
        </div>

        {err && <div className="mt-4 rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13px] p-3">{err}</div>}

        <div className="mt-5 flex items-center gap-3">
          <button onClick={save} disabled={saving} className={cx("btn btn-brand disabled:opacity-60")}>
            {saving ? <Loader2 className="h-4 w-4 animate-spin" /> : saved ? <Check className="h-4 w-4" /> : null}
            {saved ? "Saved" : "Save changes"}
          </button>
        </div>
      </div>

      <div className="card p-6">
        <h2 className="text-[15px] font-semibold text-ink-900">Account</h2>
        <div className="mt-3 space-y-2 text-[13.5px]">
          <KV k="IBAN" v={me.iban || "—"} />
          <KV k="BIC" v={me.bic || "—"} />
          <KV k="Card" v={me.card_last4 ? `•••• ${me.card_last4}` : "—"} />
        </div>
      </div>
    </div>
  );
}

function Field({
  label, value, onChange, readOnly,
}: { label: string; value: string; onChange: (v: string) => void; readOnly?: boolean }) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <input
        value={value}
        onChange={(e) => onChange(e.target.value)}
        readOnly={readOnly}
        className={cx(
          "mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[15px] outline-none focus:border-brand-500",
          readOnly && "bg-ink-50 text-ink-500"
        )}
      />
    </label>
  );
}

function KV({ k, v }: { k: string; v: string }) {
  return (
    <div className="flex items-center justify-between">
      <span className="text-ink-500">{k}</span>
      <span className="font-semibold text-ink-900 tabular-nums">{v}</span>
    </div>
  );
}
