const cache = require('../js/cache');

describe('Cache System', () => {
  beforeEach(() => {
    cache.clear();
  });

  test('should store and retrieve values', () => {
    cache.set('test', 'value');
    expect(cache.get('test')).toBe('value');
  });

  test('should return null for non-existent keys', () => {
    expect(cache.get('nonexistent')).toBeNull();
  });

  test('should handle TTL expiration', () => {
    cache.set('test', 'value');
    // Mock Date.now to simulate time passing
    const originalDateNow = Date.now;
    let currentTime = Date.now();
    Date.now = jest.fn(() => currentTime);
    
    // Test TTL expiration
    currentTime += cache.ttl + 1000; // Advance time past TTL
    expect(cache.get('test')).toBeNull();
    
    // Restore Date.now
    Date.now = originalDateNow;
  });

  test('should clear all items', () => {
    cache.set('test1', 'value1');
    cache.set('test2', 'value2');
    cache.clear();
    expect(cache.get('test1')).toBeNull();
    expect(cache.get('test2')).toBeNull();
  });

  test('should cleanup expired items', () => {
    cache.set('test', 'value');
    const originalDateNow = Date.now;
    let currentTime = Date.now();
    Date.now = jest.fn(() => currentTime + cache.ttl + 1000);
    
    cache.cleanup();
    expect(cache.get('test')).toBeNull();
    
    Date.now = originalDateNow;
  });
}); 