import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Without this, Next bundles @prisma/client's generated code straight into
  // the compiled route-handler output at build time - a schema change then
  // needs a full rebuild+redeploy to take effect, not just `prisma generate`
  // + restart on the server, since the server would otherwise keep serving
  // whatever client was baked in at the last build.
  serverExternalPackages: ["@prisma/client", "prisma"],
};

export default nextConfig;
