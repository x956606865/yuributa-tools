const TerserPlugin = require('terser-webpack-plugin');

const withBundleAnalyzer = require('@next/bundle-analyzer')({
  enabled: process.env.ANALYZE === 'true',
});

module.exports = withBundleAnalyzer({
  reactStrictMode: false,
  eslint: {
    ignoreDuringBuilds: true,
  },
  webpack: (config, { isServer }) => {
    // 配置添加支持.ejs文件的加载器

    config.module.rules.push({
      test: /\.ejs$/,
      use: ['raw-loader'],
    });
    config.module.rules.push({
      test: /\.xml$/,
      use: ['raw-loader'],
    });
    config.optimization = {
      minimize: true,
      minimizer: [
        new TerserPlugin({
          // 排除混淆node_modules文件夹中的文件
          exclude: /node_modules/,
        }),
      ],
    };
    return config;
  },
});
