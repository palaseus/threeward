import { AnalyticsBot } from '../js/analytics';

// Mock localStorage
const localStorageMock = (() => {
  let store = {};
  return {
    getItem: jest.fn(key => store[key]),
    setItem: jest.fn((key, value) => {
      store[key] = value;
    }),
    removeItem: jest.fn(key => {
      delete store[key];
    }),
    clear: jest.fn(() => {
      store = {};
    }),
    key: jest.fn(n => Object.keys(store)[n]),
    get length() {
      return Object.keys(store).length;
    }
  };
})();

Object.defineProperty(window, 'localStorage', {
  value: localStorageMock
});

// Mock fetch
global.fetch = jest.fn();

describe('AnalyticsBot', () => {
  let analytics;
  const mockOptions = {
    storageKey: 'test_analytics',
    sessionKey: 'test_session',
    batchSize: 5,
    endpoint: '/api/test',
    debug: true
  };

  beforeEach(() => {
    // Reset all mocks
    jest.clearAllMocks();
    localStorage.clear();

    // Create analytics instance
    analytics = new AnalyticsBot(mockOptions);
  });

  describe('Session Management', () => {
    it('should create new session on first run', () => {
      expect(localStorage.setItem).toHaveBeenCalledWith(
        mockOptions.sessionKey,
        expect.stringContaining('"id"')
      );
    });

    it('should restore existing session if not expired', () => {
      const session = {
        id: 'test-id',
        start: Date.now(),
        lastActivity: Date.now(),
        pageViews: 0
      };
      localStorage.setItem(mockOptions.sessionKey, JSON.stringify(session));

      analytics = new AnalyticsBot(mockOptions);
      expect(analytics.session.id).toBe('test-id');
    });

    it('should create new session if existing is expired', () => {
      const oldSession = {
        id: 'old-id',
        start: Date.now() - (25 * 60 * 60 * 1000), // 25 hours ago
        lastActivity: Date.now(),
        pageViews: 0
      };
      localStorage.setItem(mockOptions.sessionKey, JSON.stringify(oldSession));

      analytics = new AnalyticsBot(mockOptions);
      expect(analytics.session.id).not.toBe('old-id');
    });
  });

  describe('Page View Tracking', () => {
    it('should track page view and update analytics', () => {
      analytics.trackPageView('/test', 'Test Page');

      const analyticsData = JSON.parse(localStorage.getItem(mockOptions.storageKey));
      expect(analyticsData.pages['/test'].views).toBe(1);
      expect(analyticsData.pages['/test'].title).toBe('Test Page');
    });

    it('should increment views for existing pages', () => {
      // Track first view
      analytics.trackPageView('/test', 'Test Page');
      
      // Track second view
      analytics.trackPageView('/test', 'Test Page');

      const analyticsData = JSON.parse(localStorage.getItem(mockOptions.storageKey));
      expect(analyticsData.pages['/test'].views).toBe(2);
    });

    it('should track unique visitors', () => {
      // First visitor
      analytics.trackPageView('/test', 'Test Page');
      
      // Create new session for second visitor
      analytics._createNewSession();
      analytics.trackPageView('/test', 'Test Page');

      const analyticsData = JSON.parse(localStorage.getItem(mockOptions.storageKey));
      expect(analyticsData.pages['/test'].visitors.length).toBe(2);
    });
  });

  describe('Analytics Data', () => {
    it('should return sorted analytics data', () => {
      // Add some test data
      analytics.trackPageView('/post1', 'Post 1');
      analytics.trackPageView('/post1', 'Post 1');
      analytics.trackPageView('/post2', 'Post 2');

      const data = analytics.getAnalytics();
      expect(data.pages[0].path).toBe('/post1');
      expect(data.pages[0].views).toBe(2);
      expect(data.totalViews).toBe(3);
    });

    it('should handle empty analytics data', () => {
      const data = analytics.getAnalytics();
      expect(data.pages).toEqual([]);
      expect(data.totalViews).toBe(0);
      expect(data.totalVisitors).toBe(0);
    });
  });

  describe('Batch Updates', () => {
    it('should send batch update when threshold reached', async () => {
      // Mock successful API response
      fetch.mockResolvedValueOnce({ ok: true });

      // Track enough views to trigger batch update
      for (let i = 0; i < mockOptions.batchSize; i++) {
        analytics.trackPageView('/test', 'Test Page');
      }

      expect(fetch).toHaveBeenCalledWith(
        mockOptions.endpoint,
        expect.objectContaining({
          method: 'POST',
          headers: { 'Content-Type': 'application/json' }
        })
      );
    });

    it('should handle API errors gracefully', async () => {
      // Mock failed API response
      fetch.mockRejectedValueOnce(new Error('API Error'));

      // Track enough views to trigger batch update
      for (let i = 0; i < mockOptions.batchSize; i++) {
        analytics.trackPageView('/test', 'Test Page');
      }

      // Should not throw error
      expect(fetch).toHaveBeenCalled();
    });
  });
}); 