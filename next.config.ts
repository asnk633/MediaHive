// next.config.ts
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // No unsupported experimental flags. LAN access still works today.
  // When Next enforces allowedDevOrigins in a future major,
  // we'll add it back in the correct place.
  
  // Performance optimizations
  experimental: {
    optimizePackageImports: [
      'lucide-react',
      'date-fns',
      'recharts',
      '@radix-ui/react-*',
      '@dnd-kit/*'
    ],
  },
  
  // Enable compression
  compress: true,
  
  // Optimize images
  images: {
    minimumCacheTTL: 60,
  },
  
  // Webpack optimizations
  webpack: (config) => {
    // Enable top level await
    config.experiments = {
      ...config.experiments,
      topLevelAwait: true,
    };
    
    // Enable minification
    if (process.env.NODE_ENV === 'production') {
      config.optimization.minimize = true;
    }
    
    return config;
  },
  
  // Add headers for compression and caching
  async headers() {
    return [
      {
        source: '/api/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip, deflate, br',
          },
        ],
      },
      {
        source: '/:path*',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
          {
            key: 'Vary',
            value: 'Accept-Encoding',
          },
          {
            key: 'Content-Encoding',
            value: 'gzip, deflate, br',
          },
        ],
      },
    ];
  },
};

export default nextConfig;