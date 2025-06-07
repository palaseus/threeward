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
        <link rel="preconnect" href="https://fonts.googleapis.com">
        <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
        <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
        <script>
          window.__INITIAL_DATA__ = {{initialData}};
        </script>
      </head>
      <body class="h-full bg-white dark:bg-gray-900 font-sans antialiased">
        <div class="min-h-screen flex flex-col">
          <!-- Header -->
          <header class="sticky top-0 z-50 bg-white/80 dark:bg-gray-900/80 backdrop-blur-sm border-b border-gray-200 dark:border-gray-800">
            <nav class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
              <div class="flex justify-between items-center h-16">
                <div class="flex items-center space-x-8">
                  <a href="/" class="text-xl font-bold text-gray-900 dark:text-white hover:text-gray-600 dark:hover:text-gray-300 transition-colors">
                    Threeward
                  </a>
                  <div class="hidden md:flex items-center space-x-6">
                    <a href="/" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">Home</a>
                    <a href="/about" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">About</a>
                    <a href="/rss.xml" class="text-gray-600 dark:text-gray-300 hover:text-gray-900 dark:hover:text-white transition-colors">RSS</a>
                  </div>
                </div>
                <button
                  id="theme-toggle"
                  class="p-2 rounded-lg text-gray-500 hover:text-gray-900 dark:text-gray-400 dark:hover:text-white transition-colors"
                  aria-label="Toggle theme"
                >
                  <svg class="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M20.354 15.354A9 9 0 018.646 3.646 9.003 9.003 0 0012 21a9.003 9.003 0 008.354-5.646z" />
                  </svg>
                </button>
              </div>
            </nav>
          </header>

          <!-- Main Content -->
          <main class="flex-grow">
            {{content}}
          </main>

          <!-- Footer -->
          <footer class="bg-white dark:bg-gray-900 border-t border-gray-200 dark:border-gray-800">
            <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
              <div class="flex flex-col md:flex-row justify-between items-center">
                <p class="text-gray-500 dark:text-gray-400 text-sm">
                  © ${new Date().getFullYear()} Threeward. All rights reserved.
                </p>
                <div class="flex space-x-6 mt-4 md:mt-0">
                  <a href="https://twitter.com/threeward" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    <span class="sr-only">Twitter</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84" />
                    </svg>
                  </a>
                  <a href="https://github.com/palaseus/threeward" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300 transition-colors">
                    <span class="sr-only">GitHub</span>
                    <svg class="h-5 w-5" fill="currentColor" viewBox="0 0 24 24">
                      <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd" />
                    </svg>
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
        <div class="prose dark:prose-invert max-w-none">
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
          ${html}
        </div>
      </article>
    `;

    return this.template
      .replace('{{title}}', `${frontmatter.title} | Threeward`)
      .replace('{{content}}', postContent)
      .replace('{{initialData}}', JSON.stringify({ post }));
  }

  /**
   * Render the blog index page
   * @param {Array} posts - Array of post objects
   * @returns {string} The rendered HTML
   */
  renderIndex(posts) {
    const content = `
      <div class="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        <div class="space-y-12">
          ${posts.map(post => `
            <article class="group">
              <a href="/post/${post.slug}" class="block">
                <h2 class="text-2xl font-bold text-gray-900 dark:text-white group-hover:text-gray-600 dark:group-hover:text-gray-300 transition-colors">
                  ${post.frontmatter.title}
                </h2>
                <div class="mt-2 flex items-center space-x-4 text-sm text-gray-500 dark:text-gray-400">
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
                <p class="mt-3 text-gray-600 dark:text-gray-300">
                  ${post.excerpt}
                </p>
                ${post.frontmatter.tags && Array.isArray(post.frontmatter.tags) ? `
                  <div class="mt-4 flex flex-wrap gap-2">
                    ${post.frontmatter.tags.map(tag => `
                      <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-gray-100 text-gray-800 dark:bg-gray-700 dark:text-gray-200">
                        ${tag}
                      </span>
                    `).join('')}
                  </div>
                ` : ''}
              </a>
            </article>
          `).join('')}
        </div>
      </div>
    `;

    return this.template
      .replace('{{title}}', 'Threeward')
      .replace('{{content}}', content)
      .replace('{{initialData}}', JSON.stringify({ posts }));
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