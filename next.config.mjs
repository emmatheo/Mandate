/**
 * The Midnight runtime ships as WebAssembly, so both bundlers need to be told
 * to treat `.wasm` as an async module rather than an asset to inline.
 *
 * The app is entirely client-side — there is no server route, and none should
 * be added: a server route is somewhere mandate rules could accidentally be
 * sent, and the whole design depends on that being impossible.
 */

/** @type {import('next').NextConfig} */
const nextConfig = {
  reactStrictMode: true,

  turbopack: {
    // Turbopack resolves the generated contract package through the workspace
    // symlink; nothing further is needed for WASM.
    resolveAlias: {},
  },

  webpack(config, { isServer }) {
    config.experiments = { ...config.experiments, asyncWebAssembly: true, topLevelAwait: true };

    if (!isServer) {
      // These are Node built-ins reached only by the server-side branches of the
      // Midnight packages; the browser branches never touch them.
      config.resolve.fallback = {
        ...config.resolve.fallback,
        fs: false,
        path: false,
        crypto: false,
      };
    }

    return config;
  },
};

export default nextConfig;
