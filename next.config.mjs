import { withSentryConfig } from "@sentry/nextjs";

// For Android Capacitor builds, we need static export to generate the out/ directory
const isMobile = process.env.IS_MOBILE === 'true';

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isMobile ? 'export' : undefined,
  trailingSlash: isMobile,
  images: {
    unoptimized: true,
  },
  env: {
    IS_MOBILE: process.env.IS_MOBILE,
  },
  experimental: {
    proxyClientMaxBodySize: 250 * 1024 * 1024,      // 250MB
  },
  webpack: (config, { dev }) => {
    if (dev) {
      config.watchOptions = {
        ...config.watchOptions,
        ignored: ['**/node_modules/**', '**/test-results/**'],
      };
    }
    return config;
  },
};

// Sentry configuration options
const sentryConfig = {
  // For all available options, see:
  // https://github.com/getsentry/sentry-javascript/blob/master/packages/nextjs/src/config/types.ts

  // Suppresses source map uploading logs during bundling
  silent: true,
  org: "mediahive",
  project: "mediahive-app",

  // For all available options, see:
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/

  // Upload a larger set of source maps for better stack traces (increases build time)
  widenClientFileUpload: true,

  // Transpiles SDK to be compatible with IE11 (increases bundle size)
  transpileClientSDK: false,

  // Routes HTTP requests through "Monitoring Targets".
  // https://docs.sentry.io/platforms/javascript/guides/nextjs/manual-setup/#tunnel-requests
  tunnelRoute: "/monitoring",

  // Hides source maps from visitors
  hideSourceMaps: true,

  webpack: {
    // Automatically tree-shake Sentry logger statements to reduce bundle size
    treeshake: {
      removeDebugLogging: true,
    },
    // Enables automatic instrumentation of Vercel Cron Monitors.
    automaticVercelMonitors: true,
  },

  // Disable Sentry plugins during build in CI if auth token is missing to prevent build failure
  disableServerWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
  disableClientWebpackPlugin: !process.env.SENTRY_AUTH_TOKEN,
};

export default withSentryConfig(nextConfig, sentryConfig);
