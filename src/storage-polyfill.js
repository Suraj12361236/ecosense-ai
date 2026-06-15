// ---------------------------------------------------------------------------
// window.storage polyfill
// ---------------------------------------------------------------------------
// The app code was written for the Claude.ai artifact sandbox, which provides
// a built-in `window.storage` key-value API (get/set/delete/list), with an
// optional `shared` flag for data visible to all users.
//
// Outside that sandbox there's no such API, so this file provides a drop-in
// replacement using the browser's localStorage.
//
// IMPORTANT LIMITATION:
// localStorage is per-browser, per-device. That means:
//   - Personal data (shared = false) works fine — it persists for that user
//     on that device/browser.
//   - "Shared" data (shared = true), like the community leaderboard, will
//     NOT actually be shared across users once deployed — each visitor will
//     only see their own local copy.
//
// To get a real shared leaderboard in production, replace the `shared` branch
// below with calls to a real backend (e.g. Supabase, Firebase, or your own
// API + database) and keep the same get/set/delete/list signatures so the
// rest of the app keeps working unchanged.
// ---------------------------------------------------------------------------

const PREFIX = "ecosense:";
const SHARED_PREFIX = "ecosense:shared:";

function keyFor(key, shared) {
  return (shared ? SHARED_PREFIX : PREFIX) + key;
}

function listAllKeys(prefix, shared) {
  const fullPrefix = (shared ? SHARED_PREFIX : PREFIX) + (prefix || "");
  const out = [];
  for (let i = 0; i < localStorage.length; i++) {
    const k = localStorage.key(i);
    if (k && k.startsWith(fullPrefix)) {
      out.push(k.slice((shared ? SHARED_PREFIX : PREFIX).length));
    }
  }
  return out;
}

const storagePolyfill = {
  async get(key, shared = false) {
    const raw = localStorage.getItem(keyFor(key, shared));
    if (raw === null) {
      // Match the sandbox behaviour: missing keys throw rather than
      // returning null, so callers should use try/catch.
      throw new Error(`Key not found: ${key}`);
    }
    return { key, value: raw, shared };
  },

  async set(key, value, shared = false) {
    try {
      localStorage.setItem(keyFor(key, shared), value);
      return { key, value, shared };
    } catch (err) {
      return null;
    }
  },

  async delete(key, shared = false) {
    localStorage.removeItem(keyFor(key, shared));
    return { key, deleted: true, shared };
  },

  async list(prefix = "", shared = false) {
    return { keys: listAllKeys(prefix, shared), prefix, shared };
  },
};

if (typeof window !== "undefined" && !window.storage) {
  window.storage = storagePolyfill;
}

export default storagePolyfill;
