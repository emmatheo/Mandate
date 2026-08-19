import { fileURLToPath } from 'node:url';

/**
 * The Midnight runtime ships as WebAssembly, so both bundlers need to be told
 * to treat `.wasm` as an async module rather than an asset to inline.
 *
 * The app is entirely client-side — there is no server route, and none should
 * be added: a server route is somewhere mandate rules could accidentally be
 * sent, and the whole design depends on that being impossible.
 */

const browserWs = fileURLToPath(new URL('./lib/browser-ws.ts', import.meta.url));

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  turbopack: {
    resolveAlias: {
      // The indexer provider pulls in `isomorphic-ws`, whose ESM entry re-exports
      // the Node `ws` package in a shape that cannot resolve for a browser
      // target. Browsers already have WebSocket.
      //
      // Turbopack resolves alias targets relative to the project root, so this
      // one stays a relative specifier while webpack below takes the absolute.
      'isomorphic-ws': './lib/browser-ws.ts',
    },
  },

  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };

    if (!isServer) {
      config.resolve.alias = {
        ...config.resolve.alias,
        'isomorphic-ws': browserWs,
      };
      // Node built-ins reached only by the server-side branches of the Midnight
      // packages; the browser branches never touch them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
        net: false,
        tls: false,
        bufferutil: false,
        'utf-8-validate': false,
      };
    }

    return config;
  },
};

export default nextConfig;
