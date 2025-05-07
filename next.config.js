/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    domains: [
      'simplerproofs.com',
      'localhost',
    ],
  },
  async redirects() {
    return [
      {
        source: '/dashboard',
        destination: '/dashboard/orders',
        permanent: true,
      },
    ];
  },
}

module.exports = nextConfig
