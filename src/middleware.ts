import { NextRequest, NextResponse } from "next/server";
import { rateLimit } from "@/lib/server/rate-limit";

const MUTATING_METHODS = new Set(["POST", "PUT", "PATCH", "DELETE"]);
const CSRF_EXEMPT_PREFIXES = ["/api/webhooks/"];

function stripWww(host: string) {
  return host.startsWith("www.") ? host.slice(4) : host;
}

export async function middleware(req: NextRequest) {
  const { pathname } = req.nextUrl;

  if (pathname.startsWith("/api/")) {
    const ip = req.headers.get("x-forwarded-for")?.split(",")[0]?.trim() ?? "unknown";
    // Same shared-IP reasoning as the register endpoint: 120/min (2/sec) was
    // tight for a household/office/carrier-NAT IP with several real users
    // browsing at once, each page load firing multiple parallel API calls.
    const limited = await rateLimit(`global:${ip}`, 300, 60_000);
    if (!limited.success) {
      return NextResponse.json({ error: "Too many requests" }, { status: 429 });
    }

    const isExempt = CSRF_EXEMPT_PREFIXES.some((p) => pathname.startsWith(p));
    if (MUTATING_METHODS.has(req.method) && !isExempt) {
      const origin = req.headers.get("origin");
      const appUrl = process.env.NEXT_PUBLIC_APP_URL;
      if (origin && appUrl && stripWww(new URL(origin).host) !== stripWww(new URL(appUrl).host)) {
        return NextResponse.json({ error: "Cross-origin request blocked" }, { status: 403 });
      }
    }
  }

  const res = NextResponse.next();
  res.headers.set("X-Frame-Options", "DENY");
  res.headers.set("X-Content-Type-Options", "nosniff");
  res.headers.set("Referrer-Policy", "strict-origin-when-cross-origin");
  res.headers.set("Permissions-Policy", "microphone=(self), geolocation=(), camera=()");
  return res;
}

export const config = {
  matcher: "/((?!_next/static|_next/image|favicon.ico).*)",
};
