const seo = require('../js/seo');

describe('SEO Module', () => {
  beforeEach(() => {
    document.head.innerHTML = '';
    document.title = '';
  });

  describe('updateMetaTags', () => {
    test('should update meta tags with post data', () => {
      const post = {
        frontmatter: {
          title: 'Test Post',
          excerpt: 'Test excerpt',
          tags: ['test', 'blog']
        }
      };

      seo.updateMetaTags(post);

      expect(document.title).toBe('Test Post | Threeward Blog');
      expect(document.querySelector('meta[name="description"]').content).toBe('Test excerpt');
      expect(document.querySelector('meta[name="keywords"]').content).toBe('test, blog');
    });

    test('should handle missing frontmatter data', () => {
      const post = {
        frontmatter: {}
      };

      seo.updateMetaTags(post);

      expect(document.title).toBe('Threeward Blog');
      expect(document.querySelector('meta[name="description"]').content).toBe('Welcome to Threeward Blog');
      expect(document.querySelector('meta[name="keywords"]').content).toBe('');
    });
  });

  describe('updateOpenGraphTags', () => {
    test('should update Open Graph tags', () => {
      const post = {
        frontmatter: {
          title: 'Test Post',
          excerpt: 'Test excerpt'
        }
      };

      seo.updateOpenGraphTags(post);

      expect(document.querySelector('meta[property="og:title"]').content).toBe('Test Post');
      expect(document.querySelector('meta[property="og:description"]').content).toBe('Test excerpt');
      expect(document.querySelector('meta[property="og:type"]').content).toBe('article');
    });
  });

  describe('resetMetaTags', () => {
    test('should reset meta tags to default values', () => {
      // First set some custom values
      const post = {
        frontmatter: {
          title: 'Test Post',
          excerpt: 'Test excerpt',
          tags: ['test']
        }
      };
      seo.updateMetaTags(post);

      // Then reset
      seo.resetMetaTags();

      expect(document.title).toBe('Threeward Blog');
      expect(document.querySelector('meta[name="description"]').content).toBe('Welcome to Threeward Blog');
      expect(document.querySelector('meta[property="og:type"]').content).toBe('website');
    });
  });
}); 