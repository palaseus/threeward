/**
 * Theme utility functions for managing dark/light mode
 */

// Theme handling
const theme = {
  /**
   * Initialize theme based on user preference or system setting
   */
  init() {
    this.themeToggle = document.getElementById('theme-toggle');
    this.theme = localStorage.getItem('theme') || 'light';
    this.applyTheme();
    this.bindEvents();
  },

  bindEvents() {
    this.themeToggle.addEventListener('click', () => this.toggleTheme());
  },

  applyTheme() {
    document.documentElement.classList.toggle('dark', this.theme === 'dark');
    localStorage.setItem('theme', this.theme);
  },

  /**
   * Toggle between light and dark themes
   */
  toggleTheme() {
    this.theme = this.theme === 'light' ? 'dark' : 'light';
    this.applyTheme();
  },

  /**
   * Update the theme toggle button state
   * @param {string} theme - The current theme
   */
  updateToggleButton(theme) {
    const button = document.getElementById('theme-toggle');
    if (!button) return;

    const icon = button.querySelector('i');
    const label = button.querySelector('.sr-only');

    if (theme === 'dark') {
      icon.textContent = '☀️';
      label.textContent = 'Switch to light mode';
    } else {
      icon.textContent = '🌙';
      label.textContent = 'Switch to dark mode';
    }

    button.setAttribute('aria-pressed', theme === 'dark');
  }
};

document.addEventListener('DOMContentLoaded', () => theme.init());

module.exports = theme; 