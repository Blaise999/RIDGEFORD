import { SupportThread } from "@/components/admin/SupportThread";

export const dynamic = "force-dynamic";

export default async function AdminSupportThreadPage({
  params,
}: {
  params: Promise<{ userId: string }>;
}) {
  const { userId } = await params;
  return <SupportThread userId={userId} />;
}
