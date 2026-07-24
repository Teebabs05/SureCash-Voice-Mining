import { redirect } from "next/navigation";
import { getCurrentUser } from "@/lib/server/current-user";
import { getSession } from "@/lib/server/auth";
import { BottomNav } from "@/components/layout/bottom-nav";
import { TopBar } from "@/components/layout/top-bar";
import { IdleLogout } from "@/components/auth/idle-logout";
import { ImpersonationBanner } from "@/components/auth/impersonation-banner";

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const user = await getCurrentUser();
  if (!user) redirect("/login");

  const session = await getSession();
  const impersonating = Boolean(session?.impersonatedBy);

  return (
    <div className="mx-auto flex min-h-screen w-full max-w-md flex-col bg-background">
      <IdleLogout />
      {impersonating && <ImpersonationBanner userName={user.fullName} />}
      <TopBar title="SureCash Mining" />
      <main className="flex-1 px-4 pb-24 pt-4">{children}</main>
      <BottomNav />
    </div>
  );
}
