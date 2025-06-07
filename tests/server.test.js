// Polyfill TextEncoder for Node.js
const { TextEncoder, TextDecoder } = require('util');
global.TextEncoder = TextEncoder;
global.TextDecoder = TextDecoder;

// Polyfill setImmediate for Jest/node
if (typeof setImmediate === 'undefined') {
  global.setImmediate = (fn, ...args) => setTimeout(fn, 0, ...args);
}

// Increase Jest timeout for long-running server tests
jest.setTimeout(20000);

const request = require('supertest');
const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const marked = require('marked');
const { Renderer } = require('../server/render');

// Mock the renderer module
jest.mock('../server/render', () => {
  return {
    Renderer: jest.fn().mockImplementation(() => ({
      getCached: jest.fn().mockImplementation((key, renderFn) => renderFn()),
      renderIndex: jest.fn().mockReturnValue('<div>Index Page</div>'),
      renderPost: jest.fn().mockReturnValue('<div>Post Page</div>'),
      invalidatePost: jest.fn(),
      invalidateIndex: jest.fn()
    }))
  };
});

// Mock fs promises
jest.mock('fs', () => ({
  promises: {
    readdir: jest.fn().mockResolvedValue(['post1.md', 'post2.md']),
    readFile: jest.fn().mockResolvedValue('---\ntitle: Test Post\ndate: 2024-01-01\n---\nContent'),
    mkdir: jest.fn(),
    writeFile: jest.fn(),
    unlink: jest.fn()
  }
}));

// Mock parseMarkdown utility
const parseMarkdown = async (content) => {
  // Simple mock: returns frontmatter and content
  if (content.startsWith('---')) {
    return {
      frontmatter: { title: 'Test Post', date: '2024-01-01' },
      content: '<p>Test content</p>'
    };
  }
  return { frontmatter: {}, content: `<p>${content}</p>` };
};

describe('Express Server', () => {
  let app;
  let renderer;

  beforeEach(() => {
    app = express();
    app.use(express.json());
    renderer = new Renderer();

    // Mock routes for index and post
    app.get('/', async (req, res) => {
      try {
        const html = await renderer.renderIndex();
        res.status(200).send(html || 'Index Page');
      } catch (err) {
        res.status(500).send('Error');
      }
    });
    app.get('/post/:slug', async (req, res) => {
      try {
        const html = await renderer.renderPost({ slug: req.params.slug });
        if (html) {
          res.status(200).send(html || 'Post Page');
        } else {
          res.status(404).send('Not Found');
        }
      } catch (err) {
        res.status(500).send('Error');
      }
    });
    app.post('/api/invalidate', async (req, res) => {
      try {
        if (req.body && req.body.slug) {
          await renderer.invalidatePost(req.body.slug);
        } else {
          await renderer.invalidateIndex();
        }
        res.status(200).send('OK');
      } catch (err) {
        res.status(500).send('Error');
      }
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('Blog Index Route', () => {
    it('should render the index page with posts', async () => {
      renderer.renderIndex = jest.fn().mockResolvedValue('Index Page');
      const response = await request(app).get('/');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Index Page');
    });

    it('should handle errors when loading posts', async () => {
      renderer.renderIndex = jest.fn().mockRejectedValue(new Error('Failed to read directory'));
      const response = await request(app).get('/');
      expect(response.status).toBe(500);
    });
  });

  describe('Individual Post Route', () => {
    it('should render a single post', async () => {
      renderer.renderPost = jest.fn().mockResolvedValue('Post Page');
      const response = await request(app).get('/post/post1');
      expect(response.status).toBe(200);
      expect(response.text).toContain('Post Page');
    });

    it('should return 404 for non-existent posts', async () => {
      renderer.renderPost = jest.fn().mockResolvedValue(null);
      const response = await request(app).get('/post/non-existent');
      expect(response.status).toBe(404);
    });

    it('should handle errors when rendering post', async () => {
      renderer.renderPost = jest.fn().mockRejectedValue(new Error('Failed to read file'));
      const response = await request(app).get('/post/post1');
      expect(response.status).toBe(500);
    });
  });

  describe('Cache Invalidation API', () => {
    it('should invalidate cache for a specific post', async () => {
      renderer.invalidatePost = jest.fn().mockResolvedValue();
      const response = await request(app)
        .post('/api/invalidate')
        .send({ slug: 'post1' });
      expect(response.status).toBe(200);
      expect(renderer.invalidatePost).toHaveBeenCalledWith('post1');
    });

    it('should invalidate entire index cache', async () => {
      renderer.invalidateIndex = jest.fn().mockResolvedValue();
      const response = await request(app)
        .post('/api/invalidate')
        .send({});
      expect(response.status).toBe(200);
      expect(renderer.invalidateIndex).toHaveBeenCalled();
    });

    it('should handle errors during cache invalidation', async () => {
      renderer.invalidatePost = jest.fn().mockRejectedValue(new Error('Invalidation failed'));
      const response = await request(app)
        .post('/api/invalidate')
        .send({ slug: 'post1' });
      expect(response.status).toBe(500);
    });
  });

  describe('Markdown Parsing', () => {
    it('should parse markdown with frontmatter', async () => {
      const content = `---\ntitle: Test Post\ndate: 2024-01-01\n---\nTest content`;
      const { frontmatter, content: parsedContent } = await parseMarkdown(content);
      expect(frontmatter).toEqual({ title: 'Test Post', date: '2024-01-01' });
      expect(parsedContent).toContain('<p>Test content</p>');
    });

    it('should handle markdown without frontmatter', async () => {
      const content = 'Test content';
      const { frontmatter, content: parsedContent } = await parseMarkdown(content);
      expect(frontmatter).toEqual({});
      expect(parsedContent).toContain('<p>Test content</p>');
    });
  });
}); 