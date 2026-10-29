import os from 'node:os'
import type { NextConfig } from 'next'

// `next dev` only trusts localhost, so a phone opening the Network URL gets its
// dev assets and HMR requests blocked. Allow this machine's local addresses, and
// any extra hostnames listed in ALLOWED_DEV_ORIGINS (comma separated, no port).
const localAddresses = Object.values(os.networkInterfaces())
  .flatMap((addresses) => addresses ?? [])
  .filter((address) => address.family === 'IPv4' && !address.internal)
  .map((address) => address.address)

const extraOrigins = (process.env.ALLOWED_DEV_ORIGINS ?? '')
  .split(',')
  .map((origin) => origin.trim())
  .filter(Boolean)

const nextConfig: NextConfig = {
  allowedDevOrigins: [...new Set([...localAddresses, ...extraOrigins])],
  cacheComponents: true,
  partialPrefetching: true,
  experimental: {
    serverActions: {
      bodySizeLimit: '10mb',
    },
  },
}

export default nextConfig
