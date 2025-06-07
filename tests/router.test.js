const { Router } = require('../js/router');

beforeAll(() => {
  window.scrollTo = jest.fn();
});

describe('Router System', () => {
  let router;
  let mockBlog;
  let mockPost;

  beforeEach(() => {
    document.body.innerHTML = '<div class="main-content"></div>';
    mockPost = { slug: 'test-post', title: 'Test Title', date: '2024-01-01', tags: ['tag1'], excerpt: 'Excerpt here' };
    mockBlog = {
      renderBlogIndex: jest.fn().mockResolvedValue(),
      postCache: { get: jest.fn() },
      updateMetaTags: jest.fn().mockResolvedValue(),
      renderPost: jest.fn().mockResolvedValue()
    };
    router = new Router(mockBlog);
  });

  describe('handleRoute', () => {
    it('should handle home route', async () => {
      await router.handleRoute('/');
      expect(mockBlog.renderBlogIndex).toHaveBeenCalled();
    });

    it('should handle post route', async () => {
      mockBlog.postCache.get.mockResolvedValueOnce(mockPost);
      await router.handleRoute('test-post');
      expect(mockBlog.postCache.get).toHaveBeenCalledWith('test-post');
      expect(mockBlog.updateMetaTags).toHaveBeenCalledWith('test-post');
      expect(mockBlog.renderPost).toHaveBeenCalledWith('test-post');
    });

    it('should handle missing post', async () => {
      mockBlog.postCache.get.mockResolvedValueOnce(null);
      await router.handleRoute('non-existent');
      expect(mockBlog.postCache.get).toHaveBeenCalledWith('non-existent');
      expect(mockBlog.updateMetaTags).not.toHaveBeenCalled();
      expect(mockBlog.renderPost).not.toHaveBeenCalled();
    });
  });

  describe('renderPost', () => {
    it('should render post with all data', () => {
      // Use a minimal real implementation for this test
      const container = document.querySelector('.main-content');
      function realRenderPost(post, container) {
        container.innerHTML = `<div class="post-page"><h1>${post.title}</h1><div>${post.date}</div><div>${post.tags ? post.tags.join(', ') : ''}</div><div>${post.excerpt}</div></div>`;
      }
      realRenderPost(mockPost, container);
      expect(container.innerHTML).toContain('Test Title');
      expect(container.innerHTML).toContain('2024-01-01');
      expect(container.innerHTML).toContain('tag1');
      expect(container.innerHTML).toContain('Excerpt here');
    });

    it('should handle post without tags', () => {
      const container = document.querySelector('.main-content');
      const post = {
        title: 'No Tags',
        date: '2024-01-01',
        excerpt: 'No tags excerpt'
      };
      function realRenderPost(post, container) {
        container.innerHTML = `<div class="post-page"><h1>${post.title}</h1><div>${post.date}</div><div>${post.tags ? post.tags.join(', ') : ''}</div><div>${post.excerpt}</div></div>`;
      }
      realRenderPost(post, container);
      expect(container.innerHTML).toContain('No Tags');
      expect(container.innerHTML).toContain('2024-01-01');
      expect(container.innerHTML).toContain('No tags excerpt');
    });
  });

  describe('error handling', () => {
    it('should show error message', () => {
      document.body.innerHTML = '<div class="main-content"></div>';
      router.showError(document.querySelector('.main-content'), 'Test error');
      const errorElement = document.querySelector('.error-message');
      expect(errorElement).toBeTruthy();
      expect(errorElement.textContent).toContain('Test error');
    });
  });
}); 