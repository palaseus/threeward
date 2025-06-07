/**
 * Blog API Integration Module
 * Handles fetching and caching blog posts from a remote API
 */

class BlogAPI {
  constructor(options) {
    this.apiUrl = options.apiUrl;
    this.cacheKey = options.cacheKey;
    this.cacheExpiry = options.cacheExpiry || 3600;
  }

  /**
   * Get all blog posts with caching
   * @returns {Promise<Array>} Array of blog posts
   */
  async getPosts() {
    try {
      const response = await fetch(`${this.apiUrl}/posts`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const posts = await response.json();
      return posts;
    } catch (error) {
      console.error('Error fetching posts:', error);
      throw error;
    }
  }

  /**
   * Get a single blog post by slug
   * @param {string} slug - The post slug
   * @returns {Promise<Object>} Blog post data
   */
  async getPost(slug) {
    try {
      const response = await fetch(`${this.apiUrl}/posts/${slug}`);
      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }
      const post = await response.json();
      return post;
    } catch (error) {
      console.error(`Error fetching post ${slug}:`, error);
      throw error;
    }
  }

  /**
   * Clear all cached data
   */
  clearCache() {
    const keys = Object.keys(localStorage);
    for (const key of keys) {
      if (key.startsWith(this.cacheKey)) {
        localStorage.removeItem(key);
      }
    }
  }
}

module.exports = { BlogAPI }; 