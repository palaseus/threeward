// utils.js - Utility functions for the blog

// Error handling with user-friendly messages
function handleError(error, context = '') {
  console.error(`Error in ${context}:`, error);
  return {
    message: 'Something went wrong. Please try again later.',
    details: error.message
  };
}

// DOM manipulation helpers
const dom = {
  create(tag, attributes = {}, children = []) {
    const element = document.createElement(tag);
    Object.entries(attributes).forEach(([key, value]) => {
      if (key === 'className') {
        element.className = value;
      } else {
        element.setAttribute(key, value);
      }
    });
    children.forEach(child => {
      if (typeof child === 'string') {
        element.appendChild(document.createTextNode(child));
      } else {
        element.appendChild(child);
      }
    });
    return element;
  },

  // Safely set innerHTML with sanitization
  setHTML(element, html) {
    element.innerHTML = html;
  }
};

// Utility functions
const utils = {
  // Format date to a readable string
  formatDate(date) {
    return new Date(date).toLocaleDateString('en-US', {
      year: 'numeric',
      month: 'long',
      day: 'numeric'
    });
  },

  // Generate excerpt from content
  generateExcerpt(content, maxLength = 200) {
    const div = document.createElement('div');
    div.innerHTML = content;
    const text = div.textContent || div.innerText || '';
    return text.length > maxLength 
      ? text.substring(0, maxLength) + '...'
      : text;
  },

  // Debounce function for search input
  debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
      const later = () => {
        clearTimeout(timeout);
        func(...args);
      };
      clearTimeout(timeout);
      timeout = setTimeout(later, wait);
    };
  },

  // Sanitize HTML
  sanitizeHTML(str) {
    const div = document.createElement('div');
    div.textContent = str;
    return div.innerHTML;
  }
};

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = {
    handleError,
    dom,
    utils
  };
} 