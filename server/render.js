/**
 * Server-side rendering utilities for blog posts
 */

const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');

class Renderer {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(process.cwd(), 'cache');
    this.template = options.template || this.getDefaultTemplate();
    this.cache = new Map();
    this.initializeCache();
  }

  /**
   * Get the default HTML template
   */
  getDefaultTemplate() {
    return `
      <!DOCTYPE html>
      <html lang="en" class="h-full">
      <head>
        <meta charset="UTF-8">
        <meta name="viewport" content="width=device-width, initial-scale=1.0">
        <title>{{title}}</title>
        <link rel="stylesheet" href="/css/style.css">
        <link rel="stylesheet" href="https://cdnjs.cloudflare.com/ajax/libs/font-awesome/6.0.0-beta3/css/all.min.css">
        <script>
          window.__INITIAL_DATA__ = {{initialData}};
        </script>
      </head>
      <body class="h-full bg-gray-50 dark:bg-gray-900">
        <div class="min-h-screen flex flex-col">
          <!-- Header -->
          <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-center h-16">
                <a href="/" class="text-2xl font-bold text-gray-900 dark:text-white hover:text-primary-600 dark:hover:text-primary-400">
                  Threeward Blog
                </a>
                <button
                  id="theme-toggle"
                  class="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white"
                  aria-label="Toggle theme"
                >
                  <i class="fas fa-moon"></i>
                </button>
              </div>
            </div>
          </header>

          <!-- Main Content -->
          <main class="flex-grow">
            {{content}}
          </main>

          <!-- Footer -->
          <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
            <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div class="flex flex-col md:flex-row justify-between items-center">
                <p class="text-gray-500 dark:text-gray-400">
                  © 2024 Threeward Blog. All rights reserved.
                </p>
                <div class="flex space-x-6 mt-4 md:mt-0">
                  <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <span class="sr-only">Twitter</span>
                    <i class="fab fa-twitter"></i>
                  </a>
                  <a href="#" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
                    <span class="sr-only">GitHub</span>
                    <i class="fab fa-github"></i>
                  </a>
                </div>
              </div>
            </div>
          </footer>
        </div>

        <script src="/js/cache.js"></script>
        <script src="/js/utils.js"></script>
        <script src="/js/seo.js"></script>
        <script src="/js/theme.js"></script>
        <script src="/js/filter.js"></script>
        <script src="/js/blog.js"></script>
        <script src="/js/router.js"></script>
        <script>
          document.addEventListener('DOMContentLoaded', () => {
            blog.hydrate(window.__INITIAL_DATA__);
          });
        </script>
      </body>
      </html>
    `;
  }

  /**
   * Initialize cache directory
   */
  async initializeCache() {
    try {
      await fs.mkdir(this.cacheDir, { recursive: true });
    } catch (error) {
      console.error('Failed to create cache directory:', error);
    }
  }

  /**
   * Render a blog post
   * @param {Object} post - The post data
   * @returns {string} The rendered HTML
   */
  renderPost(post) {
    const { frontmatter, content } = post;
    const html = marked.parse(content);
    
    const postContent = `
      <article class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="bg-white dark:bg-gray-800 rounded-lg shadow-sm p-8">
          <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            ${frontmatter.title}
          </h1>
          <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-8">
            <time datetime="${frontmatter.date}">
              ${new Date(frontmatter.date).toLocaleDateString('en-US', {
                year: 'numeric',
                month: 'long',
                day: 'numeric'
              })}
            </time>
            ${frontmatter.author ? `
              <span>•</span>
              <span>${frontmatter.author}</span>
            ` : ''}
          </div>
          ${frontmatter.tags ? `
            <div class="flex flex-wrap gap-2 mb-8">
              ${frontmatter.tags.map(tag => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                  ${tag}
                </span>
              `).join('')}
            </div>
          ` : ''}
          <div class="prose dark:prose-invert max-w-none">
            ${html}
          </div>
        </div>
      </article>
    `;

    return this.template
      .replace('{{title}}', `${frontmatter.title} | Threeward Blog`)
      .replace('{{content}}', postContent)
      .replace('{{initialData}}', JSON.stringify({ post }));
  }

  /**
   * Render the blog index page
   * @param {Array} posts - Array of post objects
   * @returns {string} The rendered HTML
   */
  renderIndex(posts) {
    const heroSection = `
      <section class="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700">
        <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
          <h2 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
            Welcome to Threeward Blog
          </h2>
          <p class="text-xl text-gray-600 dark:text-gray-300">
            Discover the latest insights and stories from our community.
          </p>
        </div>
      </section>
    `;

    const filterSection = `
      <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div class="mb-8">
          <div class="flex flex-col space-y-4 sm:flex-row sm:space-y-0 sm:space-x-4">
            <div class="flex-grow">
              <input
                type="search"
                class="search-input w-full px-4 py-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                placeholder="Search posts..."
                aria-label="Search posts"
              >
            </div>
          </div>
          <div class="tag-filters mt-4 flex flex-wrap gap-2" role="group" aria-label="Filter posts by tag">
            ${this.renderTagFilters(posts)}
          </div>
        </div>
        <div class="main-content">
          ${this.renderPostList(posts)}
        </div>
      </div>
    `;

    const content = heroSection + filterSection;

    return this.template
      .replace('{{title}}', 'Threeward Blog')
      .replace('{{content}}', content)
      .replace('{{initialData}}', JSON.stringify({ posts }));
  }

  /**
   * Render tag filters
   * @param {Array} posts - Array of post objects
   * @returns {string} HTML for tag filters
   */
  renderTagFilters(posts) {
    const tags = new Set();
    posts.forEach(post => {
      if (post.frontmatter.tags && Array.isArray(post.frontmatter.tags)) {
        post.frontmatter.tags.forEach(tag => tags.add(tag));
      }
    });

    return Array.from(tags)
      .map(tag => `
        <button
          class="tag-filter px-3 py-1 rounded-full text-sm font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200 hover:bg-gray-200 dark:hover:bg-gray-600"
          data-tag="${tag}"
        >
          ${tag}
        </button>
      `)
      .join('');
  }

  /**
   * Render post list
   * @param {Array} posts - Array of post objects
   * @returns {string} HTML for post list
   */
  renderPostList(posts) {
    return `
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3">
        ${posts.map(post => `
          <article class="bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden">
            <div class="p-6">
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                <a href="/post/${post.slug}" class="hover:text-primary-600 dark:hover:text-primary-400">
                  ${post.frontmatter.title}
                </a>
              </h2>
              <div class="flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400 mb-4">
                <time datetime="${post.frontmatter.date}">
                  ${new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric'
                  })}
                </time>
                ${post.frontmatter.author ? `
                  <span>•</span>
                  <span>${post.frontmatter.author}</span>
                ` : ''}
              </div>
              <p class="text-gray-600 dark:text-gray-300 mb-4">
                ${post.excerpt}
              </p>
              ${post.frontmatter.tags && Array.isArray(post.frontmatter.tags) ? `
                <div class="flex flex-wrap gap-2">
                  ${post.frontmatter.tags.map(tag => `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                      ${tag}
                    </span>
                  `).join('')}
                </div>
              ` : ''}
            </div>
          </article>
        `).join('')}
      </div>
    `;
  }

  /**
   * Get cached content or render new content
   * @param {string} key - Cache key
   * @param {Function} renderFn - Function to render content
   * @returns {Promise<string>} Rendered HTML
   */
  async getCached(key, renderFn) {
    const cached = this.cache.get(key);
    if (cached) {
      return cached;
    }

    const content = renderFn();
    this.cache.set(key, content);
    return content;
  }

  /**
   * Invalidate post cache
   * @param {string} slug - Post slug
   */
  async invalidatePost(slug) {
    this.cache.delete(`post-${slug}`);
    await this.invalidateIndex();
  }

  /**
   * Invalidate index cache
   */
  async invalidateIndex() {
    this.cache.delete('index');
  }
}

module.exports = { Renderer };
module.exports.Renderer = Renderer;
module.exports.default = Renderer; 