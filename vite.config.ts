import { defineConfig, type ConfigEnv, type UserConfig } from "vite";
import react from "@vitejs/plugin-react-swc";
import path from "path";
import { componentTagger } from "lovable-tagger";
import { VitePWA } from 'vite-plugin-pwa';
import { visualizer } from 'rollup-plugin-visualizer';
import { createHtmlPlugin } from 'vite-plugin-html';
import viteCompression from 'vite-plugin-compression';
import legacy from '@vitejs/plugin-legacy';
import tailwindcss from 'tailwindcss';
import autoprefixer from 'autoprefixer';
import viteImagemin from 'vite-plugin-imagemin';

// https://vitejs.dev/config/
export default defineConfig(({ mode }: ConfigEnv): UserConfig => ({
  server: {
    host: "::",
    port: 8080,
    allowedHosts: [
      'localhost',
      'zaparound.com',
      'a5f2-24-202-133-152.ngrok-free.app'
    ],
    headers: {
      'X-Frame-Options': 'DENY',
      'X-Content-Type-Options': 'nosniff',
      'X-XSS-Protection': '1; mode=block',
      'Referrer-Policy': 'strict-origin-when-cross-origin',
      'Permissions-Policy': 'geolocation=(self), microphone=(self), camera=(self)',
      'Strict-Transport-Security': 'max-age=31536000; includeSubDomains',
      'Content-Security-Policy': "default-src 'self'; script-src 'self' 'unsafe-inline' 'unsafe-eval' https://www.googletagmanager.com https://www.google-analytics.com https://js.hcaptcha.com https://hcaptcha.com https://api.mapbox.com https://events.mapbox.com https://*.emrldtp.com https://emrldtp.com https://www.google.com https://www.gstatic.com https://sentry.avs.io https://cdn.jsdelivr.net https://widgets.aviasales.com https://*.aviasales.com https://www.aviasales.ru https://*.aviasales.ru https://tpwgts.com https://*.avsplow.com https://avsplow.com http://*.avsplow.com http://avsplow.com; style-src 'self' 'unsafe-inline' https://fonts.googleapis.com https://api.mapbox.com https://cdn.jsdelivr.net; font-src 'self' https://fonts.gstatic.com; img-src 'self' data: blob: https:; connect-src 'self' https: wss: https://ynvnzmkpifwteyuxondc.supabase.co https://api.mapbox.com https://events.mapbox.com https://open.er-api.com https://www.google.com https://www.gstatic.com https://*.emrldtp.com https://emrldtp.com https://sentry.avs.io https://zaparound.app.n8n.cloud https://widgets.aviasales.com https://*.aviasales.com https://www.aviasales.ru https://*.aviasales.ru https://tpwgts.com https://*.avsplow.com https://avsplow.com http://*.avsplow.com http://avsplow.com; frame-src 'self' https://hcaptcha.com https://*.hcaptcha.com https://www.google.com https://widgets.aviasales.com https://*.aviasales.com https://www.aviasales.ru https://*.aviasales.ru https://tpwgts.com https://*.avsplow.com https://avsplow.com http://*.avsplow.com http://avsplow.com; worker-src 'self' blob:; object-src 'none'; base-uri 'self'; form-action 'self';"
    },
  },
  build: {
    target: 'esnext', // Modern JS, allows BigInt literals
    cssCodeSplit: true,
    cssMinify: true,
    minify: 'terser',
    reportCompressedSize: false, // Faster builds
    chunkSizeWarningLimit: 1000, // Increased for better chunking
    // Generate source maps for all bundles to improve production debugging and satisfy Lighthouse audits
    sourcemap: true,
    terserOptions: {
      compress: {
        drop_console: mode === 'production',
        drop_debugger: true,
        pure_funcs: mode === 'production' ? ['console.log', 'console.info'] : [],
      },
      mangle: {
        safari10: true,
      },
      format: {
        comments: false,
      },
    },
    rollupOptions: {
      output: {
        manualChunks: (id) => {
          // Handle React core packages
          if (id.includes('node_modules/react/')) {
            return 'vendor-react-core';
          }
          if (id.includes('node_modules/react-dom/')) {
            return 'vendor-react-dom';
          }
          if (id.includes('node_modules/scheduler/')) {
            return 'vendor-react-scheduler';
          }
          
          // Handle React Router
          if (id.includes('node_modules/react-router-dom')) {
            return 'vendor-router-dom';
          }
          if (id.includes('node_modules/@remix-run/router')) {
            return 'vendor-router-core';
          }
          
          // Handle React Query
          if (id.includes('node_modules/@tanstack/react-query')) {
            // Split React Query into smaller chunks
            if (id.includes('/core/')) {
              return 'vendor-query-core';
            }
            if (id.includes('/devtools/')) {
              return 'vendor-query-devtools';
            }
            return 'vendor-query-main';
          }
          
          // Handle UI Components by category
          if (id.includes('node_modules/@radix-ui/')) {
            if (id.includes('/react-toast')) {
              return 'vendor-ui-toast';
            }
            if (id.includes('/react-tooltip')) {
              return 'vendor-ui-tooltip';
            }
            if (id.includes('/react-dialog')) {
              return 'vendor-ui-dialog';
            }
            return 'vendor-ui-core';
          }
          
          // Handle utility libraries
          if (id.includes('node_modules/class-variance-authority') ||
              id.includes('node_modules/clsx') ||
              id.includes('node_modules/tailwind-merge')) {
            return 'vendor-ui-utils';
          }
          
          // Handle Supabase
          if (id.includes('node_modules/@supabase/')) {
            if (id.includes('supabase-js')) {
              return 'vendor-supabase-client';
            }
            if (id.includes('gotrue-js')) {
              return 'vendor-supabase-auth';
            }
            if (id.includes('realtime-js')) {
              return 'vendor-supabase-realtime';
            }
            return 'vendor-supabase-other';
          }
          

          
          // Group remaining node_modules by first level package name
          if (id.includes('node_modules/')) {
            const matches = id.match(/node_modules\/(?:@[^/]+\/)?[^/]+/);
            if (matches) {
              return `vendor-${matches[0].replace(/[@/]/g, '-').substring(12)}`;
            }
            return 'vendor-others';
          }
          
          // Split app code by features
          if (id.includes('/src/pages/')) {
            const segments = id.split('/pages/')[1].split('/');
            if (segments.length > 1) {
              // Group related pages together
              const feature = segments[0].toLowerCase();
              return `page-${feature}`;
            }
            const name = segments[0].split('.')[0].toLowerCase();
            return `page-${name}`;
          }
          
          // Split components by feature
          if (id.includes('/src/components/')) {
            const match = id.match(/\/components\/([^/]+)/);
            if (match) {
              return `components-${match[1].toLowerCase()}`;
            }
            return 'components-shared';
          }
          
          // Split hooks by feature
          if (id.includes('/src/hooks/')) {
            const match = id.match(/\/hooks\/([^/]+)/);
            if (match) {
              return `hooks-${match[1].toLowerCase()}`;
            }
            return 'hooks-shared';
          }
          
          // Split utils by feature
          if (id.includes('/src/utils/')) {
            const match = id.match(/\/utils\/([^/]+)/);
            if (match) {
              return `utils-${match[1].toLowerCase()}`;
            }
            return 'utils-shared';
          }
        },
        chunkFileNames: (chunkInfo) => {
          const name = chunkInfo.name || '';
          if (name.startsWith('vendor-')) {
            return 'assets/js/vendor/[name].[hash].js';
          }
          if (name.startsWith('page-')) {
            return 'assets/js/pages/[name].[hash].js';
          }
          if (name.startsWith('components-')) {
            return 'assets/js/components/[name].[hash].js';
          }
          if (name.startsWith('hooks-')) {
            return 'assets/js/hooks/[name].[hash].js';
          }
          if (name.startsWith('utils-')) {
            return 'assets/js/utils/[name].[hash].js';
          }
          return 'assets/js/[name].[hash].js';
        },
        assetFileNames: (assetInfo) => {
          if (!assetInfo.name) return 'assets/[name].[hash][extname]';
          
          const extType = assetInfo.name.split('.').pop() || '';
          if (/png|jpe?g|svg|gif|tiff|bmp|ico/i.test(extType)) {
            return 'assets/images/[name].[hash][extname]';
          }
          if (/css/i.test(extType)) {
            return 'assets/css/[name].[hash][extname]';
          }
          return 'assets/[name].[hash][extname]';
        },
      },
    },
  },
  plugins: [
    react(),
    mode === 'development' && componentTagger(),

    // Plugin pour remplacer %BUILD_DATE% dans index.html par la date du build
    {
      name: 'html-transform-build-date',
      transformIndexHtml(html) {
        return html.replace(/%BUILD_DATE%/g, process.env.BUILD_DATE || new Date().toISOString());
      },
    },
    
    // Image optimization plugin
    viteImagemin({
      gifsicle: {
        optimizationLevel: 7,
        interlaced: false,
      },
      optipng: {
        optimizationLevel: 7,
      },
      mozjpeg: {
        quality: 75,
      },
      pngquant: {
        quality: [0.7, 0.8],
        speed: 4,
      },
      svgo: {
        plugins: [
          {
            name: 'removeViewBox',
            active: false,
          },
          {
            name: 'removeEmptyAttrs',
            active: false,
          },
        ],
      },
      webp: {
        quality: 75,
      },
    }),
    
    // SEO and Performance Optimization Plugins
    createHtmlPlugin({
      minify: {
        collapseWhitespace: true,
        removeComments: true,
        removeRedundantAttributes: true,
        removeScriptTypeAttributes: true,
        removeStyleLinkTypeAttributes: true,
        useShortDoctype: true,
        minifyCSS: true,
        minifyJS: true,
      },
      inject: {
        data: {
          title: 'ZapAround - Your Smart Travel Companion',
          description: 'Plan your trips with AI-assisted recommendations and discover the best places to visit or hangout with your friends.',
          keywords: 'ZapAround, travel companion, travel planner, AI travel guide, trip planning, road trip planner, travel recommendations, hangout planner, smart travel app, vacation planning',
          ogImage: 'https://zaparound.com/og-image.png',
          canonicalUrl: 'https://zaparound.com',
        },
      },
    }),
    
    // Compression plugins for better performance
    viteCompression({
      algorithm: 'gzip',
      ext: '.gz',
      threshold: 10240, // Only compress files larger than 10KB
    }),
    viteCompression({
      algorithm: 'brotliCompress',
      ext: '.br',
      threshold: 10240,
    }),
    
    // Legacy browser support
    // legacy({
    //   targets: ['defaults', 'not IE 11'],
    //   additionalLegacyPolyfills: ['regenerator-runtime/runtime'],
    //   renderLegacyChunks: true,
    //   polyfills: [
    //     'es.symbol',
    //     'es.promise',
    //     'es.promise.finally',
    //     'es/map',
    //     'es/set',
    //     'es.array.filter',
    //     'es.array.for-each',
    //     'es.array.flat-map',
    //     'es.object.define-properties',
    //     'es.object.define-property',
    //     'es.object.get-own-property-descriptor',
    //     'es.object.get-own-property-descriptors',
    //     'es.object.keys',
    //     'es.object.to-string',
    //     'web.dom-collections.for-each',
    //     'esnext.global-this',
    //     'esnext.string.match-all'
    //   ],
    // }),
    
    VitePWA({
      injectRegister: 'inline', // inline SW registration to remove additional network request
      registerType: 'autoUpdate',
      includeAssets: ['favicon.ico', 'robots.txt', 'apple-touch-icon.png', 'sitemap.xml', 'sitemap-news.xml'],
      manifest: {
        name: 'ZapAround',
        short_name: 'ZapAround',
        description: 'ZapAround - Your Smart Travel Companion. Plan your trips with recommendations and discover the best places to visit or hangout with your friends.',
        theme_color: '#61936f',
        background_color: '#fcfcfc',
        display: 'standalone',
        orientation: 'portrait',
        scope: '/',
        start_url: '/',
        icons: [
          {
            src: '/favicon.ico',
            sizes: '16x16 32x32',
            type: 'image/x-icon'
          },
          {
            src: '/apple-touch-icon.png',
            sizes: '180x180',
            type: 'image/png'
          },
          {
            src: '/zaparound-uploads/transparentnoliner.webp',
            sizes: '512x512',
            type: 'image/webp',
            purpose: 'any maskable'
          }
        ],
        categories: ['travel', 'lifestyle', 'productivity'],
        lang: 'en',
        dir: 'ltr',
        prefer_related_applications: false,
        related_applications: [],
        screenshots: [
          {
            src: '/zaparound-uploads/create-trip1.webp',
            sizes: '1280x720',
            type: 'image/webp',
            form_factor: 'wide',
            label: 'Trip Planning Interface'
          },
          {
            src: '/zaparound-uploads/create-trip2.webp',
            sizes: '750x1334',
            type: 'image/webp',
            form_factor: 'narrow',
            label: 'Mobile Trip Planning'
          }
        ]
      },
      workbox: {
        globPatterns: [
          '**/*.{js,css,html,ico,png,svg,jpg,jpeg,webp,woff,woff2,ttf,eot}',
          '**/*.gif'
        ],
        globIgnores: [
          '**/roundabout.gif' // Exclude large GIF from PWA cache
        ],
        maximumFileSizeToCacheInBytes: 5 * 1024 * 1024, // 5 MB limit
        runtimeCaching: [
          {
            urlPattern: /^https:\/\/fonts\.googleapis\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'google-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/fonts\.gstatic\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'gstatic-fonts-cache',
              expiration: {
                maxEntries: 10,
                maxAgeSeconds: 60 * 60 * 24 * 365 // 1 year
              }
            }
          },
          {
            urlPattern: /^https:\/\/ynvnzmkpifwteyuxondc\.supabase\.co\/.*/i,
            handler: 'NetworkFirst',
            options: {
              cacheName: 'supabase-cache',
              expiration: {
                maxEntries: 100,
                maxAgeSeconds: 60 * 60 * 24 // 1 day
              }
            }
          },
          {
            urlPattern: /^https:\/\/api\.mapbox\.com\/.*/i,
            handler: 'CacheFirst',
            options: {
              cacheName: 'mapbox-cache',
              expiration: {
                maxEntries: 50,
                maxAgeSeconds: 60 * 60 * 24 * 7 // 1 week
              }
            }
          }
        ],
        skipWaiting: true,
        clientsClaim: true,
        cleanupOutdatedCaches: true,
        sourcemap: false
      }
    }),
    
    // Bundle analyzer for development
    mode === 'development' && visualizer({
      filename: 'dist/stats.html',
      open: false,
      gzipSize: true,
      brotliSize: true,
    }),

    // ----------------------------------------------------------------------------------
    // Performance: async CSS – convert render-blocking <link rel="stylesheet"> tags
    //               into rel="preload" + onload switch with noscript fallback.
    //               This runs only in production build (apply: 'build').
    // ----------------------------------------------------------------------------------
    {
      name: 'html-async-css',
      apply: 'build',
      enforce: 'post',
      transformIndexHtml(html) {
        // Replace every blocking stylesheet with a non-blocking preload pattern.
        // Example:
        //   <link rel="stylesheet" href="/assets/index.abc.css">
        // becomes
        //   <link rel="preload" href="/assets/index.abc.css" as="style" onload="this.rel='stylesheet'">
        //   <noscript><link rel="stylesheet" href="/assets/index.abc.css"></noscript>
        return html.replace(/<link\s+([^>]*?)rel=['"]?stylesheet['"]?([^>]*?)>/gi, (fullMatch, beforeRel, afterRel) => {
          // Combine attribute chunks surrounding the rel attribute
          const allAttrs = (beforeRel + afterRel).trim();

          // Extract the href value (handles both single & double quotes)
          const hrefMatch = allAttrs.match(/href\s*=\s*(['"])(.*?)\1/i);
          if (!hrefMatch) {
            // If no href attribute is found, leave the tag untouched
            return fullMatch;
          }

          const href = hrefMatch[2];

          // Remove attributes that would otherwise be duplicated (rel, href). We'll re-add
          // href manually and optionally add an onload handler if the original tag did **not**
          // define one already. This guarantees we never output duplicate attributes which
          // would invalidate HTML and could break parsers / validators.

          // Detect if an onload attribute already exists so we can avoid duplicating it.
          const hasOnload = /onload\s*=/.test(allAttrs);

          // Strip rel="stylesheet", the original href attribute, *and* any surrounding spaces.
          // We leave an existing onload intact so it is preserved.
          const remainingAttrs = allAttrs
            .replace(/\s*rel=['"]?stylesheet['"]?/i, '')
            .replace(/\s*href\s*=\s*(['"]).*?\1/i, '')
            .trim();

          // Compose remaining attribute string (prefixed with a space if non-empty).
          const attrs = remainingAttrs ? ` ${remainingAttrs}` : '';

          // Only inject our async onload handler when the original tag did not have one.
          const preloadOnload = hasOnload ? '' : " onload=\"this.rel='stylesheet'\"";

          return `<link rel="preload" href="${href}" as="style"${attrs}${preloadOnload}>\n      <noscript><link rel="stylesheet" href="${href}"${attrs}></noscript>`;
        });
      },
    },
  ],
  resolve: {
    alias: {
      "@": path.resolve(__dirname, "./src"),
    },
  },
  css: {
    postcss: {
      plugins: [
        tailwindcss,
        autoprefixer,
      ],
    },
  },
  optimizeDeps: {
    include: [
      'react',
      'react-dom',
      'react-router-dom',
      '@tanstack/react-query',
      '@supabase/supabase-js',
      'framer-motion',
      'lucide-react',
      'class-variance-authority',
      'clsx',
      'tailwind-merge',
    ],
    exclude: ['@vitejs/plugin-legacy'],
  },
  define: {
    __APP_VERSION__: JSON.stringify(process.env.npm_package_version),
    __BUILD_TIME__: JSON.stringify(new Date().toISOString()),
  },
}));
