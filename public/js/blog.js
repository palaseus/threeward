console.log('Blog script loaded');

// blog.js - Core blog functionality
const blog = {
  postsPerPage: 40, // 4x10 grid
  currentPage: 1,
  allPosts: [],

  init() {
    console.log('Blog init called');
    this.setupMobileMenu();
    this.setupNewsletterForm();
    this.setupSearch();
    this.loadPosts();
  },

  async loadPosts() {
    console.log('Loading posts...');
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
      console.error('Posts container not found!');
      return;
    }

    try {
      const response = await fetch('/api/posts');
      console.log('API Response:', response);
      if (!response.ok) throw new Error('Failed to load posts');
      
      this.allPosts = await response.json();
      console.log('Posts loaded:', this.allPosts);
      this.renderPosts();
    } catch (error) {
      console.error('Error loading posts:', error);
      postsContainer.innerHTML = `
        <div class="text-center text-red-600 dark:text-red-400">
          Failed to load posts. Please try again later.
        </div>
      `;
    }
  },

  renderPosts() {
    console.log('Rendering posts');
    const postsContainer = document.getElementById('posts-container');
    if (!postsContainer) {
      console.error('Posts container not found in renderPosts!');
      return;
    }

    if (this.allPosts.length === 0) {
      console.log('No posts to render');
      postsContainer.innerHTML = `
        <div class="text-center text-gray-600 dark:text-gray-400">
          No posts found.
        </div>
      `;
      return;
    }

    const startIndex = (this.currentPage - 1) * this.postsPerPage;
    const endIndex = startIndex + this.postsPerPage;
    const postsToShow = this.allPosts.slice(startIndex, endIndex);

    const postsHTML = `
      <div class="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-6">
        ${postsToShow.map(post => `
          <article class="bg-white dark:bg-gray-800 rounded-lg shadow-md overflow-hidden hover:shadow-lg transition-shadow">
            <div class="p-6">
              <div class="flex items-center space-x-2 mb-4">
                ${post.frontmatter.tags ? post.frontmatter.tags.map(tag => `
                  <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                    ${tag}
                  </span>
                `).join('') : ''}
              </div>
              <h2 class="text-xl font-bold text-gray-900 dark:text-white mb-2">
                <a href="/post/${post.slug}" class="hover:text-blue-600 dark:hover:text-blue-400 transition-colors">
                  ${post.frontmatter.title}
                </a>
              </h2>
              <p class="text-gray-600 dark:text-gray-300 mb-4 line-clamp-3">
                ${post.excerpt}
              </p>
              <div class="flex items-center justify-between">
                <div class="flex items-center space-x-2">
                  <span class="text-sm text-gray-500 dark:text-gray-400">
                    ${new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                      year: 'numeric',
                      month: 'long',
                      day: 'numeric'
                    })}
                  </span>
                </div>
                <a href="/post/${post.slug}" class="text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
                  Read more →
                </a>
              </div>
            </div>
          </article>
        `).join('')}
      </div>
      ${this.renderPagination()}
    `;

    console.log('Generated HTML:', postsHTML);
    postsContainer.innerHTML = postsHTML;
    this.setupPaginationHandlers();
  },

  renderPagination() {
    const totalPages = Math.ceil(this.allPosts.length / this.postsPerPage);
    if (totalPages <= 1) return '';

    return `
      <div class="mt-12 flex justify-center items-center space-x-4">
        <button 
          id="prev-page"
          class="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          ${this.currentPage === 1 ? 'disabled' : ''}
        >
          Previous
        </button>
        <span class="text-gray-600 dark:text-gray-400">
          Page ${this.currentPage} of ${totalPages}
        </span>
        <button 
          id="next-page"
          class="px-4 py-2 rounded-lg bg-white dark:bg-gray-800 text-gray-700 dark:text-gray-300 border border-gray-300 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
          ${this.currentPage === totalPages ? 'disabled' : ''}
        >
          Next
        </button>
      </div>
    `;
  },

  setupPaginationHandlers() {
    const prevButton = document.getElementById('prev-page');
    const nextButton = document.getElementById('next-page');

    if (prevButton) {
      prevButton.addEventListener('click', () => {
        if (this.currentPage > 1) {
          this.currentPage--;
          this.renderPosts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }

    if (nextButton) {
      nextButton.addEventListener('click', () => {
        const totalPages = Math.ceil(this.allPosts.length / this.postsPerPage);
        if (this.currentPage < totalPages) {
          this.currentPage++;
          this.renderPosts();
          window.scrollTo({ top: 0, behavior: 'smooth' });
        }
      });
    }
  },

  setupMobileMenu() {
    const button = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    button.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !button.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });
  },

  setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;
      
      try {
        // For now, just log the email
        console.log('Newsletter subscription:', email);
        
        // Show success message
        form.innerHTML = `
          <div class="text-green-600 dark:text-green-400">
            Thanks for subscribing! We'll keep you updated.
          </div>
        `;
      } catch (error) {
        console.error('Error subscribing to newsletter:', error);
        form.innerHTML = `
          <div class="text-red-600 dark:text-red-400">
            Failed to subscribe. Please try again later.
          </div>
        `;
      }
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('search-input');
    if (!searchInput) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const posts = document.querySelectorAll('#posts-container article');
      
      posts.forEach(post => {
        const title = post.querySelector('h2').textContent.toLowerCase();
        const excerpt = post.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(post.querySelectorAll('.inline-flex')).map(tag => tag.textContent.toLowerCase());
        
        const matches = title.includes(query) || 
                       excerpt.includes(query) || 
                       tags.some(tag => tag.includes(query));
        
        post.style.display = matches ? 'block' : 'none';
      });
    });
  }
};

// Initialize blog when DOM is loaded
document.addEventListener('DOMContentLoaded', () => blog.init()); 