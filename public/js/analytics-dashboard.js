/**
 * Analytics Dashboard UI
 * Displays analytics data in a clean, minimal interface
 */

class AnalyticsDashboard {
  constructor(options = {}) {
    this.container = options.container || document.getElementById('analytics-dashboard');
    this.refreshInterval = options.refreshInterval || 30000; // 30 seconds
    this.analytics = options.analytics;
    this.chartColors = {
      primary: '#3498db',
      secondary: '#2ecc71',
      background: '#f8f9fa'
    };
  }

  /**
   * Initialize dashboard
   */
  init() {
    if (!this.container) {
      console.error('Analytics dashboard container not found');
      return;
    }

    this._render();
    this._startAutoRefresh();
  }

  /**
   * Render dashboard
   * @private
   */
  _render() {
    const data = this.analytics.getAnalytics();
    
    this.container.innerHTML = `
      <div class="analytics-dashboard">
        <header class="dashboard-header">
          <h2>Analytics</h2>
          <div class="dashboard-stats">
            <div class="stat">
              <span class="stat-value">${data.totalViews}</span>
              <span class="stat-label">Total Views</span>
            </div>
            <div class="stat">
              <span class="stat-value">${data.totalVisitors}</span>
              <span class="stat-label">Unique Visitors</span>
            </div>
          </div>
        </header>

        <div class="dashboard-content">
          <div class="top-posts">
            <h3>Top Posts</h3>
            <div class="post-list">
              ${this._renderTopPosts(data.pages)}
            </div>
          </div>

          <div class="charts">
            <div class="chart-container">
              <h3>Views by Post</h3>
              <div class="chart" id="views-chart">
                ${this._renderViewsChart(data.pages)}
              </div>
            </div>
          </div>
        </div>

        <style>
          .analytics-dashboard {
            font-family: system-ui, -apple-system, sans-serif;
            color: #333;
            background: white;
            border-radius: 8px;
            box-shadow: 0 2px 4px rgba(0,0,0,0.1);
            padding: 20px;
          }

          .dashboard-header {
            display: flex;
            justify-content: space-between;
            align-items: center;
            margin-bottom: 20px;
            padding-bottom: 20px;
            border-bottom: 1px solid #eee;
          }

          .dashboard-stats {
            display: flex;
            gap: 20px;
          }

          .stat {
            text-align: center;
          }

          .stat-value {
            display: block;
            font-size: 24px;
            font-weight: bold;
            color: ${this.chartColors.primary};
          }

          .stat-label {
            font-size: 14px;
            color: #666;
          }

          .post-list {
            display: grid;
            gap: 10px;
          }

          .post-item {
            display: flex;
            justify-content: space-between;
            align-items: center;
            padding: 10px;
            background: ${this.chartColors.background};
            border-radius: 4px;
          }

          .post-title {
            flex: 1;
            margin-right: 10px;
          }

          .post-stats {
            display: flex;
            gap: 15px;
            font-size: 14px;
            color: #666;
          }

          .chart {
            margin-top: 10px;
            padding: 10px;
            background: ${this.chartColors.background};
            border-radius: 4px;
          }

          .chart-bar {
            height: 20px;
            background: ${this.chartColors.primary};
            border-radius: 2px;
            margin: 5px 0;
            transition: width 0.3s ease;
          }

          .chart-label {
            display: flex;
            justify-content: space-between;
            font-size: 12px;
            color: #666;
            margin-bottom: 5px;
          }
        </style>
      </div>
    `;
  }

  /**
   * Render top posts list
   * @private
   */
  _renderTopPosts(pages) {
    return pages.slice(0, 5).map(page => `
      <div class="post-item">
        <div class="post-title">${page.title}</div>
        <div class="post-stats">
          <span>${page.views} views</span>
          <span>${page.visitors} visitors</span>
        </div>
      </div>
    `).join('');
  }

  /**
   * Render views chart
   * @private
   */
  _renderViewsChart(pages) {
    const maxViews = Math.max(...pages.map(p => p.views));
    
    return pages.slice(0, 5).map(page => `
      <div class="chart-label">
        <span>${page.title}</span>
        <span>${page.views} views</span>
      </div>
      <div class="chart-bar" style="width: ${(page.views / maxViews * 100)}%"></div>
    `).join('');
  }

  /**
   * Start auto-refresh
   * @private
   */
  _startAutoRefresh() {
    setInterval(() => this._render(), this.refreshInterval);
  }
}

// Export both the class and a factory function
export { AnalyticsDashboard };
export const createDashboard = (options) => {
  const dashboard = new AnalyticsDashboard(options);
  dashboard.init();
  return dashboard;
}; 