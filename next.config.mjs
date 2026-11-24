/** @type {import('next').NextConfig} */
const nextConfig = {
  // When STATIC_EXPORT=true is set, outputs to 'out/' for standalone static hosts.
  // By default (undefined), builds standard Next.js for Vercel with native Serverless Route Handlers.
  output: process.env.STATIC_EXPORT === "true" ? "export" : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
