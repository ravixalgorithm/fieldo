/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fieldo/types", "@fieldo/form-core", "@fieldo/renderer", "@fieldo/db"],
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.externals.push({ "better-sqlite3": "commonjs better-sqlite3" });
    }
    return config;
  },
};

export default nextConfig;
