const theme = require('../js/theme');

describe('Theme System', () => {
  beforeEach(() => {
    document.body.innerHTML = `
      <button id="theme-toggle" aria-pressed="false">
        <i>🌙</i>
        <span class="sr-only">Switch to dark mode</span>
      </button>
    `;
    localStorage.clear();
    jest.clearAllMocks();
  });

  describe('init', () => {
    test('should use saved theme from localStorage', () => {
      localStorage.setItem('theme', 'dark');
      theme.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });

    test('should use system preference when no saved theme', () => {
      // Mock system preference
      window.matchMedia = jest.fn().mockImplementation(query => ({
        matches: query === '(prefers-color-scheme: dark)',
        addEventListener: jest.fn()
      }));

      theme.init();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
    });
  });

  describe('setTheme', () => {
    test('should set theme and update localStorage', () => {
      theme.setTheme('dark');
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      expect(localStorage.getItem('theme')).toBe('dark');
    });

    test('should update toggle button state', () => {
      theme.setTheme('dark');
      const button = document.getElementById('theme-toggle');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.querySelector('i').textContent).toBe('☀️');
      expect(button.querySelector('.sr-only').textContent).toBe('Switch to light mode');
    });
  });

  describe('toggleTheme', () => {
    test('should toggle between light and dark themes', () => {
      theme.setTheme('light');
      theme.toggleTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('dark');
      
      theme.toggleTheme();
      expect(document.documentElement.getAttribute('data-theme')).toBe('light');
    });
  });

  describe('updateToggleButton', () => {
    test('should update button for dark theme', () => {
      theme.updateToggleButton('dark');
      const button = document.getElementById('theme-toggle');
      expect(button.getAttribute('aria-pressed')).toBe('true');
      expect(button.querySelector('i').textContent).toBe('☀️');
      expect(button.querySelector('.sr-only').textContent).toBe('Switch to light mode');
    });

    test('should update button for light theme', () => {
      theme.updateToggleButton('light');
      const button = document.getElementById('theme-toggle');
      expect(button.getAttribute('aria-pressed')).toBe('false');
      expect(button.querySelector('i').textContent).toBe('🌙');
      expect(button.querySelector('.sr-only').textContent).toBe('Switch to dark mode');
    });

    test('should handle missing button gracefully', () => {
      document.body.innerHTML = '';
      expect(() => theme.updateToggleButton('dark')).not.toThrow();
    });
  });
}); 