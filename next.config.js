/** @type {import('next').NextConfig} */
const nextConfig = {
  experimental: {
    serverComponentsExternalPackages: ['mysql2', 'sql-escaper'],
  },
  webpack: (config, { isServer }) => {
    if (isServer) {
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        buffer: false,
        util: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        constants: false,
      };
    } else {
      // 在客户端禁用 Node.js 内置模块
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        net: false,
        tls: false,
        buffer: false,
        util: false,
        path: false,
        os: false,
        crypto: false,
        stream: false,
        http: false,
        https: false,
        zlib: false,
        constants: false,
      };
    }
    
    // 让 webpack 忽略 node: 协议的模块
    config.externals = [
      ...(config.externals || []),
      (context, request, callback) => {
        if (/^node:/i.test(request)) {
          return callback(null, `commonjs ${request}`);
        }
        callback();
      }
    ];

    return config;
  },
};

module.exports = nextConfig;