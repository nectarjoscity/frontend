/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure consistent builds
  reactStrictMode: true,
  // Note: swcMinify is now enabled by default in Next.js 15+
  images: {
    // Allow external images (adjust domains as needed)
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '**',
      },
    ],
  },
};

export default nextConfig;
