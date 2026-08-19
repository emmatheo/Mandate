/**
 * Browser WebSocket shim for `isomorphic-ws`.
 *
 * The indexer provider imports `isomorphic-ws`, whose ESM entry re-exports the
 * Node `ws` package in a shape the bundler cannot resolve for a browser target.
 * Browsers have a perfectly good `WebSocket` already, so `next.config.mjs`
 * aliases that module to this file for client builds.
 */

const NativeWebSocket = globalThis.WebSocket;

export { NativeWebSocket as WebSocket };
export default NativeWebSocket;
