import type { NextConfig } from "next";

const nextConfig: NextConfig = {
  // Performance optimizations with Turbopack compatibility
  experimental: {
    // Optimize CSS
    optimizeCss: true,
  },
  
  // Turbopack configuration
  turbopack: {
    root: __dirname,
  },
  
  // Bundle optimization (for webpack fallback)
  ...(process.env.USE_WEBPACK === 'true' ? {
    webpack: (config, { buildId, dev, isServer, defaultLoaders, webpack }) => {
      // Optimize bundle splitting
      config.optimization = {
        ...config.optimization,
        splitChunks: {
          chunks: 'all',
          cacheGroups: {
            vendor: {
              test: /[\\/]node_modules[\\/]/,
              name: 'vendors',
              chunks: 'all',
              priority: 10,
              enforce: true,
            },
            common: {
              name: 'common',
              minChunks: 2,
              chunks: 'all',
              priority: 5,
              enforce: true,
            },
          },
        },
        // Enable module concatenation
        concatenateModules: true,
        // Enable tree shaking
        usedExports: true,
        sideEffects: false,
      };
      
      // Add custom webpack plugins for performance
      if (!isServer) {
        // Bundle analyzer plugin for development
        if (dev) {
          const BundleAnalyzerPlugin = require('webpack-bundle-analyzer').BundleAnalyzerPlugin;
          config.plugins.push(
            new BundleAnalyzerPlugin({
              analyzerMode: 'static',
              openAnalyzer: false,
            })
          );
        }
        
        // Compression plugin
        config.plugins.push(
          new (require('compression-webpack-plugin'))({
            algorithm: 'gzip',
            test: /\.(js|css|html|svg)$/,
            threshold: 8192,
            minRatio: 0.8,
          })
        );
      }
      
      return config;
    },
  } : {}),
  
  // Image optimization
  images: {
    domains: [],
    formats: ['image/webp', 'image/avif'],
    deviceSizes: [640, 750, 828, 1080, 1200, 1920, 2048, 3840],
    imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
    minimumCacheTTL: 60 * 60 * 24 * 30, // 30 days
    dangerouslyAllowSVG: true,
  },
  
  // Compiler optimizations
  compiler: {
    // Remove console logs in production
    removeConsole: process.env.NODE_ENV === 'production',
  },
  
  // Output optimizations
  output: 'standalone',
  
  // Headers for performance
  async headers() {
    return [
      {
        source: '/_next/static/(.*)',
        headers: [
          {
            key: 'Cache-Control',
            value: 'public, max-age=31536000, immutable',
          },
        ],
      },
    ];
  },
  
  // Redirects for performance
  async redirects() {
    return [
      // Redirect old routes to new ones
      {
        source: '/home',
        destination: '/dashboard',
        permanent: true,
      },
    ];
  },
  
  // Enable compression
  compress: true,
  
  // Power by header
  poweredByHeader: false,
  
  // Generate etags
  generateEtags: true,
  
  // Enable trailing slash
  trailingSlash: true,
  
  // Dist directory
  distDir: '.next',
  
  // Page extensions
  pageExtensions: ['ts', 'tsx', 'js', 'jsx', 'md', 'mdx'],
  
  // TypeScript configuration
  typescript: {
    ignoreBuildErrors: false,
  },
  
  // Environment variables
  env: {
    CUSTOM_KEY: process.env.CUSTOM_KEY,
  },
};

export default nextConfig;
