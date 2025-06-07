// blog.js - Core blog functionality
const cache = require('./cache');
const seo = require('./seo');
const utils = require('./utils');
const api = require('./api');

const blog = {
  init() {
    this.setupMobileMenu();
    this.setupNewsletterForm();
    this.setupSearch();
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
      const email = form.querySelector('input[name="email"]').value;

      try {
        // Here you would typically send the email to your backend
        console.log('Subscribing email:', email);
        
        // Show success message
        const button = form.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Subscribed!';
        button.disabled = true;
        
        // Reset form
        form.reset();
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 3000);
      } catch (error) {
        console.error('Failed to subscribe:', error);
        alert('Failed to subscribe. Please try again.');
      }
    });
  },

  setupSearch() {
    const searchInput = document.getElementById('search-input');
    const postsContainer = document.getElementById('posts-container');
    if (!searchInput || !postsContainer) return;

    searchInput.addEventListener('input', (e) => {
      const query = e.target.value.toLowerCase();
      const posts = postsContainer.querySelectorAll('article');

      posts.forEach(post => {
        const title = post.querySelector('h2').textContent.toLowerCase();
        const excerpt = post.querySelector('p').textContent.toLowerCase();
        const tags = Array.from(post.querySelectorAll('.inline-flex'))
          .map(tag => tag.textContent.toLowerCase());

        const matches = title.includes(query) ||
          excerpt.includes(query) ||
          tags.some(tag => tag.includes(query));

        post.style.display = matches ? 'flex' : 'none';
      });
    });
  }
};

// Initialize blog functionality
document.addEventListener('DOMContentLoaded', () => blog.init()); 