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
  async rewrites() {
    return [
      {
        source: '/admin/:path*',
        destination: 'http://localhost:3001/admin/:path*',
      },
    ]
  },
}

export default nextConfig
