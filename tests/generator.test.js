const { Generator } = require('../js/generator');
const fs = require('fs').promises;

jest.mock('fs', () => ({
  promises: {
    readFile: jest.fn(),
    writeFile: jest.fn(),
    readdir: jest.fn(),
    mkdir: jest.fn()
  }
}));

describe('Generator', () => {
  let generator;
  const mockPosts = [
    {
      id: 1,
      title: 'Post 1',
      content: 'Content 1',
      tags: ['tag1', 'tag2']
    },
    {
      id: 2,
      title: 'Post 2',
      content: 'Content 2',
      tags: ['tag2', 'tag3']
    }
  ];

  beforeEach(() => {
    // Mock template files
    fs.readFile.mockImplementation((path) => {
      switch (path) {
        case 'templates/default.html':
          return Promise.resolve('{{content}}');
        case 'templates/post.html':
          return Promise.resolve('{{title}}\n{{content}}');
        case 'templates/index.html':
          return Promise.resolve('{{postList}}');
        default:
          return Promise.reject(new Error('Template not found'));
      }
    });

    fs.readdir.mockResolvedValue(['default.html', 'post.html', 'index.html']);
    fs.mkdir.mockResolvedValue(undefined);
    fs.writeFile.mockResolvedValue(undefined);

    generator = new Generator({
      templateDir: 'templates',
      outputDir: 'output'
    });
  });

  afterEach(() => {
    jest.clearAllMocks();
  });

  describe('generate', () => {
    it('should generate all pages', async () => {
      await generator.generate(mockPosts);

      expect(fs.mkdir).toHaveBeenCalledWith('output', { recursive: true });
      expect(fs.writeFile).toHaveBeenCalledTimes(3); // index + 2 posts
    });

    it('should handle template errors', async () => {
      fs.readFile.mockRejectedValueOnce(new Error('Template error'));
      await expect(generator.generate(mockPosts)).rejects.toThrow('Template error');
    });
  });

  describe('generatePost', () => {
    it('should generate a single post', async () => {
      const post = mockPosts[0];
      await generator.generatePost(post);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('output/post-1.html'),
        expect.stringContaining(post.title)
      );
    });
  });

  describe('generateIndex', () => {
    it('should generate index page', async () => {
      await generator.generateIndex(mockPosts);

      expect(fs.writeFile).toHaveBeenCalledWith(
        expect.stringContaining('output/index.html'),
        expect.stringContaining('Post 1')
      );
    });
  });
}); 