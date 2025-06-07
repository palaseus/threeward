// cache.js - In-memory caching system for blog posts
const cache = {
  store: new Map(),
  ttl: 1000 * 60 * 60, // 1 hour TTL

  set(key, value) {
    this.store.set(key, {
      value,
      timestamp: Date.now()
    });
  },

  get(key) {
    const item = this.store.get(key);
    if (!item) return null;

    // Check if item has expired
    if (Date.now() - item.timestamp > this.ttl) {
      this.store.delete(key);
      return null;
    }

    return item.value;
  },

  has(key) {
    return this.get(key) !== null;
  },

  clear() {
    this.store.clear();
  },

  // Remove expired items
  cleanup() {
    const now = Date.now();
    for (const [key, item] of this.store.entries()) {
      if (now - item.timestamp > this.ttl) {
        this.store.delete(key);
      }
    }
  }
};

// Run cleanup every hour
setInterval(() => cache.cleanup(), cache.ttl);

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = cache;
}

// Client-side caching functionality
const clientCache = {
  init() {
    this.cache = new Map();
  },

  set(key, value) {
    this.cache.set(key, value);
  },

  get(key) {
    return this.cache.get(key);
  },

  has(key) {
    return this.cache.has(key);
  },

  delete(key) {
    this.cache.delete(key);
  },

  clear() {
    this.cache.clear();
  }
};

// Initialize cache
clientCache.init(); 