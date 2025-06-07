/**
 * Minimalist Analytics Bot
 * Privacy-focused analytics for static blogs
 */

class AnalyticsBot {
  constructor(options = {}) {
    // Configuration
    this.storageKey = options.storageKey || 'blog_analytics';
    this.sessionKey = options.sessionKey || 'analytics_session';
    this.batchSize = options.batchSize || 10;
    this.endpoint = options.endpoint || '/api/analytics';
    this.debug = options.debug || false;

    // Initialize session
    this._initSession();
  }

  /**
   * Initialize or restore session
   * @private
   */
  _initSession() {
    try {
      const existing = localStorage.getItem(this.sessionKey);
      if (existing) {
        this.session = JSON.parse(existing);
        // Check if session is expired (24 hours)
        if (Date.now() - this.session.start > 24 * 60 * 60 * 1000) {
          this._createNewSession();
        }
      } else {
        this._createNewSession();
      }
    } catch (error) {
      this._log('Error initializing session:', error);
      this._createNewSession();
    }
  }

  /**
   * Create a new session
   * @private
   */
  _createNewSession() {
    this.session = {
      id: this._generateId(),
      start: Date.now(),
      lastActivity: Date.now(),
      pageViews: 0
    };
    this._saveSession();
  }

  /**
   * Track a page view
   * @param {string} path - Page path
   * @param {string} title - Page title
   */
  trackPageView(path, title) {
    try {
      // Update session
      this.session.lastActivity = Date.now();
      this.session.pageViews++;
      this._saveSession();

      // Get existing analytics
      const analytics = this._getAnalytics();

      // Update page data
      const pageKey = path || window.location.pathname;
      if (!analytics.pages[pageKey]) {
        analytics.pages[pageKey] = {
          views: 0,
          visitors: new Set(),
          title: title || document.title
        };
      }

      // Update metrics
      analytics.pages[pageKey].views++;
      analytics.pages[pageKey].visitors.add(this.session.id);

      // Save analytics
      this._saveAnalytics(analytics);

      // Check if we should send batch update
      if (this._shouldSendBatch(analytics)) {
        this._sendBatchUpdate(analytics);
      }

      this._log('Page view tracked:', { path: pageKey, title });
    } catch (error) {
      this._log('Error tracking page view:', error);
    }
  }

  /**
   * Get analytics data
   * @returns {Object} Analytics data
   */
  getAnalytics() {
    try {
      const analytics = this._getAnalytics();
      return {
        pages: Object.entries(analytics.pages).map(([path, data]) => ({
          path,
          title: data.title,
          views: data.views,
          visitors: data.visitors.size
        })).sort((a, b) => b.views - a.views),
        totalViews: Object.values(analytics.pages).reduce((sum, page) => sum + page.views, 0),
        totalVisitors: new Set(
          Object.values(analytics.pages).flatMap(page => Array.from(page.visitors))
        ).size
      };
    } catch (error) {
      this._log('Error getting analytics:', error);
      return { pages: [], totalViews: 0, totalVisitors: 0 };
    }
  }

  /**
   * Get raw analytics data from storage
   * @private
   */
  _getAnalytics() {
    try {
      const data = localStorage.getItem(this.storageKey);
      if (!data) return { pages: {} };
      
      const parsed = JSON.parse(data);
      // Convert visitor arrays back to Sets
      Object.values(parsed.pages).forEach(page => {
        page.visitors = new Set(page.visitors);
      });
      return parsed;
    } catch {
      return { pages: {} };
    }
  }

  /**
   * Save analytics data to storage
   * @private
   */
  _saveAnalytics(analytics) {
    try {
      // Convert Sets to Arrays for storage
      const storageData = {
        pages: Object.entries(analytics.pages).reduce((acc, [path, data]) => {
          acc[path] = {
            ...data,
            visitors: Array.from(data.visitors || [])
          };
          return acc;
        }, {})
      };
      localStorage.setItem(this.storageKey, JSON.stringify(storageData));
    } catch (error) {
      this._log('Error saving analytics:', error);
    }
  }

  /**
   * Save session data
   * @private
   */
  _saveSession() {
    try {
      localStorage.setItem(this.sessionKey, JSON.stringify(this.session));
    } catch (error) {
      this._log('Error saving session:', error);
    }
  }

  /**
   * Check if batch update should be sent
   * @private
   */
  _shouldSendBatch(analytics) {
    const totalViews = Object.values(analytics.pages).reduce((sum, page) => sum + page.views, 0);
    return totalViews % this.batchSize === 0;
  }

  /**
   * Send batch update to server
   * @private
   */
  async _sendBatchUpdate(analytics) {
    try {
      const response = await fetch(this.endpoint, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(analytics)
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      this._log('Batch update sent successfully');
    } catch (error) {
      this._log('Error sending batch update:', error);
    }
  }

  /**
   * Generate unique ID
   * @private
   */
  _generateId() {
    return 'xxxxxxxx-xxxx-4xxx-yxxx-xxxxxxxxxxxx'.replace(/[xy]/g, c => {
      const r = Math.random() * 16 | 0;
      const v = c === 'x' ? r : (r & 0x3 | 0x8);
      return v.toString(16);
    });
  }

  /**
   * Log messages in debug mode
   * @private
   */
  _log(...args) {
    if (this.debug) {
      console.log('[AnalyticsBot]', ...args);
    }
  }
}

// Export for testing
if (typeof module !== 'undefined' && module.exports) {
  module.exports = { AnalyticsBot };
} else {
  window.AnalyticsBot = AnalyticsBot;
} 