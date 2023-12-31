// const TerserPlugin = require('terser-webpack-plugin');

const path = require('path');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  swcMinify: false,
  // pageExtensions: ['tsx'],
  webpack: (config, { isServer }) => {
    // 配置添加支持.ejs文件的加载器
    config.resolve.alias['~'] = path.resolve(__dirname);

    config.module.rules.push({
      test: /\.ejs$/,
      use: ['raw-loader'],
    });
    config.module.rules.push({
      test: /\.xml$/,
      use: ['raw-loader'],
    });
    config.experiments = { asyncWebAssembly: true, layers: true };
    return config;
  },
});
