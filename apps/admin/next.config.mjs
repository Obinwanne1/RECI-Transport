/** @type {import('next').NextConfig} */
const nextConfig = {
  basePath: '/admin',
  transpilePackages: ['@reci/ui', '@reci/utils', '@reci/types'],
}

export default nextConfig
