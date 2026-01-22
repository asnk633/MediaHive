import bundleAnalyzer from "@next/bundle-analyzer";

const withBundleAnalyzer = bundleAnalyzer({
  enabled: process.env.ANALYZE === "true",
});

const isMobile = process.env.IS_MOBILE === 'true';

const nextConfig = {
  // Static export
  output: isMobile ? 'export' : 'standalone',
  distDir: isMobile ? 'out' : '.next',
  // Asset prefix for mobile to ensure local file resolution
  assetPrefix: isMobile ? './' : undefined,
  basePath: isMobile ? '' : undefined, // Explicitly empty for mobile
  trailingSlash: true, // Required for Android WebView

  typedRoutes: false,

  // External packages (native modules that shouldn't be bundled)
  serverExternalPackages: ['better-sqlite3'],

  // Performance optimizations
  experimental: {
    serverActions: {
      bodySizeLimit: '10gb',
    },
    proxyClientMaxBodySize: '10gb',
    clientRouterFilter: false,
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-*',
      '@dnd-kit/*'
    ],
  },

  // Disable compression for debugging
  compress: false,

  // Optimize images
  images: {
    unoptimized: isMobile,
    minimumCacheTTL: 60,
    remotePatterns: [
      {
        protocol: 'https',
        hostname: 'firebasestorage.googleapis.com',
        port: '',
        pathname: '/v0/b/**',
      },
      {
        protocol: 'https',
        hostname: 'lh3.googleusercontent.com',
        port: '',
        pathname: '**',
      },
      {
        protocol: 'https',
        hostname: 'drive.google.com',
        port: '',
        pathname: '**',
      },
    ],
  },
};

export default withBundleAnalyzer(nextConfig);