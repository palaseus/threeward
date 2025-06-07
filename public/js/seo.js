/**
 * SEO utility functions for managing meta tags and SEO-related functionality
 */

const seo = {
  /**
   * Update meta tags based on post data
   * @param {Object} post - The blog post data
   */
  updateMetaTags(post) {
    const { frontmatter } = post;
    const title = frontmatter.title ? `${frontmatter.title} | Threeward Blog` : 'Threeward Blog';
    const description = frontmatter.excerpt || 'Welcome to Threeward Blog';
    const keywords = frontmatter.tags ? frontmatter.tags.join(', ') : '';

    // Update title
    document.title = title;

    // Update or create meta description
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = description;

    // Update or create meta keywords
    let metaKeywords = document.querySelector('meta[name="keywords"]');
    if (!metaKeywords) {
      metaKeywords = document.createElement('meta');
      metaKeywords.name = 'keywords';
      document.head.appendChild(metaKeywords);
    }
    metaKeywords.content = keywords;

    // Update Open Graph tags
    this.updateOpenGraphTags(post);
  },

  /**
   * Update Open Graph meta tags for better social media sharing
   * @param {Object} post - The blog post data
   */
  updateOpenGraphTags(post) {
    const { frontmatter } = post;
    const ogTags = {
      'og:title': frontmatter.title || 'Threeward Blog',
      'og:description': frontmatter.excerpt || 'Welcome to Threeward Blog',
      'og:type': 'article',
      'og:url': window.location.href
    };

    Object.entries(ogTags).forEach(([property, content]) => {
      let meta = document.querySelector(`meta[property="${property}"]`);
      if (!meta) {
        meta = document.createElement('meta');
        meta.setAttribute('property', property);
        document.head.appendChild(meta);
      }
      meta.content = content;
    });
  },

  /**
   * Reset meta tags to default values
   */
  resetMetaTags() {
    document.title = 'Threeward Blog';
    const defaultTags = {
      'description': 'Welcome to Threeward Blog',
      'keywords': '',
      'og:title': 'Threeward Blog',
      'og:description': 'Welcome to Threeward Blog',
      'og:type': 'website',
      'og:url': window.location.origin
    };

    Object.entries(defaultTags).forEach(([name, content]) => {
      const meta = document.querySelector(`meta[name="${name}"], meta[property="${name}"]`);
      if (meta) {
        meta.content = content;
      }
    });
  },

  init() {
    this.updateMetaTags();
  },

  setMetaTag(name, content) {
    let meta = document.querySelector(`meta[property="${name}"]`);
    if (!meta) {
      meta = document.createElement('meta');
      meta.setAttribute('property', name);
      document.head.appendChild(meta);
    }
    meta.setAttribute('content', content);
  }
};

// Initialize SEO
document.addEventListener('DOMContentLoaded', () => seo.init());

module.exports = seo; 