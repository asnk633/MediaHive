// For Android Capacitor builds, we need static export to generate the out/ directory
// But we also need to ensure API calls go to remote backend
const isMobile = process.env.IS_MOBILE === 'true';

// console.log('NEXT CONFIG — IS_MOBILE:', process.env.IS_MOBILE);
// console.log('NEXT CONFIG — NEXT_PUBLIC_API_URL:', process.env.NEXT_PUBLIC_API_URL);

/** @type {import('next').NextConfig} */
const nextConfig = {
  output: isMobile ? 'export' : undefined,
  trailingSlash: true,
  images: {
    unoptimized: true,
  },
  env: {
    IS_MOBILE: process.env.IS_MOBILE,
  },
};

export default nextConfig;
