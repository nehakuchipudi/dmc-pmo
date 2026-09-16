import type { NextConfig } from "next";

const isGitHubPages = process.env.GITHUB_PAGES === "true";

const nextConfig: NextConfig = {
  output: "export",
  images: { unoptimized: true },
  trailingSlash: true,
  ...(isGitHubPages
    ? {
        basePath: "/dmc-pmo",
        assetPrefix: "/dmc-pmo/",
      }
    : {}),
};

export default nextConfig;
