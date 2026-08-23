import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export function LegalPage({
  title,
  updated,
  intro,
  children,
}: {
  title: string;
  updated: string;
  intro?: string;
  children: React.ReactNode;
}) {
  return (
    <div className="min-h-screen bg-background">
      <div className="mx-auto flex max-w-md flex-col gap-6 px-5 py-8">
        <Link href="/" className="flex items-center gap-1 text-sm text-foreground/60">
          <ArrowLeft className="h-4 w-4" /> Back to home
        </Link>

        <div>
          <h1 className="text-2xl font-bold">{title}</h1>
          <p className="mt-1 text-xs text-foreground/50">Last updated: {updated}</p>
          {intro && <p className="mt-3 text-sm leading-relaxed text-foreground/70">{intro}</p>}
        </div>

        <div className="flex flex-col gap-6">{children}</div>
      </div>
    </div>
  );
}

export function LegalSection({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <section>
      <h2 className="mb-2 text-base font-bold">{title}</h2>
      <div className="flex flex-col gap-2 text-sm leading-relaxed text-foreground/70">{children}</div>
    </section>
  );
}
