// Simple in-memory cache (replaces Redis for development)
class SimpleCache {
  constructor() {
    this.cache = new Map();
  }

  async get(key) {
    const item = this.cache.get(key);
    if (!item) return null;
    
    // Check if expired
    if (item.expiry && item.expiry < Date.now()) {
      this.cache.delete(key);
      return null;
    }
    
    return item.value;
  }

  async set(key, value, ttlSeconds = 3600) {
    this.cache.set(key, {
      value,
      expiry: ttlSeconds ? Date.now() + (ttlSeconds * 1000) : null
    });
  }

  async del(key) {
    this.cache.delete(key);
  }
}

module.exports = new SimpleCache();