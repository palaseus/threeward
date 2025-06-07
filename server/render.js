/**
 * Server-side rendering utilities for blog posts
 */

const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');

class Renderer {
  constructor(options = {}) {
    this.cacheDir = options.cacheDir || path.join(__dirname, '../cache');
    this.template = this.getDefaultTemplate();
  }

  /**
   * Get the default HTML template
   */
  getDefaultTemplate() {
    return `<!DOCTYPE html>
<html lang="en" class="h-full">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>{{title}}</title>
  <meta name="description" content="{{description}}">
  <link rel="stylesheet" href="/css/style.css">
  <link rel="preconnect" href="https://fonts.googleapis.com">
  <link rel="preconnect" href="https://fonts.gstatic.com" crossorigin>
  <link href="https://fonts.googleapis.com/css2?family=Inter:wght@400;500;600;700&display=swap" rel="stylesheet">
</head>
<body class="h-full bg-gray-50 dark:bg-gray-900">
  <!-- Sticky Header -->
  <header class="sticky top-0 z-50 bg-white dark:bg-gray-800 shadow-sm">
    <nav class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
      <div class="flex justify-between h-16">
        <div class="flex">
          <div class="flex-shrink-0 flex items-center">
            <a href="/" class="text-2xl font-bold text-gray-900 dark:text-white">Threeward</a>
          </div>
          <div class="hidden sm:ml-6 sm:flex sm:space-x-8">
            <a href="/" class="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Home</a>
            <a href="/about" class="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">About</a>
            <a href="/blog" class="border-transparent text-gray-500 dark:text-gray-300 hover:border-gray-300 hover:text-gray-700 dark:hover:text-white inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium">Blog</a>
          </div>
        </div>
        <div class="flex items-center">
          <button id="theme-toggle" class="p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
            <svg class="w-5 h-5" fill="currentColor" viewBox="0 0 20 20" xmlns="http://www.w3.org/2000/svg">
              <path d="M10 2a1 1 0 011 1v1a1 1 0 11-2 0V3a1 1 0 011-1zm4 8a4 4 0 11-8 0 4 4 0 018 0zm-.464 4.95l.707.707a1 1 0 001.414-1.414l-.707-.707a1 1 0 00-1.414 1.414zm2.12-10.607a1 1 0 010 1.414l-.706.707a1 1 0 11-1.414-1.414l.707-.707a1 1 0 011.414 0zM17 11a1 1 0 100-2h-1a1 1 0 100 2h1zm-7 4a1 1 0 011 1v1a1 1 0 11-2 0v-1a1 1 0 011-1zM5.05 6.464A1 1 0 106.465 5.05l-.708-.707a1 1 0 00-1.414 1.414l.707.707zm1.414 8.486l-.707.707a1 1 0 01-1.414-1.414l.707-.707a1 1 0 011.414 1.414zM4 11a1 1 0 100-2H3a1 1 0 000 2h1z"></path>
            </svg>
          </button>
          <button id="mobile-menu-button" class="sm:hidden ml-2 p-2 rounded-lg text-gray-500 dark:text-gray-400 hover:bg-gray-100 dark:hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-gray-200 dark:focus:ring-gray-700">
            <svg class="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path stroke-linecap="round" stroke-linejoin="round" stroke-width="2" d="M4 6h16M4 12h16M4 18h16"></path>
            </svg>
          </button>
        </div>
      </div>
    </nav>
    <!-- Mobile menu -->
    <div id="mobile-menu" class="sm:hidden hidden">
      <div class="pt-2 pb-3 space-y-1">
        <a href="/" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white">Home</a>
        <a href="/about" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white">About</a>
        <a href="/blog" class="block pl-3 pr-4 py-2 border-l-4 border-transparent text-base font-medium text-gray-600 dark:text-gray-300 hover:bg-gray-50 dark:hover:bg-gray-700 hover:border-gray-300 hover:text-gray-800 dark:hover:text-white">Blog</a>
      </div>
    </div>
  </header>

  <!-- Main Content -->
  <main class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
    {{content}}
  </main>

  <!-- Footer -->
  <footer class="bg-white dark:bg-gray-800 border-t border-gray-200 dark:border-gray-700">
    <div class="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
      <div class="grid grid-cols-1 md:grid-cols-3 gap-8">
        <div>
          <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">About Threeward</h3>
          <p class="mt-4 text-base text-gray-500 dark:text-gray-400">
            Exploring the intersection of law, code, and culture. Join us in understanding the rebellious side of programming and its impact on technology.
          </p>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">Stay Updated</h3>
          <form class="mt-4" id="newsletter-form">
            <div class="flex flex-col space-y-3">
              <input type="email" name="email" class="block w-full rounded-md border-0 bg-white dark:bg-gray-700 px-3.5 py-2 text-gray-900 dark:text-white shadow-sm ring-1 ring-inset ring-gray-300 dark:ring-gray-600 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Enter your email">
              <button type="submit" class="w-full rounded-md bg-indigo-600 px-3.5 py-2.5 text-sm font-semibold text-white shadow-sm hover:bg-indigo-500 focus-visible:outline focus-visible:outline-2 focus-visible:outline-offset-2 focus-visible:outline-indigo-600">Subscribe to Newsletter</button>
            </div>
          </form>
        </div>
        <div>
          <h3 class="text-sm font-semibold text-gray-400 tracking-wider uppercase">Connect</h3>
          <div class="mt-4 flex space-x-6">
            <a href="https://twitter.com/threeward" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">Twitter</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path d="M8.29 20.251c7.547 0 11.675-6.253 11.675-11.675 0-.178 0-.355-.012-.53A8.348 8.348 0 0022 5.92a8.19 8.19 0 01-2.357.646 4.118 4.118 0 001.804-2.27 8.224 8.224 0 01-2.605.996 4.107 4.107 0 00-6.993 3.743 11.65 11.65 0 01-8.457-4.287 4.106 4.106 0 001.27 5.477A4.072 4.072 0 012.8 9.713v.052a4.105 4.105 0 003.292 4.022 4.095 4.095 0 01-1.853.07 4.108 4.108 0 003.834 2.85A8.233 8.233 0 012 18.407a11.616 11.616 0 006.29 1.84"></path>
              </svg>
            </a>
            <a href="https://github.com/palaseus/threeward" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">
              <span class="sr-only">GitHub</span>
              <svg class="h-6 w-6" fill="currentColor" viewBox="0 0 24 24">
                <path fill-rule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.531 1.032 1.531 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" clip-rule="evenodd"></path>
              </svg>
            </a>
          </div>
        </div>
      </div>
      <div class="mt-8 border-t border-gray-200 dark:border-gray-700 pt-8 md:flex md:items-center md:justify-between">
        <div class="flex space-x-6 md:order-2">
          <a href="/privacy" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">Privacy</a>
          <a href="/terms" class="text-gray-400 hover:text-gray-500 dark:hover:text-gray-300">Terms</a>
        </div>
        <p class="mt-8 text-base text-gray-400 md:mt-0 md:order-1">
          &copy; ${new Date().getFullYear()} Threeward. All rights reserved.
        </p>
      </div>
    </div>
  </footer>

  <script src="/js/theme.js"></script>
  <script src="/js/blog.js"></script>
</body>
</html>`;
  }

