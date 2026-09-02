import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/auth";
import { AdminSidebar } from "@/components/admin/AdminSidebar";
import { AdminTopbar } from "@/components/admin/AdminTopbar";

export const dynamic = "force-dynamic";
export const revalidate = 0;

export default async function AdminLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const user = await getCurrentUser();
  if (!user) redirect("/admin-login");
  if (user.role !== "admin") redirect("/dashboard");

  return (
    <div className="min-h-screen bg-ink-50">
      {/* Desktop sidebar: unchanged */}
      <div className="hidden lg:block">
        <AdminSidebar />
      </div>

      <div className="lg:pl-64">
        <AdminTopbar user={user} />

        {/* Mobile sidebar/nav visible */}
        <div className="lg:hidden border-b border-ink-100 bg-panel">
          <div className="overflow-x-auto">
            <div className="min-w-max">
              <AdminSidebar />
            </div>
          </div>
        </div>

        <main className="px-4 sm:px-5 lg:px-8 pb-16 pt-4 overflow-x-auto max-w-full">{children}</main>
      </div>
    </div>
  );
}