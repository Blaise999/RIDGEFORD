import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { supabaseAdmin } from "@/lib/supabase/admin";
import { Logo } from "@/components/landing/Logo";
import { DashSidebar } from "@/components/dashboard/DashSidebar";
import { DashTopbar } from "@/components/dashboard/DashTopbar";
import { FlaggedBanner } from "@/components/dashboard/FlaggedBanner";
import { SupportWidget } from "@/components/support/SupportWidget";

// The dashboard is always per-user and reads the session cookie. Without
// this hint Next will sometimes try to pre-render or cache aggressively
// and the cookies() call ends up out of sync with the actual request.
export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");
  if (user.role === "admin") redirect("/admin");

  const sb = supabaseAdmin();
  // Tolerate a failed extra query — the layout used to assume `data` was
  // always populated; if Supabase is briefly unreachable the layout would
  // throw and you'd see the "Application error" screen.
  let extra: {
    first_name?: string | null;
    blocked?: boolean | null;
    blocked_reason?: string | null;
    blocked_at?: string | null;
    onboarding_status?: string | null;
  } | null = null;

  try {
    const { data } = await sb
      .from("users")
      .select("first_name, blocked, blocked_reason, blocked_at, onboarding_status")
      .eq("id", user.id)
      .single();
    extra = data || null;
  } catch {
    extra = null;
  }

  // Pending / rejected onboarding still gates here (they haven't been approved).
  // If we couldn't read onboarding_status at all, fall through to the
  // dashboard rather than dumping the user in a redirect loop.
  if (extra && extra.onboarding_status && extra.onboarding_status !== "APPROVED") {
    // KYC_REQUIRED (new, or compliance asked for more) → back into the wizard.
    // Everything else is "with us, waiting" → the status page.
    redirect(extra.onboarding_status === "KYC_REQUIRED" ? "/kyc" : "/pending-review");
  }

  // Blocked users can sign in and see their dashboard read-only.
  // Writes (transfers, vault moves, etc.) are rejected server-side.
  return (
    <div className="min-h-screen bg-ink-50">
      <DashSidebar />
      <div className="lg:pl-64">
        <DashTopbar user={user} />
        {user.blocked && (
          <FlaggedBanner
            reason={extra?.blocked_reason || null}
            blockedAt={extra?.blocked_at || null}
          />
        )}
        <main className="px-5 sm:px-8 pb-16 pt-4">{children}</main>
        {/*
          Three items on one row collided on a phone — the lockup, the legal
          line and the support link all fighting for ~350px. They stack below
          640px (see .site-footer__in), and the whole bar sits above a rule so
          it reads as a footer rather than as loose text after the content.
          Berlin was also wrong: the registered office is Frankfurt.
        */}
        <footer className="mt-4 border-t border-ink-200 px-5 sm:px-8 py-7 text-[12px] text-ink-400">
          <div className="site-footer__in flex items-center justify-between gap-6 flex-wrap">
            <Logo size="sm" />
            <span className="site-footer__legal">
              © {new Date().getFullYear()} Ridgeford Capital Bank AG · Kaiserstraße 16,
              60311 Frankfurt am Main
            </span>
            <a
              href="mailto:support@ridgefordbank.eu"
              className="hover:text-ink-700 transition whitespace-nowrap"
            >
              Need help? support@ridgefordbank.eu
            </a>
          </div>
        </footer>
      </div>
      <SupportWidget />
    </div>
  );
}
