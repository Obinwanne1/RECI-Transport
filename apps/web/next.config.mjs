/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ['@reci/ui', '@reci/utils', '@reci/types'],
  experimental: {
    serverComponentsExternalPackages: ['stripe'],
  },
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**.supabase.co',
      },
    ],
  },
}

export default nextConfig
