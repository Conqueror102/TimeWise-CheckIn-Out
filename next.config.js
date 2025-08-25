const nextConfig = {
  serverExternalPackages: ["mongodb"],
  images: {
    domains: ["localhost"],
  },
  eslint: {
    ignoreDuringBuilds: true,
  },
  typescript: {
    ignoreBuildErrors: true,
  },
  images: {
    unoptimized: true,
  },
  experimental: {
    // serverComponentsExternalPackages: ["mongodb"], // removed as it's now at root
  },
}

module.exports = nextConfig
