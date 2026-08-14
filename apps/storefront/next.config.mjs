/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `output: 'standalone'` chi can khi dong goi Docker (Phase 4). Tren Windows
  // no tao symlink va that bai voi EPERM neu khong bat Developer Mode, nen
  // Phase 1 khong bat.

  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
};

export default nextConfig;
