const { Filter } = require('../js/filter');
const utils = require('../js/utils');

// Mock utils.debounce
jest.mock('../js/utils', () => ({
  debounce: (fn) => fn
}));

describe('Filter', () => {
  let filter;
  let container;
  const mockPosts = [
    { id: 1, title: 'Post 1', tags: ['tag1', 'tag2'] },
    { id: 2, title: 'Post 2', tags: ['tag2', 'tag3'] },
    { id: 3, title: 'Post 3', tags: ['tag1', 'tag3'] }
  ];

  beforeEach(() => {
    // Setup DOM
    document.body.innerHTML = `
      <div class="filter-container">
        <div class="tag-filters"></div>
        <div class="post-list"></div>
      </div>
    `;
    container = document.querySelector('.filter-container');
    
    // Create filter instance
    filter = new Filter(container);
    
    // Update posts
    filter.updatePosts(mockPosts);
  });

  afterEach(() => {
    document.body.innerHTML = '';
  });

  describe('updatePosts', () => {
    it('should update posts and render tag filters', () => {
      expect(filter.posts).toEqual(mockPosts);
      const tagButtons = container.querySelectorAll('.tag-button');
      expect(tagButtons.length).toBe(3); // tag1, tag2, tag3
    });
  });

  describe('toggleTag', () => {
    it('should toggle tag selection', () => {
      const tagButton = container.querySelector('[data-tag="tag1"]');
      filter.toggleTag('tag1');
      expect(tagButton.classList.contains('active')).toBe(true);
      expect(filter.selectedTags).toContain('tag1');
    });

    it('should update filtered posts when tag is toggled', () => {
      filter.toggleTag('tag1');
      expect(filter.filteredPosts.length).toBe(2); // Posts with tag1
    });
  });

  describe('keyboard navigation', () => {
    it('should handle keyboard navigation', () => {
      const tagButton = container.querySelector('[data-tag="tag1"]');
      tagButton.focus();
      
      const keydownEvent = new KeyboardEvent('keydown', {
        key: 'Enter',
        code: 'Enter',
        keyCode: 13,
        which: 13,
        bubbles: true
      });
      
      tagButton.dispatchEvent(keydownEvent);
      
      expect(tagButton.classList.contains('active')).toBe(true);
      expect(filter.selectedTags).toContain('tag1');
    });
  });

  describe('clearFilters', () => {
    it('should clear all selected tags', () => {
      filter.toggleTag('tag1');
      filter.toggleTag('tag2');
      filter.clearFilters();
      
      expect(filter.selectedTags.size).toBe(0);
      const activeButtons = container.querySelectorAll('.tag-button.active');
      expect(activeButtons.length).toBe(0);
    });
  });
}); 