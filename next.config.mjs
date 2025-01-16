/** @type {import('next').NextConfig} */
const nextConfig = {
  async rewrites() {
    return {
      beforeFiles: [
        {
          source: '/.well-known/health',
          destination: '/api/health'
        }
      ]
    }
  },
  // Suppress specific hydration warnings
  reactStrictMode: true,
  onDemandEntries: {
    // period (in ms) where the server will keep pages in the buffer
    maxInactiveAge: 25 * 1000,
    // number of pages that should be kept simultaneously without being disposed
    pagesBufferLength: 2,
  }
};

export default nextConfig;
