import type { NextConfig } from 'next';

const nextConfig: NextConfig = {
  reactStrictMode: true,
  poweredByHeader: false,
  // This directory sits inside a larger repo that has its own lockfile, so
  // Turbopack's root inference picks the parent. Pin it here.
  turbopack: { root: __dirname },
  // Emit a self-contained server (.next/standalone) so a Docker image can be the
  // runtime only, without node_modules or the build toolchain.
  output: 'standalone',
  // Sign-in moved out of the console. A real redirect, before anything renders;
  // the query string (?next=…) is carried over.
  async redirects() {
    return [{ source: '/app/signin', destination: '/signin', permanent: false }];
  }
};

export default nextConfig;
