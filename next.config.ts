import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This directory sits inside a larger repo that has its own lockfile, so
  // Turbopack's root inference picks the parent. Pin it here.
  turbopack: { root: __dirname },
  // Emit a self-contained server (.next/standalone) so a Docker image can be the
  // runtime only, without node_modules or the build toolchain.
  output: 'standalone'
};

export default nextConfig;
