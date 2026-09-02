import { supabaseAdmin } from "@/lib/supabase/admin";
import Link from "next/link";
import { Users, ArrowLeftRight, Clock, Ban } from "lucide-react";
import { fmtMoney, fmtRelativeDate } from "@/lib/utils";

export const dynamic = "force-dynamic";

export default async function AdminHome() {
  const sb = supabaseAdmin();

  const [{ count: userCount }, { count: pendingCount }, { count: blockedCount }, { data: recentTransfers }] =
    await Promise.all([
      sb.from("users").select("id", { count: "exact", head: true }).neq("role", "admin"),
      sb.from("transfers").select("id", { count: "exact", head: true }).eq("status", "pending_admin"),
      sb.from("users").select("id", { count: "exact", head: true }).eq("blocked", true),
      sb.from("transfers").select("*").order("created_at", { ascending: false }).limit(8),
    ]);

  const KPIS = [
    { label: "Users", value: userCount ?? 0, Icon: Users, href: "/admin/users" },
    { label: "Pending transfers", value: pendingCount ?? 0, Icon: Clock, href: "/admin/transfers?status=pending_admin", accent: true },
    { label: "Blocked accounts", value: blockedCount ?? 0, Icon: Ban, href: "/admin/users" },
    { label: "Total transfers", value: recentTransfers?.length ?? 0, Icon: ArrowLeftRight, href: "/admin/transfers" },
  ];

  return (
    <div className="pt-4 sm:pt-6 space-y-4 sm:space-y-5">
      <div>
        <h1 className="text-[24px] sm:text-[28px] font-bold tracking-tight text-ink-900">
          Overview
        </h1>
        <p className="text-[13px] sm:text-[13.5px] text-ink-500 mt-1">
          Everything that needs your attention, in one place.
        </p>
      </div>

      <div className="grid grid-cols-1 xs:grid-cols-2 lg:grid-cols-4 gap-3">
        {KPIS.map((k) => (
          <Link
            key={k.label}
            href={k.href}
            className="card p-4 sm:p-5 hover:shadow-pop transition"
          >
            <div className="flex items-center justify-between gap-3">
              <span className="text-[11px] sm:text-[11.5px] font-semibold uppercase tracking-[0.14em] text-ink-500">
                {k.label}
              </span>
              <k.Icon className={`h-4 w-4 shrink-0 ${k.accent ? "text-amber-400" : "text-ink-400"}`} />
            </div>
            <div className="mt-2 text-[28px] sm:text-[34px] font-bold text-ink-900 tracking-tight break-words">
              {k.value}
            </div>
          </Link>
        ))}
      </div>

      <div className="card p-4 sm:p-6">
        <div className="flex items-center justify-between gap-3">
          <h2 className="text-[16px] sm:text-[17px] font-semibold text-ink-900">
            Latest transfers
          </h2>
          <Link
            href="/admin/transfers"
            className="text-[12.5px] sm:text-[13px] font-semibold text-ink-700 hover:underline shrink-0"
          >
            See all
          </Link>
        </div>

        <ul className="mt-4 divide-y divide-ink-100">
          {(recentTransfers || []).map((t) => (
            <li
              key={t.id}
              className="py-3 flex flex-col sm:flex-row sm:items-center gap-2 sm:gap-4"
            >
              <div className="flex-1 min-w-0">
                <div className="text-[14px] font-semibold text-ink-900 break-words sm:truncate">
                  {t.reference_id} · {t.beneficiary_name}
                </div>
                <div className="text-[11.5px] text-ink-400 break-words">
                  {fmtRelativeDate(t.created_at)} · {t.rail}
                </div>
              </div>

              <div className="flex items-center justify-between gap-3 sm:justify-end sm:gap-4">
                <div className="text-[14px] font-bold text-ink-900 tabular-nums">
                  {fmtMoney(Number(t.amount))}
                </div>
                <StatusPill status={t.status} />
              </div>
            </li>
          ))}

          {(recentTransfers || []).length === 0 && (
            <li className="py-6 text-center text-[13.5px] text-ink-400">
              No transfers yet.
            </li>
          )}
        </ul>
      </div>
    </div>
  );
}

function StatusPill({ status }: { status: string }) {
  const map: Record<string, { bg: string; text: string; label: string }> = {
    pending_admin: { bg: "bg-amber-500/15", text: "text-amber-300", label: "Pending" },
    completed: { bg: "bg-brand-500/10", text: "text-brand-700", label: "Completed" },
    approved: { bg: "bg-brand-500/10", text: "text-brand-700", label: "Approved" },
    rejected: { bg: "bg-red-500/15", text: "text-red-300", label: "Rejected" },
    canceled: { bg: "bg-ink-100", text: "text-ink-700", label: "Canceled" },
  };

  const s = map[status] || { bg: "bg-ink-100", text: "text-ink-700", label: status };

  return (
    <span
      className={`inline-flex items-center rounded-full ${s.bg} ${s.text} text-[10.5px] font-bold uppercase tracking-wide px-2 py-0.5 shrink-0`}
    >
      {s.label}
    </span>
  );
}