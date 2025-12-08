/** @type {import('next').NextConfig} */
const nextConfig = {
  // Ensure consistent builds
  reactStrictMode: true,
  // Static export - generates pure HTML/CSS/JS, no serverless functions
  output: 'export',
  // Note: swcMinify is now enabled by default in Next.js 15+
  images: {
    // Required for static export
    unoptimized: true,
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
