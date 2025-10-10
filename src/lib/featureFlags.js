// Simple feature flag getter that supports both Vite-style and plain env vars
// Usage: getFlag('EN_MOBILE_FEED_SKIN', undefined)
export function getFlag(name, fallback = undefined) {
  try {
    // Prefer import.meta.env when available (Vite)
    const env = (typeof import.meta !== 'undefined' && import.meta.env) ? import.meta.env : {};
    const direct = env && Object.prototype.hasOwnProperty.call(env, name) ? env[name] : undefined;
    if (direct != null) return direct;

    // Support VITE_ prefix as a fallback for Vite deployments
    const vitePrefixedName = `VITE_${name}`;
    const viteVal = env && Object.prototype.hasOwnProperty.call(env, vitePrefixedName) ? env[vitePrefixedName] : undefined;
    if (viteVal != null) return viteVal;

    // Node-style process.env as a final fallback (SSR/build-time)
    const procEnv = (typeof process !== 'undefined' && process.env) ? process.env : {};
    if (procEnv && Object.prototype.hasOwnProperty.call(procEnv, name)) return procEnv[name];
    if (procEnv && Object.prototype.hasOwnProperty.call(procEnv, vitePrefixedName)) return procEnv[vitePrefixedName];

    return fallback;
  } catch {
    return fallback;
  }
}
