// router.js - Client-side routing for Threeward blog

// Client-side routing functionality
const router = {
  init() {
    this.bindEvents();
  },

  bindEvents() {
    // Handle browser back/forward buttons
    window.addEventListener('popstate', (event) => {
      this.handleRoute(window.location.pathname);
    });

    // Handle link clicks
    document.addEventListener('click', (event) => {
      const link = event.target.closest('a');
      if (link && link.href.startsWith(window.location.origin)) {
        event.preventDefault();
        this.navigate(link.pathname);
      }
    });
  },

  navigate(path) {
    window.history.pushState({}, '', path);
    this.handleRoute(path);
  },

  async handleRoute(path) {
    try {
      if (path === '/') {
        // Home page is already rendered server-side
        return;
      }

      if (path.startsWith('/post/')) {
        const slug = path.split('/post/')[1];
        const response = await fetch(`/api/posts/${slug}`);
        if (!response.ok) throw new Error('Post not found');
        const post = await response.json();
        this.renderPost(post);
      }
    } catch (error) {
      console.error('Routing error:', error);
      // Handle 404 or other errors
    }
  },

  renderPost(post) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    mainContent.innerHTML = `
      <article class="max-w-4xl mx-auto">
        <h1 class="text-4xl font-bold mb-4">${post.frontmatter.title}</h1>
        <div class="flex items-center space-x-4 text-sm text-gray-500 mb-8">
          <time datetime="${post.frontmatter.date}">
            ${utils.formatDate(post.frontmatter.date)}
          </time>
          ${post.frontmatter.author ? `
            <span>•</span>
            <span>${post.frontmatter.author}</span>
          ` : ''}
        </div>
        <div class="prose dark:prose-invert max-w-none">
          ${post.content}
        </div>
      </article>
    `;
  }
};

// Initialize router
document.addEventListener('DOMContentLoaded', () => router.init());

// Export the Router class for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { Router };
} else {
  window.Router = Router;
} 