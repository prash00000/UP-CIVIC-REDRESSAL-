/** @type {import('next').NextConfig} */
const nextConfig = {
  // Next.js 15 App Router build targeting Vercel Serverless Route Handlers (/api/pincode, /api/feedback, /api/report)
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
};

export default nextConfig;
