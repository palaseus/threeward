const { Blog } = require('../js/blog');
const { BlogAPI } = require('../js/api');
const cache = require('../js/cache');
const seo = require('../js/seo');
const { handleError } = require('../js/utils');

// Mock dependencies
jest.mock('../js/cache');
jest.mock('../js/seo');
jest.mock('../js/utils');

// Mock fetch
global.fetch = jest.fn();

describe('Blog System', () => {
  let blog, mockAPI, mockPosts;

  beforeEach(() => {
    // Set up DOM
    document.body.innerHTML = '<div class="main-content"></div>';

    // Mock fetch
    global.fetch = jest.fn();

    // Mock localStorage
    const localStorageMock = {
      getItem: jest.fn(),
      setItem: jest.fn(),
      clear: jest.fn(),
      key: jest.fn(),
      length: 0
    };
    global.localStorage = localStorageMock;

    // Create API instance with mocked fetch and required options
    mockAPI = {
      getPosts: jest.fn().mockResolvedValue(mockPosts)
    };

    // Create blog instance with mocked API
    blog = new Blog(mockAPI);
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('loadPosts', () => {
    it('should load posts successfully', async () => {
      const mockPosts = [
        { title: 'Post 1', slug: 'post-1' },
        { title: 'Post 2', slug: 'post-2' }
      ];
      mockAPI.getPosts.mockResolvedValueOnce(mockPosts);

      const result = await blog.loadPosts();
      expect(result).toEqual(mockPosts);
      expect(blog.posts).toEqual(mockPosts);
    });

    it('should handle network errors', async () => {
      mockAPI.getPosts.mockRejectedValueOnce(new Error('Network error'));
      await expect(blog.loadPosts()).rejects.toThrow('Network error');
    });
  });

  describe('loadPost', () => {
    test('should load post from cache if available', async () => {
      const mockPost = { title: 'Test Post' };
      cache.get.mockReturnValue(mockPost);

      const result = await blog.loadPost('test-post');
      expect(result).toBe(mockPost);
      expect(cache.get).toHaveBeenCalledWith('post:test-post');
      expect(global.fetch).not.toHaveBeenCalled();
    });

    test('should fetch and cache post if not in cache', async () => {
      const mockPost = { title: 'Test Post' };
      cache.get.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({
        ok: true,
        text: () => Promise.resolve('---\ntitle: Test Post\n---\nContent')
      });

      const result = await blog.loadPost('test-post');
      expect(result.frontmatter.title).toBe('Test Post');
      expect(cache.set).toHaveBeenCalledWith('post:test-post', expect.any(Object), 3600000);
    });

    test('should handle fetch errors', async () => {
      cache.get.mockReturnValue(null);
      global.fetch.mockResolvedValueOnce({ ok: false });

      await expect(blog.loadPost('test-post')).rejects.toThrow('Post not found');
    });
  });

  describe('parseMarkdown', () => {
    test('should parse markdown with frontmatter', () => {
      const markdown = `---
title: Test Post
date: 2024-01-01
tags: [test, blog]
---
# Content`;

      const result = blog.parseMarkdown(markdown);
      expect(result.frontmatter.title).toBe('Test Post');
      expect(result.content).toContain('<h1>Content</h1>');
    });

    test('should handle markdown without frontmatter', () => {
      const markdown = '# Content';
      const result = blog.parseMarkdown(markdown);
      expect(result.frontmatter).toEqual({});
      expect(result.content).toContain('<h1>Content</h1>');
    });
  });

  describe('processMarkdownContent', () => {
    test('should add lazy loading to images', () => {
      const content = '![Alt text](image.jpg)';
      const result = blog.processMarkdownContent(content);
      expect(result).toContain('loading="lazy"');
    });

    test('should convert markdown to HTML', () => {
      const content = `# Title
**Bold** and *italic* text
![Image](img.jpg)
[Link](url)`;

      const result = blog.processMarkdownContent(content);
      expect(result).toContain('<h1>Title</h1>');
      expect(result).toContain('<strong>Bold</strong>');
      expect(result).toContain('<em>italic</em>');
      expect(result).toContain('<img');
      expect(result).toContain('<a href="url">Link</a>');
    });
  });

  describe('renderPost', () => {
    test('should render post with meta tags', () => {
      const post = {
        frontmatter: {
          title: 'Test Post',
          date: '2024-01-01',
          tags: ['test']
        },
        content: '<p>Content</p>'
      };

      blog.renderPost(post, document.querySelector('.main-content'));
      expect(seo.updateMetaTags).toHaveBeenCalledWith(post);
      expect(document.querySelector('.post-title').textContent).toBe('Test Post');
    });

    test('should handle posts without tags', () => {
      const post = {
        frontmatter: {
          title: 'Test Post',
          date: '2024-01-01'
        },
        content: '<p>Content</p>'
      };

      blog.renderPost(post, document.querySelector('.main-content'));
      expect(document.querySelector('.post-tags')).toBeFalsy();
    });
  });

  describe('prefetchNextPost', () => {
    let blog, mockAPI, mockPosts;
    beforeEach(() => {
      document.body.innerHTML = '<div class="main-content"></div>';
      // Remove all prefetch links before each test
      document.querySelectorAll('link[rel="prefetch"]').forEach(link => link.remove());
      mockPosts = [
        { slug: 'post-1', tags: ['tag1', 'tag2'] },
        { slug: 'post-2', tags: ['tag2', 'tag3'] }
      ];
      mockAPI = {
        getPosts: jest.fn().mockResolvedValue(mockPosts)
      };
      blog = new Blog(mockAPI);
    });

    it('should prefetch next post with matching tags', async () => {
      await blog.prefetchNextPost(['tag2'], 'post-1');
      const prefetchLink = document.querySelector('link[rel="prefetch"]');
      expect(prefetchLink).toBeTruthy();
      expect(prefetchLink.getAttribute('href')).toContain('/posts/post-2.md');
    });

    it('should not prefetch when no matching posts', async () => {
      await blog.prefetchNextPost(['nonexistent'], 'post-1');
      const prefetchLink = document.querySelector('link[rel="prefetch"]');
      expect(prefetchLink).toBeFalsy();
    });
  });

  describe('renderBlogIndex', () => {
    test('should render blog index with posts', async () => {
      const mockPosts = [
        {
          slug: 'post-1',
          title: 'Test Post',
          date: '2024-01-01',
          tags: ['test'],
          excerpt: 'Test excerpt'
        }
      ];

      global.fetch.mockResolvedValueOnce({
        ok: true,
        json: () => Promise.resolve(mockPosts)
      });

      await blog.renderBlogIndex(document.querySelector('.main-content'));
      expect(seo.resetMetaTags).toHaveBeenCalled();
      expect(document.querySelector('.post-preview')).toBeTruthy();
    });

    test('should handle fetch errors', async () => {
      global.fetch.mockRejectedValueOnce(new Error('Failed to fetch'));

      await blog.renderBlogIndex(document.querySelector('.main-content'));
      expect(document.querySelector('.error-message')).toBeTruthy();
    });
  });

  describe('error handling', () => {
    test('should show error message', () => {
      document.body.innerHTML = '<div class="main-content"></div>';
      blog.showError('Test error');
      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });
  });
}); 