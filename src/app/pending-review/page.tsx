import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Logo } from "@/components/landing/Logo";
import { CheckCircle2, Clock, Mail, ShieldAlert } from "lucide-react";
import LogoutButton from "@/components/auth/LogoutButton";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function PendingReviewPage() {
  const u = await getCurrentUser();
  if (!u) redirect("/login");
  if (u.role === "admin") redirect("/admin");

  const sb = supabaseAdmin();
  let data:
    | {
        first_name?: string | null;
        onboarding_status?: string | null;
        rejection_reason?: string | null;
        created_at?: string | null;
      }
    | null = null;
  try {
    const res = await sb
      .from("users")
      .select("first_name, onboarding_status, rejection_reason, created_at")
      .eq("id", u.id)
      .single();
    data = res.data || null;
  } catch {
    data = null;
  }

  if (data?.onboarding_status === "APPROVED") redirect("/dashboard");

  const rejected = data?.onboarding_status === "REJECTED";

  return (
    <div className="min-h-screen bg-ink-50">
      <div className="h-16 flex items-center justify-between px-5 sm:px-8 bg-panel border-b border-ink-100">
        <Logo />
        <LogoutButton />
      </div>
      <div className="mx-auto max-w-2xl px-5 sm:px-8 py-8 sm:py-14">
        <div className="card p-6 sm:p-10 relative overflow-hidden">
          <div className="pointer-events-none absolute -top-24 -right-24 h-64 w-64 rounded-full bg-brand-500/10 blur-3xl" />
          <div className="pointer-events-none absolute -bottom-20 -left-20 h-48 w-48 rounded-full bg-azure-400/10 blur-3xl" />
          <div className="relative">
            {rejected ? (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-red-500/10 text-red-300 border border-red-500/20 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                  <ShieldAlert className="h-3.5 w-3.5" /> Application not approved
                </div>
                <h1 className="mt-5 text-[28px] sm:text-[36px] font-bold tracking-tight text-ink-900 leading-[1.1]">
                  We couldn't open your account.
                </h1>
                <p className="mt-3 text-[15.5px] text-ink-600 leading-relaxed">
                  Hi {data?.first_name || "there"}, after reviewing your application our compliance team wasn't able to open an account for you at this time.
                </p>
                {data?.rejection_reason && (
                  <div className="mt-5 rounded-2xl bg-red-500/10 border border-red-500/20 p-4">
                    <div className="text-[11px] font-bold uppercase tracking-[0.14em] text-red-300">Reason</div>
                    <div className="mt-1 text-[14px] text-red-300 leading-relaxed">{data.rejection_reason}</div>
                  </div>
                )}
              </>
            ) : (
              <>
                <div className="inline-flex items-center gap-2 rounded-full bg-brand-50 text-brand-700 border border-brand-100 px-3 py-1 text-[11px] font-bold uppercase tracking-[0.18em]">
                  <Clock className="h-3.5 w-3.5" /> Under review
                </div>
                <h1 className="mt-5 text-[28px] sm:text-[36px] font-bold tracking-tight text-ink-900 leading-[1.1]">
                  Thanks, {data?.first_name || "there"}. Your application is with our team.
                </h1>
                <p className="mt-3 text-[15.5px] text-ink-600 leading-relaxed">
                  Our compliance team is reviewing the information you provided. Under German banking regulations we verify every new account manually — this usually takes 1–2 business days.
                </p>

                <ul className="mt-6 space-y-3 text-[14px] text-ink-700">
                  <li className="flex items-start gap-3">
                    <CheckCircle2 className="h-5 w-5 text-brand-600 shrink-0 mt-0.5" />
                    <span>Application submitted and encrypted.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Clock className="h-5 w-5 text-amber-500 shrink-0 mt-0.5" />
                    <span>Identity and document verification — in progress.</span>
                  </li>
                  <li className="flex items-start gap-3">
                    <Mail className="h-5 w-5 text-ink-400 shrink-0 mt-0.5" />
                    <span>We'll email you the moment a decision is made.</span>
                  </li>
                </ul>

                <div className="mt-7 rounded-2xl bg-ink-50 border border-ink-100 p-4 text-[13.5px] text-ink-600 leading-relaxed">
                  <div className="text-[12px] font-semibold uppercase tracking-[0.14em] text-ink-500 mb-1">
                    What happens next
                  </div>
                  Once approved, your German IBAN is issued and you can sign in normally. If we need additional information, we'll email you directly — please check your inbox and spam folder over the next 48 hours.
                </div>
              </>
            )}

            <p className="mt-8 text-[12px] text-ink-400 leading-relaxed">
              Ridgeford Capital Bank AG — Kaiserstraße 16, 60311 Frankfurt am Main. Supervised by BaFin and the Deutsche Bundesbank.
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}
