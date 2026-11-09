/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverActions: { bodySizeLimit: '6mb' } // receipts upload
  },
  eslint: { ignoreDuringBuilds: true }
};

export default nextConfig;
