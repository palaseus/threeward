const { BlogAPI } = require('../js/api');

describe('BlogAPI', () => {
  let api;
  const mockOptions = {
    apiUrl: 'http://test-api',
    cacheKey: 'test_cache',
    cacheExpiry: 3600
  };

  beforeEach(() => {
    // Mock fetch
    global.fetch = jest.fn();

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0,
      removeItem: jest.fn()
    };
    global.localStorage = localStorageMock;

    // Create API instance
    api = new BlogAPI(mockOptions);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('getPosts', () => {
    it('should fetch posts successfully', async () => {
      const mockPosts = [
        { title: 'Post 1', slug: 'post-1' },
        { title: 'Post 2', slug: 'post-2' }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      });

      const result = await api.getPosts();
      expect(result).toEqual(mockPosts);
    });

    it('should handle API errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('API Error'));
      await expect(api.getPosts()).rejects.toThrow('API Error');
    });
  });

  describe('getPost', () => {
    it('should fetch a single post', async () => {
      const mockPost = { title: 'Test Post', slug: 'test-post' };

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPost)
      });

      const result = await api.getPost('test-post');
      expect(result).toEqual(mockPost);
    });

    it('should handle non-existent posts', async () => {
      global.fetch.mockResolvedValueOnce({
        ok: false,
        status: 404
      });

      await expect(api.getPost('non-existent')).rejects.toThrow('HTTP error! status: 404');
    });
  });

  describe('clearCache', () => {
    it('should clear all cached data', () => {
      // Set up test data
      localStorage.setItem('test_cache_posts', 'posts_data');
      localStorage.setItem('test_cache_post_test', 'post_data');
      localStorage.setItem('other_data', 'data');

      // Mock localStorage.key to return keys in order
      const keys = ['test_cache_posts', 'test_cache_post_test', 'other_data'];
      let keyIndex = 0;
      localStorage.key = jest.fn(() => keys[keyIndex++]);

      // Clear cache
      api.clearCache();

      // Verify cache was cleared
      expect(localStorage.getItem('test_cache_posts')).toBeNull();
      expect(localStorage.getItem('test_cache_post_test')).toBeNull();
      expect(localStorage.getItem('other_data')).toBe('data');
    });
  });
}); 