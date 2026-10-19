/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  images: {
    remotePatterns: [
      {
        protocol: 'https',
        hostname: '*.sharepoint.com',
      },
      {
        protocol: 'https',
        hostname: 'graph.microsoft.com',
      },
    ],
  },
};

export default nextConfig;
