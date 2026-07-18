import { getSetting } from "@/lib/server/settings";

// Depends on a live DB read (the admin-configured logo), so it can't be
// statically prerendered at build time - render fresh on every request.
export const dynamic = "force-dynamic";

export default async function AuthLayout({ children }: { children: React.ReactNode }) {
  const logoUrl = await getSetting("site_logo_url", "");

  return (
    <div className="flex min-h-screen items-center justify-center gradient-brand px-4 py-10">
      <div className="w-full max-w-md">
        <div className="mb-6 text-center">
          {logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element -- admin-uploaded logo
            <img src={logoUrl} alt="SureCash Mining" className="mx-auto mb-2 h-24 w-auto" />
          ) : (
            <h1 className="text-2xl font-bold text-white">SureCash Mining</h1>
          )}
          <p className="mt-1 text-sm text-white/80">Earn with your voice, mining, and tasks.</p>
        </div>
        <div className="card p-6">{children}</div>
      </div>
    </div>
  );
}
