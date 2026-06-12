/** @type {import('next').NextConfig} */
const nextConfig = {
  transpilePackages: ["@fieldo/types", "@fieldo/form-core", "@fieldo/renderer", "@fieldo/db"],
  experimental: {
    serverComponentsExternalPackages: ["better-sqlite3"],
  },
};

export default nextConfig;