  /**
   * Render the blog index page
   * @param {Array} posts - Array of post objects
   * @returns {string} The rendered HTML
   */
  async renderIndex(posts) {
    const content = `
      <!-- Hero Section -->
      <div class="text-center mb-12">
        <h1 class="text-4xl font-bold tracking-tight text-gray-900 dark:text-white sm:text-5xl md:text-6xl">
          Welcome to Threeward
        </h1>
        <p class="mt-3 max-w-md mx-auto text-base text-gray-500 dark:text-gray-400 sm:text-lg md:mt-5 md:text-xl md:max-w-3xl">
          Exploring the intersection of law, code, and culture.
        </p>
      </div>

      <!-- Search and Filter -->
      <div class="mb-8">
        <div class="max-w-xl mx-auto">
          <div class="relative">
            <input type="text" id="search-input" class="block w-full rounded-md border-0 py-3 pl-4 pr-10 text-gray-900 dark:text-white ring-1 ring-inset ring-gray-300 dark:ring-gray-600 placeholder:text-gray-400 focus:ring-2 focus:ring-inset focus:ring-indigo-600 sm:text-sm sm:leading-6" placeholder="Search posts...">
            <div class="absolute inset-y-0 right-0 flex items-center pr-3">
              <svg class="h-5 w-5 text-gray-400" viewBox="0 0 20 20" fill="currentColor">
                <path fill-rule="evenodd" d="M9 3.5a5.5 5.5 0 100 11 5.5 5.5 0 000-11zM2 9a7 7 0 1112.452 4.391l3.328 3.329a.75.75 0 11-1.06 1.06l-3.329-3.328A7 7 0 012 9z" clip-rule="evenodd" />
              </svg>
            </div>
          </div>
        </div>
      </div>

      <!-- Posts Grid -->
      <div class="grid gap-8 md:grid-cols-2 lg:grid-cols-3" id="posts-container">
        ${posts.map(post => `
          <article class="flex flex-col bg-white dark:bg-gray-800 rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-shadow duration-200">
            <div class="flex-1 p-6">
              <div class="flex items-center text-sm text-gray-500 dark:text-gray-400 mb-2">
                <time datetime="${post.frontmatter.date}">${new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                  year: 'numeric',
                  month: 'long',
                  day: 'numeric'
                })}</time>
                ${post.frontmatter.author ? `
                  <span class="mx-1">&middot;</span>
                  <span>${post.frontmatter.author}</span>
                ` : ''}
              </div>
              <a href="/post/${post.slug}" class="block group">
                <h2 class="text-xl font-semibold text-gray-900 dark:text-white mb-2 group-hover:text-indigo-600 dark:group-hover:text-indigo-400 transition-colors">${post.frontmatter.title}</h2>
                <p class="text-gray-500 dark:text-gray-400">${post.excerpt}</p>
              </a>
              ${post.frontmatter.tags && post.frontmatter.tags.length > 0 ? `
                <div class="mt-4 flex flex-wrap gap-2">
                  ${post.frontmatter.tags.map(tag => `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
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

    return this.template
      .replace('{{title}}', 'Threeward - Home')
      .replace('{{description}}', 'Exploring the intersection of law, code, and culture')
      .replace('{{content}}', content);
  }

  /**
   * Render a blog post
   * @param {Object} post - The post data
   * @returns {string} The rendered HTML
   */
  async renderPost(post) {
    const content = `
      <article class="prose dark:prose-invert max-w-none">
        <header class="mb-8">
          <h1 class="text-3xl font-bold text-gray-900 dark:text-white sm:text-4xl">${post.frontmatter.title}</h1>
          <div class="mt-4 flex items-center text-sm text-gray-500 dark:text-gray-400">
            <time datetime="${post.frontmatter.date}">${new Date(post.frontmatter.date).toLocaleDateString('en-US', {
              year: 'numeric',
              month: 'long',
              day: 'numeric'
            })}</time>
            ${post.frontmatter.author ? `
              <span class="mx-1">&middot;</span>
              <span>${post.frontmatter.author}</span>
            ` : ''}
          </div>
          ${post.frontmatter.tags && post.frontmatter.tags.length > 0 ? `
            <div class="mt-4 flex flex-wrap gap-2">
              ${post.frontmatter.tags.map(tag => `
                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-indigo-100 text-indigo-800 dark:bg-indigo-900 dark:text-indigo-200">
                  ${tag}
                </span>
              `).join('')}
            </div>
          ` : ''}
        </header>
        <div class="mt-6">
          ${post.content}
        </div>
      </article>
    `;

    return this.template
      .replace('{{title}}', `${post.frontmatter.title} - Threeward`)
      .replace('{{description}}', post.excerpt)
      .replace('{{content}}', content);
  }

  /**
   * Get cached content or render new content
   * @param {string} key - Cache key
   * @param {Function} renderFn - Function to render content
   * @returns {Promise<string>} Rendered HTML
   */
  async getCached(key, renderFn) {
    try {
      const cacheFile = path.join(this.cacheDir, `${key}.html`);
      const cached = await fs.readFile(cacheFile, 'utf-8');
      return cached;
    } catch (error) {
      const content = await renderFn();
      await fs.mkdir(this.cacheDir, { recursive: true });
      await fs.writeFile(path.join(this.cacheDir, `${key}.html`), content);
      return content;
    }
  }

  /**
   * Invalidate post cache
   * @param {string} slug - Post slug
   */
  async invalidatePost(slug) {
    try {
      await fs.unlink(path.join(this.cacheDir, `post-${slug}.html`));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }

  /**
   * Invalidate index cache
   */
  async invalidateIndex() {
    try {
      await fs.unlink(path.join(this.cacheDir, 'index.html'));
    } catch (error) {
      // Ignore if file doesn't exist
    }
  }
}

module.exports = { Renderer };
module.exports.Renderer = Renderer;
module.exports.default = Renderer; 