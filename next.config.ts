import type { NextConfig } from 'next'
import createNextIntlPlugin from 'next-intl/plugin'
// Bundle analyzer (gated)
const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
})

const withNextIntl = createNextIntlPlugin('./src/i18n.ts')

const baseConfig: NextConfig = {
  reactStrictMode: false,
  serverExternalPackages: ['@prisma/client', 'prisma'],
  webpack: (config, { webpack, isServer }) => {
    if (isServer) {
      config.plugins.push(
        new webpack.IgnorePlugin({
          resourceRegExp: /^(lokijs|@node-rs\/argon2|@node-rs\/bcrypt)$/,
        })
      )
    }

    config.externals.push({
      'utf-8-validate': 'commonjs utf-8-validate',
      bufferutil: 'commonjs bufferutil',
    })

    return config
  },
}

const nextConfig = withBundleAnalyzer(baseConfig)
export default withNextIntl(nextConfig)
