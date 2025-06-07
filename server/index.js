const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const marked = require('marked');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const { Renderer } = require('./render');

const app = express();
const port = process.env.PORT || 3000;

// Admin credentials (in production, these should be in environment variables)
const ADMIN_USERNAME = 'admin';
const ADMIN_PASSWORD = 'admin123'; // Store plain password temporarily
const JWT_SECRET = 'your-secret-key'; // in production, use a secure random key

// Generate password hash on server start
let hashedPassword;
bcrypt.hash(ADMIN_PASSWORD, 10).then(hash => {
    hashedPassword = hash;
    console.log('Admin password hashed successfully');
}).catch(err => {
    console.error('Error hashing admin password:', err);
});

// Initialize renderer
const renderer = new Renderer({
  cacheDir: path.join(__dirname, '../cache')
});

// Serve static files from public directory
app.use(express.static(path.join(__dirname, '../public')));

// Add body parser for JSON
app.use(express.json());

// Middleware to verify JWT token
const verifyToken = (req, res, next) => {
  const token = req.headers.authorization?.split(' ')[1];
  if (!token) {
    return res.status(401).json({ error: 'No token provided' });
  }

  try {
    const decoded = jwt.verify(token, JWT_SECRET);
    req.user = decoded;
    next();
  } catch (error) {
    return res.status(401).json({ error: 'Invalid token' });
  }
};

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

// Admin routes
app.get('/admin/login', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/login.html'));
});

app.get('/admin/dashboard', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/dashboard.html'));
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

// Admin API endpoints
app.post('/api/admin/login', async (req, res) => {
    const { username, password } = req.body;
    console.log('Login attempt:', { username, password });

    if (username === 'admin' && password === 'admin123') {
        const token = jwt.sign({ username }, JWT_SECRET, { expiresIn: '24h' });
        res.json({ token });
    } else {
        res.status(401).json({ error: 'Invalid credentials' });
    }
});

app.get('/api/admin/verify', verifyToken, (req, res) => {
    res.json({ valid: true });
});

app.get('/api/admin/posts', verifyToken, async (req, res) => {
    try {
        const posts = await loadPosts();
        res.json(posts);
    } catch (error) {
        console.error('Error loading posts:', error);
        res.status(500).json({ error: 'Failed to load posts' });
    }
});

// Cache invalidation function
async function invalidateCache() {
    try {
        const cacheDir = path.join(__dirname, '../cache');
        await fs.rm(cacheDir, { recursive: true, force: true });
        await fs.mkdir(cacheDir, { recursive: true });
        console.log('Cache invalidated successfully');
    } catch (error) {
        console.error('Error invalidating cache:', error);
    }
}

// API endpoint to invalidate cache
app.post('/api/invalidate', verifyToken, async (req, res) => {
    try {
        await invalidateCache();
        res.json({ success: true });
    } catch (error) {
        console.error('Error invalidating cache:', error);
        res.status(500).json({ error: 'Failed to invalidate cache' });
    }
});

app.post('/api/admin/posts', verifyToken, async (req, res) => {
    try {
        const { title, date, tags, excerpt, content } = req.body;
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const post = {
            frontmatter: {
                title,
                date,
                tags,
                excerpt
            },
            content,
            slug
        };

        const postPath = path.join(__dirname, '..', 'posts', `${slug}.md`);
        const markdown = generateMarkdown(post);
        await fs.writeFile(postPath, markdown);

        // Invalidate cache
        await invalidateCache();

        res.json({ success: true, slug });
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.put('/api/admin/posts/:slug', verifyToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const { title, date, tags, excerpt, content } = req.body;
        const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-');
        const post = {
            frontmatter: {
                title,
                date,
                tags,
                excerpt
            },
            content,
            slug: newSlug
        };

        const oldPath = path.join(__dirname, '..', 'posts', `${slug}.md`);
        const newPath = path.join(__dirname, '..', 'posts', `${newSlug}.md`);

        // Delete old file if slug changed
        if (slug !== newSlug) {
            await fs.unlink(oldPath);
        }

        const markdown = generateMarkdown(post);
        await fs.writeFile(newPath, markdown);

        // Invalidate cache
        await invalidateCache();

        res.json({ success: true, slug: newSlug });
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.delete('/api/admin/posts/:slug', verifyToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const postPath = path.join(__dirname, '..', 'posts', `${slug}.md`);
        await fs.unlink(postPath);

        // Invalidate cache
        await invalidateCache();

        res.json({ success: true });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Helper function to generate markdown from post data
function generateMarkdown(post) {
    const frontmatter = `---
title: "${post.frontmatter.title}"
date: "${post.frontmatter.date}"
tags: ${JSON.stringify(post.frontmatter.tags)}
excerpt: "${post.frontmatter.excerpt || ''}"
---

${post.content}`;
    return frontmatter;
}

// Error handling middleware
app.use((err, req, res, next) => {
  console.error(err.stack);
  res.status(500).send('Something broke!');
});

// Start server
app.listen(port, '0.0.0.0', () => {
  console.log(`Server running at http://localhost:${port}`);
}); 