"use client";

import { useEffect, useState } from "react";
import {
  Loader2,
  Plus,
  Target,
  Lock,
  Trash2,
  ArrowDownLeft,
  ArrowUpRight,
  X,
} from "lucide-react";
import { fmtMoney } from "@/lib/utils";

type Vault = {
  id: string;
  name: string;
  goal_amount: number | string;
  balance: number | string;
  target_date: string | null;
  locked_until: string | null;
  emoji: string;
  created_at: string;
};

export default function VaultPage() {
  const [vaults, setVaults] = useState<Vault[]>([]);
  const [loading, setLoading] = useState(true);
  const [showCreate, setShowCreate] = useState(false);
  const [move, setMove] = useState<{
    vault: Vault;
    action: "deposit" | "withdraw";
  } | null>(null);

  async function load() {
    setLoading(true);
    try {
      const r = await fetch("/api/spaces", { cache: "no-store" });
      const d = await r.json();

      if (!r.ok || !d?.ok) {
        throw new Error(d?.error || "Failed to load spaces");
      }

      setVaults(Array.isArray(d?.spaces) ? d.spaces : []);
    } catch (e) {
      console.error(e);
      setVaults([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, []);

  async function del(id: string) {
    if (!confirm("Close this vault? The balance will return to your checking.")) {
      return;
    }

    try {
      const r = await fetch(`/api/spaces/${id}`, { method: "DELETE" });
      const d = await r.json();

      if (!r.ok || !d?.ok) {
        alert(d?.error || "Failed");
        return;
      }

      await load();
    } catch (e) {
      console.error(e);
      alert("Failed");
    }
  }

  return (
    <div className="pt-4 sm:pt-6 vault-y-5 pb-12">
      <div className="flex items-center justify-between flex-wrap gap-3">
        <div>
          <h1 className="dash-h1 text-[24px] sm:text-[30px] text-ink-900">
            Vault
          </h1>
          <p className="text-[13px] text-ink-500 mt-0.5">
            Save for goals. Set a target date and optionally lock the vault so you
            can&apos;t touch it before then.
          </p>
        </div>

        <button
          onClick={() => setShowCreate(true)}
          className="btn btn-brand h-10"
        >
          <Plus className="h-4 w-4" /> New vault
        </button>
      </div>

      {loading ? (
        <div className="card p-10 text-center text-[13px] text-ink-400">
          <Loader2 className="inline h-4 w-4 animate-spin mr-2" /> Loading...
        </div>
      ) : vaults.length === 0 ? (
        <div className="card p-10 text-center">
          <div className="inline-grid place-items-center h-14 w-14 rounded-2xl bg-brand-50 text-brand-600 mb-4">
            <Target className="h-6 w-6" />
          </div>
          <h3 className="text-[17px] font-bold text-ink-900">No vaults yet</h3>
          <p className="mt-1 text-[13.5px] text-ink-500 max-w-sm mx-auto">
            Create a vault to save for something specific — a holiday, a new
            laptop, or an emergency fund.
          </p>
          <button
            onClick={() => setShowCreate(true)}
            className="mt-5 btn btn-brand"
          >
            <Plus className="h-4 w-4" /> Create your first vault
          </button>
        </div>
      ) : (
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {vaults.map((s) => {
            const goal = Number(s.goal_amount || 0);
            const bal = Number(s.balance || 0);
            const pct =
              goal > 0 ? Math.min(100, Math.round((bal / goal) * 100)) : 0;
            const locked =
              !!s.locked_until &&
              new Date(s.locked_until).getTime() > Date.now();

            return (
              <div key={s.id} className="card p-5 relative">
                <div className="flex items-start justify-between">
                  <div className="text-[32px]">{s.emoji}</div>
                  <div className="flex gap-1">
                    {locked && (
                      <span className="inline-flex items-center gap-1 rounded-full bg-amber-500/15 text-amber-300 px-2 py-0.5 text-[10.5px] font-bold uppercase tracking-wide">
                        <Lock className="h-3 w-3" /> Locked
                      </span>
                    )}
                    <button
                      onClick={() => del(s.id)}
                      className="h-7 w-7 rounded-full hover:bg-ink-50 grid place-items-center text-ink-400"
                    >
                      <Trash2 className="h-3.5 w-3.5" />
                    </button>
                  </div>
                </div>

                <div className="mt-2 text-[16px] font-semibold text-ink-900">
                  {s.name}
                </div>

                <div className="mt-3">
                  <div className="text-[22px] font-bold text-ink-900 tabular-nums">
                    {fmtMoney(bal)}
                  </div>
                  {goal > 0 && (
                    <div className="text-[12px] text-ink-400">
                      of {fmtMoney(goal)} goal
                    </div>
                  )}
                </div>

                {goal > 0 && (
                  <div className="mt-3 h-2 rounded-full bg-ink-100 overflow-hidden">
                    <div
                      className="h-full bg-gradient-to-r from-brand-400 to-brand-600"
                      style={{ width: `${pct}%` }}
                    />
                  </div>
                )}

                {s.target_date && (
                  <div className="mt-2 text-[11.5px] text-ink-500">
                    Target {new Date(s.target_date).toLocaleDateString("de-DE")}
                  </div>
                )}

                {s.locked_until && (
                  <div className="text-[11.5px] text-amber-300">
                    {locked ? "Locked until " : "Was locked until "}
                    {new Date(s.locked_until).toLocaleDateString("de-DE")}
                  </div>
                )}

                <div className="mt-4 flex gap-2">
                  <button
                    onClick={() => setMove({ vault: s, action: "deposit" })}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full bg-brand-500 hover:bg-brand-600 text-white text-[12.5px] font-semibold"
                  >
                    <ArrowDownLeft className="h-3.5 w-3.5" /> Add
                  </button>
                  <button
                    onClick={() => setMove({ vault: s, action: "withdraw" })}
                    disabled={locked}
                    className="flex-1 inline-flex items-center justify-center gap-1.5 h-9 rounded-full border border-ink-200 hover:bg-ink-50 text-ink-900 text-[12.5px] font-semibold disabled:opacity-50"
                  >
                    <ArrowUpRight className="h-3.5 w-3.5" /> Withdraw
                  </button>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {showCreate && (
        <CreateModal
          onClose={() => setShowCreate(false)}
          onDone={async () => {
            setShowCreate(false);
            await load();
          }}
        />
      )}

      {move && (
        <MoveModal
          vault={move.vault}
          action={move.action}
          onClose={() => setMove(null)}
          onDone={async () => {
            setMove(null);
            await load();
          }}
        />
      )}
    </div>
  );
}

function Modal({
  title,
  children,
  onClose,
}: {
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  return (
    <div
      className="fixed inset-0 z-50 grid place-items-center bg-night-900/50 backdrop-blur-sm p-4"
      onClick={onClose}
    >
      <div
        className="w-full max-w-md card p-6"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 rounded-full hover:bg-ink-50 grid place-items-center"
          >
            <X className="h-4 w-4" />
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function CreateModal({
  onClose,
  onDone,
}: {
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [name, setName] = useState("");
  const [emoji, setEmoji] = useState("🎯");
  const [goal, setGoal] = useState("");
  const [targetDate, setTargetDate] = useState("");
  const [lockUntil, setLockUntil] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch("/api/spaces", {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          name,
          emoji,
          goal_amount: Number(goal.replace(",", ".")) || 0,
          target_date: targetDate || null,
          locked_until: lockUntil || null,
        }),
      });

      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed");
      await onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="New vault" onClose={onClose}>
      <div className="vault-y-3">
        <div className="grid grid-cols-[auto_1fr] gap-3 items-end">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Icon</span>
            <input
              value={emoji}
              onChange={(e) => setEmoji(e.target.value.slice(0, 2))}
              className="mt-1.5 h-11 w-16 rounded-xl border border-ink-200 bg-panel px-3 text-center text-[22px] outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">Name</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              placeholder="e.g. Holiday 2026"
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[15px] outline-none focus:border-brand-500"
            />
          </label>
        </div>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">
            Goal amount (€) — optional
          </span>
          <input
            value={goal}
            onChange={(e) => setGoal(e.target.value)}
            inputMode="decimal"
            placeholder="3.000"
            className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[15px] outline-none focus:border-brand-500"
          />
        </label>

        <div className="grid grid-cols-2 gap-3">
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">
              Target date
            </span>
            <input
              type="date"
              value={targetDate}
              onChange={(e) => setTargetDate(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[15px] outline-none focus:border-brand-500"
            />
          </label>
          <label className="block">
            <span className="text-[12.5px] font-semibold text-ink-700">
              Lock until
            </span>
            <input
              type="date"
              value={lockUntil}
              onChange={(e) => setLockUntil(e.target.value)}
              className="mt-1.5 h-11 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[15px] outline-none focus:border-brand-500"
            />
          </label>
        </div>

        {lockUntil && (
          <p className="text-[11.5px] text-amber-300">
            You won&apos;t be able to withdraw before this date.
          </p>
        )}

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13px] p-3">
            {err}
          </div>
        )}

        <div className="flex gap-3 pt-2">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !name.trim()}
            className="btn btn-brand flex-1 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Create
          </button>
        </div>
      </div>
    </Modal>
  );
}

function MoveModal({
  vault,
  action,
  onClose,
  onDone,
}: {
  vault: Vault;
  action: "deposit" | "withdraw";
  onClose: () => void;
  onDone: () => void | Promise<void>;
}) {
  const [amount, setAmount] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/spaces/${vault.id}`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          action,
          amount: Number(amount.replace(",", ".")),
        }),
      });

      const d = await r.json();
      if (!r.ok || !d?.ok) throw new Error(d?.error || "Failed");
      await onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal
      title={`${action === "deposit" ? "Add to" : "Withdraw from"} ${vault.name}`}
      onClose={onClose}
    >
      <div className="vault-y-3">
        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">
            Amount (€)
          </span>
          <input
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            inputMode="decimal"
            placeholder="0"
            className="mt-1.5 h-12 w-full rounded-xl border border-ink-200 bg-panel px-3 text-[18px] font-semibold outline-none focus:border-brand-500 tabular-nums"
          />
        </label>

        {err && (
          <div className="rounded-xl border border-red-500/30 bg-red-500/10 text-red-300 text-[13px] p-3">
            {err}
          </div>
        )}

        <div className="flex gap-3">
          <button onClick={onClose} className="btn btn-ghost flex-1">
            Cancel
          </button>
          <button
            onClick={submit}
            disabled={busy || !amount}
            className="btn btn-brand flex-1 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            {action === "deposit" ? "Add" : "Withdraw"}
          </button>
        </div>
      </div>
    </Modal>
  );
}