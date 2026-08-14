/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,
  // `output: 'standalone'` chi can khi dong goi Docker (Phase 4). Tren Windows
  // no tao symlink va that bai voi EPERM neu khong bat Developer Mode, nen
  // Phase 1 khong bat.

  images: {
    remotePatterns: [{ protocol: 'https', hostname: 'picsum.photos' }],
  },
  experimental: {
    serverComponentsExternalPackages: ['@ecommerce/auth-db', 'bcryptjs'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      // `serverComponentsExternalPackages` khong bat duoc package workspace vi
      // pnpm noi no bang symlink va Next doi chieu theo duong dan that. Danh
      // dau externals o day moi chac.
      //
      // Bat buoc phai external: neu webpack bundle Prisma client, no di tim
      // query engine bang cach quet nguoc thu muc va dam vao junction trong
      // profile Windows (`C:\Users\<ten>\Application Data`) -> EPERM.
      config.externals = [
        ...config.externals,
        ({ request }, callback) => {
          if (request === '@ecommerce/auth-db' || request?.includes('generated/prisma')) {
            return callback(null, `commonjs ${request}`);
          }
          return callback();
        },
      ];
    }
    return config;
  },
};

export default nextConfig;
