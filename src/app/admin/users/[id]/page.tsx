"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import {
  ArrowLeft,
  Ban,
  CheckCircle2,
  Loader2,
  Pencil,
  Sparkles,
  Plus,
} from "lucide-react";
import {
  fmtMoney,
  fmtDate,
  fmtRelativeDate,
  maskIban,
  cx,
} from "@/lib/utils";

export default function AdminUserDetail({
  params,
}: {
  params: { id: string };
}) {
  const { id } = params;
  const [data, setData] = useState<any>(null);
  const [busy, setBusy] = useState(false);
  const [showBalance, setShowBalance] = useState<null | "checking" | "savings">(
    null
  );
  const [showSeed, setShowSeed] = useState(false);
  const [showInject, setShowInject] = useState(false);

  async function load() {
    const r = await fetch(`/api/admin/users/${id}`, { cache: "no-store" });
    const d = await r.json();
    setData(d);
  }

  useEffect(() => {
    load();
  }, [id]);

  async function toggleBlock() {
    const u = data?.user;
    if (!u) return;

    const block = !u.blocked;
    let reason: string | null = null;

    if (block) {
      reason = prompt(
        "Reason for suspending this account (shown in email):",
        "Suspicious activity"
      );
      if (reason === null) return;
    }

    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${u.id}/block`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ block, reason }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      await load();
    } catch (e) {
      alert(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  if (!data) {
    return (
      <div className="pt-10 text-center text-[13.5px] text-ink-400">
        <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
        Loading user…
      </div>
    );
  }

  const u = data.user;
  const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";

  return (
    <div className="pt-4 sm:pt-6 space-y-5 pb-12">
      <Link
        href="/admin/users"
        className="inline-flex items-center gap-1.5 text-[13px] text-ink-500 hover:text-ink-900"
      >
        <ArrowLeft className="h-4 w-4" /> Back to users
      </Link>

      <div className="card p-5 sm:p-6 flex flex-wrap items-center gap-4">
        <div className="min-w-0">
          <h1 className="text-[22px] sm:text-[24px] font-bold text-ink-900 truncate">
            {name}
          </h1>
          <div className="text-[13.5px] text-ink-500 mt-0.5 truncate">
            {u.email}
          </div>
          <div className="text-[12px] text-ink-400 tabular-nums mt-1">
            {maskIban(u.iban)}
          </div>
        </div>

        <div className="ml-auto flex flex-wrap items-center gap-2">
          <span
            className={cx(
              "inline-flex items-center rounded-full text-[11px] font-bold uppercase tracking-wide px-2.5 py-1",
              u.blocked
                ? "bg-red-500/15 text-red-300"
                : "bg-brand-500/10 text-brand-700"
            )}
          >
            {u.blocked ? "Blocked" : "Active"}
          </span>

          <button
            onClick={toggleBlock}
            disabled={busy}
            className={cx(
              "btn h-10",
              u.blocked
                ? "bg-brand-500 text-white hover:bg-brand-600"
                : "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
            )}
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : u.blocked ? (
              <CheckCircle2 className="h-4 w-4" />
            ) : (
              <Ban className="h-4 w-4" />
            )}
            {u.blocked ? "Unblock" : "Block"}
          </button>
        </div>
      </div>

      {u.blocked && u.blocked_reason && (
        <div className="rounded-2xl border border-red-500/30 bg-red-500/10 p-4">
          <div className="text-[13px] font-semibold text-red-200">
            Suspension reason
          </div>
          <div className="text-[13.5px] text-red-300 mt-0.5">
            {u.blocked_reason}
          </div>
          <div className="text-[11.5px] text-red-300/70 mt-0.5">
            Suspended on {fmtDate(u.blocked_at)}
          </div>
        </div>
      )}

      <div className="grid sm:grid-cols-2 gap-3">
        <BalanceCard
          label="Checking"
          value={Number(u.balance_checking)}
          onEdit={() => setShowBalance("checking")}
        />
        <BalanceCard
          label="Savings"
          value={Number(u.balance_savings)}
          onEdit={() => setShowBalance("savings")}
        />
      </div>

      <div className="flex flex-wrap gap-2">
        <button onClick={() => setShowSeed(true)} className="btn btn-brand h-10">
          <Sparkles className="h-4 w-4" /> Seed random transactions
        </button>
        <button onClick={() => setShowInject(true)} className="btn btn-ghost h-10">
          <Plus className="h-4 w-4" /> Inject single transaction
        </button>
      </div>

      <div className="grid lg:grid-cols-2 gap-4">
        <div className="card p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-ink-900 mb-3">
            Recent transfers
          </h2>
          {(data.transfers || []).length === 0 ? (
            <div className="text-[13.5px] text-ink-400">No transfers yet.</div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {(data.transfers || []).slice(0, 10).map((t: any) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                      {t.reference_id} · {t.beneficiary_name}
                    </div>
                    <div className="text-[11.5px] text-ink-400">
                      {fmtRelativeDate(t.created_at)} · {t.rail}
                    </div>
                  </div>
                  <div className="text-[14px] font-bold text-ink-900 tabular-nums shrink-0">
                    {fmtMoney(Number(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>

        <div className="card p-5 sm:p-6">
          <h2 className="text-[15px] font-semibold text-ink-900 mb-3">
            Recent transactions
          </h2>
          {(data.transactions || []).length === 0 ? (
            <div className="text-[13.5px] text-ink-400">No transactions yet.</div>
          ) : (
            <ul className="divide-y divide-ink-100">
              {(data.transactions || []).slice(0, 10).map((t: any) => (
                <li key={t.id} className="py-3 flex items-center gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="text-[13.5px] font-semibold text-ink-900 truncate">
                      {t.counterparty_name || t.merchant || "Transaction"}
                    </div>
                    <div className="text-[11.5px] text-ink-400">
                      {fmtRelativeDate(t.created_at)} · {t.category}
                    </div>
                  </div>
                  <div
                    className={cx(
                      "text-[14px] font-bold tabular-nums shrink-0",
                      t.direction === "credit"
                        ? "text-brand-600"
                        : "text-ink-900"
                    )}
                  >
                    {t.direction === "credit" ? "+ " : "− "}
                    {fmtMoney(Number(t.amount))}
                  </div>
                </li>
              ))}
            </ul>
          )}
        </div>
      </div>

      {showBalance && (
        <EditBalanceModal
          userId={u.id}
          account={showBalance}
          currentValue={Number(
            showBalance === "savings" ? u.balance_savings : u.balance_checking
          )}
          onClose={() => setShowBalance(null)}
          onDone={async () => {
            setShowBalance(null);
            await load();
          }}
        />
      )}

      {showSeed && (
        <SeedModal
          userId={u.id}
          onClose={() => setShowSeed(false)}
          onDone={async () => {
            setShowSeed(false);
            await load();
          }}
        />
      )}

      {showInject && (
        <InjectModal
          userId={u.id}
          onClose={() => setShowInject(false)}
          onDone={async () => {
            setShowInject(false);
            await load();
          }}
        />
      )}
    </div>
  );
}

function BalanceCard({
  label,
  value,
  onEdit,
}: {
  label: string;
  value: number;
  onEdit: () => void;
}) {
  return (
    <div className="card p-5 flex items-center gap-4">
      <div className="flex-1">
        <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
          {label}
        </div>
        <div className="mt-1 text-[22px] sm:text-[26px] font-bold text-ink-900 tracking-tight tabular-nums">
          {fmtMoney(value)}
        </div>
      </div>
      <button onClick={onEdit} className="btn btn-ghost h-9 px-3">
        <Pencil className="h-3.5 w-3.5" /> Edit
      </button>
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
        className="w-full max-w-lg card p-6 sm:p-7 max-h-[90vh] overflow-y-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between">
          <h2 className="text-[18px] font-bold text-ink-900">{title}</h2>
          <button
            onClick={onClose}
            className="h-8 w-8 grid place-items-center rounded-full hover:bg-ink-50"
          >
            ✕
          </button>
        </div>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function EditBalanceModal({
  userId,
  account,
  currentValue,
  onClose,
  onDone,
}: {
  userId: string;
  account: "checking" | "savings";
  currentValue: number;
  onClose: () => void;
  onDone: () => void;
}) {
  const [mode, setMode] = useState<"set" | "credit" | "debit">("set");
  const [amount, setAmount] = useState(String(currentValue));
  const [note, setNote] = useState("");
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${userId}/balance`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          account_type: account,
          mode,
          amount: Number(amount.replace(",", ".")),
          note,
          post_transaction: true,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title={`Edit ${account} balance`} onClose={onClose}>
      <div className="space-y-4">
        <div className="rounded-xl bg-ink-50 p-3">
          <div className="text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
            Current
          </div>
          <div className="text-[22px] font-bold text-ink-900 tabular-nums">
            {fmtMoney(currentValue)}
          </div>
        </div>

        <div className="inline-flex rounded-full bg-ink-50 p-1 w-full">
          {(["set", "credit", "debit"] as const).map((m) => (
            <button
              key={m}
              onClick={() => setMode(m)}
              className={cx(
                "flex-1 rounded-full h-9 text-[12.5px] font-semibold transition",
                mode === m ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {m === "set" ? "Set to" : m === "credit" ? "Credit +" : "Debit −"}
            </button>
          ))}
        </div>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">
            Amount (EUR)
          </span>
          <input
            inputMode="decimal"
            value={amount}
            onChange={(e) => setAmount(e.target.value)}
            className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-brand-500 focus:ring-1 focus:ring-brand-500 tabular-nums"
          />
        </label>

        <label className="block">
          <span className="text-[12.5px] font-semibold text-ink-700">
            Note (shown on ledger + notification)
          </span>
          <input
            value={note}
            onChange={(e) => setNote(e.target.value)}
            placeholder="e.g. Goodwill credit"
            className="mt-1.5 w-full h-11 rounded-xl border border-ink-200 bg-panel px-4 text-[15px] outline-none focus:border-brand-500"
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
            disabled={busy}
            className="btn btn-brand flex-1 disabled:opacity-60"
          >
            {busy ? <Loader2 className="h-4 w-4 animate-spin" /> : null}
            Apply
          </button>
        </div>
      </div>
    </Modal>
  );
}

function SeedModal({
  userId,
  onClose,
  onDone,
}: {
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [direction, setDirection] = useState<"both" | "sent" | "received">(
    "both"
  );
  const [count, setCount] = useState("120");
  const [minAmount, setMinAmount] = useState("4");
  const [maxAmount, setMaxAmount] = useState("250");
  const [account, setAccount] = useState<"checking" | "savings">("checking");
  const [from, setFrom] = useState(isoDaysAgo(365));
  const [to, setTo] = useState(isoDaysAgo(0));
  const [adjustBalance, setAdjustBalance] = useState(false);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${userId}/seed`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          direction,
          count: Number(count),
          minAmount: Number(minAmount.replace(",", ".")),
          maxAmount: Number(maxAmount.replace(",", ".")),
          from: new Date(from).toISOString(),
          to: new Date(to).toISOString(),
          accountType: account,
          adjustBalance,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Seed random transactions" onClose={onClose}>
      <div className="space-y-4">
        <div className="inline-flex rounded-full bg-ink-50 p-1 w-full">
          {(["both", "sent", "received"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={cx(
                "flex-1 rounded-full h-9 text-[12.5px] font-semibold transition capitalize",
                direction === d ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {d}
            </button>
          ))}
        </div>

        <Field label="Count">
          <input
            value={count}
            onChange={(e) => setCount(e.target.value)}
            inputMode="numeric"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Min amount (EUR)">
            <input
              value={minAmount}
              onChange={(e) => setMinAmount(e.target.value)}
              inputMode="decimal"
            />
          </Field>
          <Field label="Max amount (EUR)">
            <input
              value={maxAmount}
              onChange={(e) => setMaxAmount(e.target.value)}
              inputMode="decimal"
            />
          </Field>
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="From">
            <input
              type="date"
              value={from}
              onChange={(e) => setFrom(e.target.value)}
            />
          </Field>
          <Field label="To">
            <input
              type="date"
              value={to}
              onChange={(e) => setTo(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Account">
          <div className="inline-flex rounded-full bg-ink-50 p-1 w-full">
            {(["checking", "savings"] as const).map((a) => (
              <button
                key={a}
                onClick={() => setAccount(a)}
                className={cx(
                  "flex-1 rounded-full h-9 text-[12.5px] font-semibold transition capitalize",
                  account === a ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500"
                )}
              >
                {a}
              </button>
            ))}
          </div>
        </Field>

        <label className="flex items-center gap-2 text-[13px] text-ink-700">
          <input
            type="checkbox"
            checked={adjustBalance}
            onChange={(e) => setAdjustBalance(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          Also move the user&apos;s balance by the net of these transactions
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
            disabled={busy}
            className="btn btn-brand flex-1 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Sparkles className="h-4 w-4" />
            )}
            Generate
          </button>
        </div>

        <p className="text-[11px] text-ink-400">
          Tip: you can seed across multiple years. Try <b>from: 3 years ago</b>,{" "}
          <b>count: 800</b>, <b>range: 5–400 €</b>.
        </p>
      </div>
    </Modal>
  );
}

function InjectModal({
  userId,
  onClose,
  onDone,
}: {
  userId: string;
  onClose: () => void;
  onDone: () => void;
}) {
  const [direction, setDirection] = useState<"debit" | "credit">("debit");
  const [account, setAccount] = useState<"checking" | "savings">("checking");
  const [amount, setAmount] = useState("");
  const [date, setDate] = useState(isoDaysAgo(0));
  const [merchant, setMerchant] = useState("");
  const [category, setCategory] = useState("Shopping");
  const [description, setDescription] = useState("");
  const [adjustBalance, setAdjustBalance] = useState(true);
  const [busy, setBusy] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  async function submit() {
    setErr(null);
    setBusy(true);
    try {
      const r = await fetch(`/api/admin/users/${userId}/transaction`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({
          direction,
          account_type: account,
          amount: Number(amount.replace(",", ".")),
          date: new Date(date).toISOString(),
          merchant,
          counterparty_name: merchant,
          category,
          description,
          adjust_balance: adjustBalance,
        }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Failed");
      onDone();
    } catch (e) {
      setErr(e instanceof Error ? e.message : "Failed");
    } finally {
      setBusy(false);
    }
  }

  return (
    <Modal title="Inject a single transaction" onClose={onClose}>
      <div className="space-y-4">
        <div className="inline-flex rounded-full bg-ink-50 p-1 w-full">
          {(["debit", "credit"] as const).map((d) => (
            <button
              key={d}
              onClick={() => setDirection(d)}
              className={cx(
                "flex-1 rounded-full h-9 text-[12.5px] font-semibold transition",
                direction === d ? "bg-panel text-ink-900 shadow-sm" : "text-ink-500"
              )}
            >
              {d === "debit" ? "Debit (spent)" : "Credit (received)"}
            </button>
          ))}
        </div>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Amount (EUR)">
            <input
              value={amount}
              onChange={(e) => setAmount(e.target.value)}
              inputMode="decimal"
              placeholder="0,00"
            />
          </Field>
          <Field label="Date">
            <input
              type="date"
              value={date}
              onChange={(e) => setDate(e.target.value)}
            />
          </Field>
        </div>

        <Field label="Merchant / Sender name">
          <input
            value={merchant}
            onChange={(e) => setMerchant(e.target.value)}
            placeholder="e.g. Rewe / Anna Müller"
          />
        </Field>

        <div className="grid grid-cols-2 gap-3">
          <Field label="Account">
            <select
              value={account}
              onChange={(e) =>
                setAccount(e.target.value as "checking" | "savings")
              }
            >
              <option value="checking">Checking</option>
              <option value="savings">Savings</option>
            </select>
          </Field>

          <Field label="Category">
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {[
                "Transfer",
                "Income",
                "Bills",
                "Dining",
                "Groceries",
                "Transport",
                "Shopping",
                "Refund",
                "Subscriptions",
                "Housing",
                "Fee",
                "Topup",
                "Salary",
                "Travel",
                "Entertainment",
                "Health",
              ].map((c) => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </Field>
        </div>

        <Field label="Description (optional)">
          <input
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="Notes…"
          />
        </Field>

        <label className="flex items-center gap-2 text-[13px] text-ink-700">
          <input
            type="checkbox"
            checked={adjustBalance}
            onChange={(e) => setAdjustBalance(e.target.checked)}
            className="h-4 w-4 accent-brand-500"
          />
          Move the user&apos;s balance (recommended)
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
            disabled={busy}
            className="btn btn-brand flex-1 disabled:opacity-60"
          >
            {busy ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Plus className="h-4 w-4" />
            )}
            Post transaction
          </button>
        </div>
      </div>
    </Modal>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <label className="block">
      <span className="text-[12.5px] font-semibold text-ink-700">{label}</span>
      <div className="mt-1.5 modal-input">{children}</div>
      <style jsx>{`
        .modal-input :global(input),
        .modal-input :global(select) {
          width: 100%;
          height: 44px;
          border-radius: 12px;
          border: 1px solid #d9dee5;
          background: #fff;
          padding: 0 12px;
          font-size: 15px;
          outline: none;
          color: #0a0c10;
        }
        .modal-input :global(input:focus),
        .modal-input :global(select:focus) {
          border-color: #2f66ff;
          box-shadow: 0 0 0 1px #2f66ff;
        }
      `}</style>
    </label>
  );
}

function isoDaysAgo(n: number) {
  const d = new Date();
  d.setDate(d.getDate() - n);
  return d.toISOString().slice(0, 10);
}