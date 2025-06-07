const { Renderer } = require('../server/render');
const fs = require('fs').promises;
const path = require('path');

// Mock fs.promises
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn(),
    readFile: jest.fn(),
    mkdir: jest.fn().mockResolvedValue(undefined),
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));

describe('Server-side Renderer', () => {
  let renderer;
  const mockPosts = [
    {
      slug: 'test-post-1',
      frontmatter: {
        title: 'Test Post 1',
        date: '2024-01-01',
        tags: ['test', 'post']
      },
      excerpt: 'Test excerpt 1',
      content: 'Test content 1'
    },
    {
      slug: 'test-post-2',
      frontmatter: {
        title: 'Test Post 2',
        date: '2024-01-02',
        tags: ['test', 'post']
      },
      excerpt: 'Test excerpt 2',
      content: 'Test content 2'
    }
  ];

  beforeEach(() => {
    renderer = new Renderer({ cacheDir: '/tmp/cache' });
    jest.clearAllMocks();
  });

  describe('initialization', () => {
    test('should create cache directory', async () => {
      await renderer.initializeCache();
      expect(fs.mkdir).toHaveBeenCalled();
    });

    test('should handle cache directory creation error', async () => {
      fs.mkdir.mockRejectedValueOnce(new Error('Permission denied'));
      await renderer.initializeCache();
      expect(fs.mkdir).toHaveBeenCalled();
    });
  });

  describe('rendering', () => {
    test('should render post HTML', () => {
      const html = renderer.renderPost(mockPosts[0]);
      expect(html).toContain(mockPosts[0].frontmatter.title);
      expect(html).toContain(mockPosts[0].frontmatter.date);
      expect(html).toContain('Test content 1');
      expect(html).toContain('window.__INITIAL_DATA__');
    });

    test('should render index HTML', () => {
      const html = renderer.renderIndex(mockPosts);
      expect(html).toContain('Threeward Blog');
      expect(html).toContain(mockPosts[0].frontmatter.title);
      expect(html).toContain('window.__INITIAL_DATA__');
    });

    test('should render tag filters', () => {
      const html = renderer.renderTagFilters(mockPosts);
      expect(html).toContain('test');
      expect(html).toContain('post');
      expect(html).toContain('role="checkbox"');
    });

    test('should render post list', () => {
      const html = renderer.renderPostList(mockPosts);
      expect(html).toContain(mockPosts[0].frontmatter.title);
      expect(html).toContain(mockPosts[0].frontmatter.date);
      expect(html).toContain(mockPosts[0].excerpt);
    });
  });

  describe('caching', () => {
    test('should use memory cache if available', async () => {
      const renderFn = jest.fn();
      renderer.cache.set('test-key', 'cached-content');
      
      const result = await renderer.getCached('test-key', renderFn);
      expect(result).toBe('cached-content');
      expect(renderFn).not.toHaveBeenCalled();
    });

    test('should use filesystem cache if available', async () => {
      const renderFn = jest.fn();
      fs.readFile.mockResolvedValueOnce('fs-cached-content');
      
      const result = await renderer.getCached('test-key', renderFn);
      expect(result).toBe('fs-cached-content');
      expect(renderFn).not.toHaveBeenCalled();
      expect(renderer.cache.get('test-key')).toBe('fs-cached-content');
    });

    test('should render and cache new content on cache miss', async () => {
      const renderFn = jest.fn().mockResolvedValue('new-content');
      fs.readFile.mockRejectedValueOnce(new Error('Not found'));
      
      const result = await renderer.getCached('test-key', renderFn);
      expect(result).toBe('new-content');
      expect(renderFn).toHaveBeenCalled();
      expect(fs.writeFile).toHaveBeenCalledWith(
        path.join('/tmp/cache', 'test-key.html'),
        'new-content'
      );
    });
  });

  describe('cache invalidation', () => {
    test('should invalidate post cache', async () => {
      await renderer.invalidatePost('test-post');
      expect(renderer.cache.has('post-test-post')).toBe(false);
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('/tmp/cache', 'post-test-post.html')
      );
    });

    test('should invalidate index cache', async () => {
      await renderer.invalidateIndex();
      expect(renderer.cache.has('index')).toBe(false);
      expect(fs.unlink).toHaveBeenCalledWith(
        path.join('/tmp/cache', 'index.html')
      );
    });

    test('should handle missing cache files', async () => {
      fs.unlink.mockRejectedValueOnce(new Error('Not found'));
      await renderer.invalidatePost('test-post');
      // Should not throw
    });
  });
}); 