"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { Search, Ban, CheckCircle2, Loader2, UserPlus } from "lucide-react";
import { fmtMoney, fmtDate, hashStr, cx } from "@/lib/utils";

type U = {
  id: string;
  email: string;
  first_name: string | null;
  last_name: string | null;
  blocked: boolean;
  blocked_reason: string | null;
  iban: string | null;
  balance_checking: number | string;
  balance_savings: number | string;
  created_at: string;
};

export default function AdminUsersPage() {
  const [users, setUsers] = useState<U[] | null>(null);
  const [q, setQ] = useState("");
  const [busy, setBusy] = useState<string | null>(null);

  async function load() {
    const r = await fetch(`/api/admin/users${q ? `?q=${encodeURIComponent(q)}` : ""}`);
    const d = await r.json();
    setUsers(d.users || []);
  }

  useEffect(() => {
    load();
    // eslint-disable-next-line
  }, []);

  async function toggleBlock(u: U) {
    const block = !u.blocked;
    let reason: string | null = null;
    if (block) {
      reason = prompt("Reason for suspending this account (shown in email):", "Suspicious activity");
      if (reason === null) return; // cancelled
    }
    setBusy(u.id);
    try {
      const r = await fetch(`/api/admin/users/${u.id}/block`, {
        method: "POST",
        headers: { "content-type": "application/json" },
        body: JSON.stringify({ block, reason }),
      });
      const d = await r.json();
      if (!r.ok || !d.ok) throw new Error(d.error || "Action failed");
      await load();
    } catch (e: any) {
      alert(e.message);
    } finally {
      setBusy(null);
    }
  }

  return (
    <div className="pt-6 space-y-5">
      <div className="flex items-end justify-between flex-wrap gap-4">
        <div>
          <h1 className="text-[28px] font-bold tracking-tight text-ink-900">Users</h1>
          <p className="text-[13.5px] text-ink-500 mt-1">
            Everyone with a Ridgeford Capital Bank account. Block / unblock and see their activity.
          </p>
        </div>

        {/* Open an account from the desk instead of waiting for a signup. */}
        <Link href="/admin/users/new" className="btn btn-primary h-10 text-[13.5px]">
          <UserPlus className="h-4 w-4" />
          Open an account
        </Link>
      </div>

      <form
        className="card p-3 flex items-center gap-2"
        onSubmit={(e) => {
          e.preventDefault();
          load();
        }}
      >
        <div className="relative flex-1">
          <Search className="h-4 w-4 text-ink-400 absolute left-3.5 top-1/2 -translate-y-1/2" />
          <input
            className="w-full h-10 rounded-full bg-ink-50 border border-ink-100 pl-10 pr-4 text-[14px] placeholder:text-ink-400 outline-none focus:bg-panel focus:border-ink-200"
            placeholder="Search by email or name…"
            value={q}
            onChange={(e) => setQ(e.target.value)}
          />
        </div>
        <button className="btn btn-primary h-10">Search</button>
      </form>

      <div className="card p-0 overflow-x-auto">
        {users === null ? (
          <div className="p-10 text-center text-[14px] text-ink-400">
            <Loader2 className="inline h-4 w-4 animate-spin mr-2" />
            Loading…
          </div>
        ) : users.length === 0 ? (
          <div className="p-10 text-center text-[14px] text-ink-500">No users found.</div>
        ) : (
          <table className="w-full text-left min-w-[720px]">
            <thead className="bg-ink-50/60 text-[11.5px] font-semibold uppercase tracking-wide text-ink-500">
              <tr>
                <th className="px-5 py-3">Name</th>
                <th className="px-5 py-3">Email</th>
                <th className="px-5 py-3">Balance</th>
                <th className="px-5 py-3">Joined</th>
                <th className="px-5 py-3">Status</th>
                <th className="px-5 py-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-ink-100">
              {users.map((u) => {
                const name = [u.first_name, u.last_name].filter(Boolean).join(" ") || "—";
                return (
                  <tr key={u.id} className="hover:bg-ink-50/40 transition">
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="h-9 w-9 rounded-full grid place-items-center text-[12px] font-bold text-white shrink-0"
                          style={{
                            background: `linear-gradient(135deg, hsl(${hashStr(u.id) % 360} 60% 45%), hsl(${(hashStr(u.id) + 40) % 360} 60% 35%))`,
                          }}
                        >
                          {((u.first_name?.[0] || u.email[0] || "U") + (u.last_name?.[0] || "")).toUpperCase()}
                        </div>
                        <Link
                          href={`/admin/users/${u.id}`}
                          className="text-[14px] font-semibold text-ink-900 hover:underline"
                        >
                          {name}
                        </Link>
                      </div>
                    </td>
                    <td className="px-5 py-3 text-[13.5px] text-ink-700">{u.email}</td>
                    <td className="px-5 py-3 text-[13.5px] font-semibold text-ink-900 tabular-nums">
                      {fmtMoney(Number(u.balance_checking) + Number(u.balance_savings))}
                    </td>
                    <td className="px-5 py-3 text-[13px] text-ink-500">{fmtDate(u.created_at)}</td>
                    <td className="px-5 py-3">
                      <span
                        className={cx(
                          "inline-flex items-center rounded-full text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5",
                          u.blocked ? "bg-red-500/15 text-red-300" : "bg-brand-500/10 text-brand-700"
                        )}
                      >
                        {u.blocked ? "Blocked" : "Active"}
                      </span>
                    </td>
                    <td className="px-5 py-3 text-right">
                      <button
                        onClick={() => toggleBlock(u)}
                        disabled={busy === u.id}
                        className={cx(
                          "btn h-9 px-3.5 disabled:opacity-60",
                          u.blocked
                            ? "bg-brand-500 text-white hover:bg-brand-600"
                            : "border border-red-500/30 bg-red-500/10 text-red-300 hover:bg-red-500/15"
                        )}
                      >
                        {busy === u.id ? (
                          <Loader2 className="h-4 w-4 animate-spin" />
                        ) : u.blocked ? (
                          <CheckCircle2 className="h-4 w-4" />
                        ) : (
                          <Ban className="h-4 w-4" />
                        )}
                        {u.blocked ? "Unblock" : "Block"}
                      </button>
                    </td>
                  </tr>
                );
              })}
            </tbody>
          </table>
        )}
      </div>
    </div>
  );
}
