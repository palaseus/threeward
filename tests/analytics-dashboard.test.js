const { AnalyticsDashboard } = require('../js/analytics-dashboard');

describe('AnalyticsDashboard', () => {
  let dashboard;
  let container;
  let mockOptions;
  let mockAnalytics;

  beforeEach(() => {
    // Create container element
    container = document.createElement('div');
    container.id = 'analytics-dashboard';
    document.body.appendChild(container);

    // Mock analytics object
    mockAnalytics = {
      getAnalytics: jest.fn().mockReturnValue({
        pages: [
          { title: 'Post 1', views: 100, visitors: 50 },
          { title: 'Post 2', views: 80, visitors: 40 }
        ],
        totalViews: 180,
        totalVisitors: 90
      })
    };

    // Mock options
    mockOptions = {
      container,
      refreshInterval: 5000,
      analytics: mockAnalytics
    };

    // Create dashboard instance
    dashboard = new AnalyticsDashboard(mockOptions);
  });

  afterEach(() => {
    document.body.removeChild(container);
    jest.clearAllMocks();
  });

  test('should initialize dashboard with correct options', () => {
    expect(dashboard.container).toBe(container);
    expect(dashboard.refreshInterval).toBe(mockOptions.refreshInterval);
    expect(dashboard.analytics).toBe(mockAnalytics);
  });

  test('should render dashboard on init', () => {
    dashboard.init();
    expect(mockAnalytics.getAnalytics).toHaveBeenCalled();
    expect(container.querySelector('.analytics-dashboard')).toBeTruthy();
  });

  test('should render top posts correctly', () => {
    dashboard.init();
    const postList = container.querySelector('.post-list');
    expect(postList.children.length).toBe(2);
    expect(postList.textContent).toContain('Post 1');
    expect(postList.textContent).toContain('Post 2');
  });
}); 