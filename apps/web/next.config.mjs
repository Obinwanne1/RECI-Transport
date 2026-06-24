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
      {
        protocol: 'https',
        hostname: '**.wikimedia.org',
      },
    ],
  },
  async rewrites() {
    const adminUrl = process.env.ADMIN_URL || 'http://localhost:3001'
    return [
      {
        source: '/admin/:path*',
        destination: `${adminUrl}/admin/:path*`,
      },
    ]
  },
}

export default nextConfig
