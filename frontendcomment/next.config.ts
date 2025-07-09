/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  async rewrites() {
    return [
      {
        source: '/api/:path*',
        destination: 'http://backend:5000/:path*', // docker backend service
      },
    ];
  },
};

module.exports = nextConfig;
