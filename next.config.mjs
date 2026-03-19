// Build configuration for different modes
const mode = process.env.BUILD_MODE || 'swarm'

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: 'export',
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    BUILD_MODE: mode,
  },
  basePath: mode === 'agent' ? '' : '',
}

export default nextConfig