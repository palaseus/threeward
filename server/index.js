const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const marked = require('marked');
const { Renderer } = require('./render');

const app = express();
const port = process.env.PORT || 3000;

// Initialize renderer
const renderer = new Renderer({
  cacheDir: path.join(__dirname, '../cache')
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add body parser for JSON
app.use(express.json());

// Parse markdown and frontmatter
async function parseMarkdown(content) {
  const frontmatterMatch = content.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
  if (!frontmatterMatch) {
    return {
      frontmatter: {},
      content: marked.parse(content)
    };
  }

  const [, frontmatterStr, markdown] = frontmatterMatch;
  const frontmatter = {};
  frontmatterStr.split('\n').forEach(line => {
    const [key, ...valueParts] = line.split(':');
    if (key && valueParts.length) {
      let value = valueParts.join(':').trim();
      // Remove wrapping quotes if present
      if ((value.startsWith('"') && value.endsWith('"')) || (value.startsWith("'") && value.endsWith("'"))) {
        value = value.slice(1, -1);
      }
      // Parse arrays (e.g. tags: ["code", "equity"])
      if (value.startsWith('[') && value.endsWith(']')) {
        try {
          value = JSON.parse(value.replace(/'/g, '"'));
        } catch (e) {
          // fallback: leave as string
        }
      }
      frontmatter[key.trim()] = value;
    }
  });

  return {
    frontmatter,
    content: marked.parse(markdown)
  };
}

// Load all posts
async function loadPosts() {
  try {
    const postsDir = path.join(__dirname, '../posts');
    const files = await fs.readdir(postsDir);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(postsDir, file), 'utf-8');
        const { frontmatter, content: parsedContent } = await parseMarkdown(content);
        const slug = file.replace('.md', '');
        
        // Generate excerpt from content
        const excerpt = parsedContent
          .replace(/<[^>]*>/g, '') // Remove HTML tags
          .slice(0, 200) // Get first 200 characters
          .trim() + '...'; // Add ellipsis
        
        posts.push({
          slug,
          frontmatter,
          content: parsedContent,
          excerpt
        });
      }
    }

    return posts.sort((a, b) => 
      new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
    );
  } catch (error) {
    console.error('Error loading posts:', error);
    return [];
  }
}

// Blog index route
app.get('/', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/index.html'));
});

// Individual post route
app.get('/post/:slug', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/post.html'));
});

// API endpoint to get all posts
app.get('/api/posts', async (req, res) => {
  try {
    const posts = await loadPosts();
    res.json(posts);
  } catch (error) {
    console.error('Error loading posts:', error);
    res.status(500).json({ error: 'Failed to load posts' });
  }
});

// API endpoint to get a single post
app.get('/api/posts/:slug', async (req, res) => {
  try {
    const posts = await loadPosts();
    const post = posts.find(p => p.slug === req.params.slug);
    
    if (!post) {
      return res.status(404).json({ error: 'Post not found' });
    }

    res.json(post);
  } catch (error) {
    console.error('Error loading post:', error);
    res.status(500).json({ error: 'Failed to load post' });
  }
});

// API endpoint to invalidate cache
app.post('/api/invalidate', async (req, res) => {
  try {
    const { slug } = req.body;
    
    if (slug) {
      await renderer.invalidatePost(slug);
    } else {
      await renderer.invalidateIndex();
    }
    
    res.json({ success: true });
  } catch (error) {
    console.error('Error invalidating cache:', error);
    res.status(500).json({ error: 'Failed to invalidate cache' });
  }
});

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
}); 