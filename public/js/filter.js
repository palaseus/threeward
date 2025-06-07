const utils = require('./utils');

/**
 * Filter utility functions for blog post filtering and search
 */

class Filter {
  constructor(container) {
    this.container = container;
    this.posts = [];
    this.selectedTags = new Set();
    this.filteredPosts = [];
  }

  updatePosts(posts) {
    this.posts = posts;
    this.filteredPosts = [...posts];
    this._renderTagFilters();
    this._renderPosts();
  }

  toggleTag(tag) {
    if (this.selectedTags.has(tag)) {
      this.selectedTags.delete(tag);
    } else {
      this.selectedTags.add(tag);
    }

    const tagButton = this.container.querySelector(`[data-tag="${tag}"]`);
    if (tagButton) {
      tagButton.classList.toggle('active');
    }

    this._filterPosts();
  }

  clearFilters() {
    this.selectedTags.clear();
    const activeButtons = this.container.querySelectorAll('.tag-button.active');
    activeButtons.forEach(button => button.classList.remove('active'));
    this._filterPosts();
  }

  _renderTagFilters() {
    const tagContainer = this.container.querySelector('.tag-filters');
    const tags = new Set();
    
    this.posts.forEach(post => {
      if (post.tags) {
        post.tags.forEach(tag => tags.add(tag));
      }
    });

    tagContainer.innerHTML = Array.from(tags).map(tag => `
      <button class="tag-button" data-tag="${tag}" role="checkbox" aria-pressed="false">
        ${tag}
      </button>
    `).join('');

    tagContainer.addEventListener('click', (e) => {
      const button = e.target.closest('.tag-button');
      if (button) {
        this.toggleTag(button.dataset.tag);
      }
    });

    tagContainer.addEventListener('keydown', (e) => {
      if (e.key === 'Enter' && e.target.classList.contains('tag-button')) {
        this.toggleTag(e.target.dataset.tag);
      }
    });
  }

  _filterPosts() {
    if (this.selectedTags.size === 0) {
      this.filteredPosts = [...this.posts];
    } else {
      this.filteredPosts = this.posts.filter(post => 
        post.tags && post.tags.some(tag => this.selectedTags.has(tag))
      );
    }
    this._renderPosts();
  }

  _renderPosts() {
    const postList = this.container.querySelector('.post-list');
    if (this.filteredPosts.length === 0) {
      postList.innerHTML = '<p class="no-results">No posts found matching the selected filters.</p>';
    } else {
      postList.innerHTML = this.filteredPosts.map(post => `
        <article class="post-preview">
          <h2>${post.title}</h2>
          <p>${post.content}</p>
          ${post.tags ? `
            <div class="post-tags">
              ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
            </div>
          ` : ''}
        </article>
      `).join('');
    }
  }
}

module.exports = { Filter };

// Post filtering functionality
const filter = {
  init() {
    this.searchInput = document.querySelector('.search-input');
    this.tagFilters = document.querySelector('.tag-filters');
    this.posts = window.__INITIAL_DATA__?.posts || [];
    this.bindEvents();
  },

  bindEvents() {
    if (this.searchInput) {
      this.searchInput.addEventListener('input', () => this.filterPosts());
    }
  },

  filterPosts() {
    const searchTerm = this.searchInput.value.toLowerCase();
    const posts = document.querySelectorAll('.post-card');
    
    posts.forEach(post => {
      const title = post.querySelector('.post-title').textContent.toLowerCase();
      const content = post.querySelector('.post-excerpt').textContent.toLowerCase();
      const tags = Array.from(post.querySelectorAll('.tag')).map(tag => tag.textContent.toLowerCase());
      
      const matchesSearch = title.includes(searchTerm) || content.includes(searchTerm);
      const matchesTags = this.getSelectedTags().length === 0 || 
        this.getSelectedTags().some(tag => tags.includes(tag));
      
      post.style.display = matchesSearch && matchesTags ? 'block' : 'none';
    });
  },

  getSelectedTags() {
    return Array.from(this.tagFilters?.querySelectorAll('.tag.active') || [])
      .map(tag => tag.textContent.toLowerCase());
  }
};

document.addEventListener('DOMContentLoaded', () => filter.init()); 