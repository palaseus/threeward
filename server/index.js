const express = require('express');
const path = require('path');
const fs = require('fs').promises;
const marked = require('marked');
const jwt = require('jsonwebtoken');
const bcrypt = require('bcryptjs');
const multer = require('multer');
const { Renderer } = require('./render');
const matter = require('gray-matter');

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

app.get('/admin/posts', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/posts.html'));
});

app.get('/admin/media', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/media.html'));
});

app.get('/admin/settings', (req, res) => {
  res.sendFile(path.join(__dirname, '../public/admin/settings.html'));
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

// Get a single post
app.get('/api/admin/posts/:slug', verifyToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const postPath = path.join(__dirname, '../posts', `${slug}.md`);
        
        try {
            const content = await fs.readFile(postPath, 'utf8');
            const { data: frontmatter, content: postContent } = matter(content);
            
            res.json({
                ...frontmatter,
                content: postContent
            });
        } catch (error) {
            if (error.code === 'ENOENT') {
                res.status(404).json({ error: 'Post not found' });
            } else {
                throw error;
            }
        }
    } catch (error) {
        console.error('Error loading post:', error);
        res.status(500).json({ error: 'Failed to load post' });
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
        const slug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');
        const post = {
            frontmatter: {
                title,
                date,
                tags: tags || [],
                excerpt
            },
            content,
            slug
        };

        const postPath = path.join(__dirname, '../posts', `${slug}.md`);
        const postContent = `---
title: ${title}
date: ${date}
tags: ${tags.join(', ')}
excerpt: ${excerpt}
---

${content}`;

        await fs.promises.writeFile(postPath, postContent);
        await invalidateCache();
        res.json(post);
    } catch (error) {
        console.error('Error creating post:', error);
        res.status(500).json({ error: 'Failed to create post' });
    }
});

app.put('/api/admin/posts/:slug', verifyToken, async (req, res) => {
    try {
        const { title, date, tags, excerpt, content } = req.body;
        const oldSlug = req.params.slug;
        const newSlug = title.toLowerCase().replace(/[^a-z0-9]+/g, '-').replace(/(^-|-$)/g, '');

        const post = {
            frontmatter: {
                title,
                date,
                tags: tags || [],
                excerpt
            },
            content,
            slug: newSlug
        };

        const oldPostPath = path.join(__dirname, '../posts', `${oldSlug}.md`);
        const newPostPath = path.join(__dirname, '../posts', `${newSlug}.md`);

        const postContent = `---
title: ${title}
date: ${date}
tags: ${tags.join(', ')}
excerpt: ${excerpt}
---

${content}`;

        if (oldSlug !== newSlug) {
            await fs.promises.unlink(oldPostPath);
        }
        await fs.promises.writeFile(newPostPath, postContent);
        await invalidateCache();
        res.json(post);
    } catch (error) {
        console.error('Error updating post:', error);
        res.status(500).json({ error: 'Failed to update post' });
    }
});

app.delete('/api/admin/posts/:slug', verifyToken, async (req, res) => {
    try {
        const { slug } = req.params;
        const postPath = path.join(__dirname, '../posts', `${slug}.md`);
        await fs.promises.unlink(postPath);
        await invalidateCache();
        res.json({ message: 'Post deleted successfully' });
    } catch (error) {
        console.error('Error deleting post:', error);
        res.status(500).json({ error: 'Failed to delete post' });
    }
});

// Configure multer for media uploads
const storage = multer.diskStorage({
    destination: function (req, file, cb) {
        const type = file.mimetype.startsWith('image/') ? 'images' : 'videos';
        cb(null, path.join(__dirname, `../public/media/${type}`));
    },
    filename: function (req, file, cb) {
        const uniqueSuffix = Date.now() + '-' + Math.round(Math.random() * 1E9);
        const ext = path.extname(file.originalname);
        cb(null, uniqueSuffix + ext);
    }
});

const upload = multer({
    storage: storage,
    limits: {
        fileSize: 10 * 1024 * 1024 // 10MB limit
    },
    fileFilter: function (req, file, cb) {
        if (file.mimetype.startsWith('image/') || file.mimetype.startsWith('video/')) {
            cb(null, true);
        } else {
            cb(new Error('Only images and videos are allowed'));
        }
    }
});

// Media upload endpoint
app.post('/api/admin/media', verifyToken, upload.single('file'), async (req, res) => {
    try {
        if (!req.file) {
            throw new Error('No file uploaded');
        }

        const type = req.file.mimetype.startsWith('image/') ? 'image' : 'video';
        const url = `/media/${type === 'image' ? 'images' : 'videos'}/${req.file.filename}`;

        res.json({
            url,
            type,
            filename: req.file.filename
        });
    } catch (error) {
        console.error('Error uploading media:', error);
        res.status(500).json({ error: 'Failed to upload media' });
    }
});

// Get media list
app.get('/api/admin/media', verifyToken, async (req, res) => {
    try {
        const imagesDir = path.join(__dirname, '../public/media/images');
        const videosDir = path.join(__dirname, '../public/media/videos');

        const [images, videos] = await Promise.all([
            fs.readdir(imagesDir).catch(() => []),
            fs.readdir(videosDir).catch(() => [])
        ]);

        const media = [
            ...images.map(filename => ({
                url: `/media/images/${filename}`,
                type: 'image',
                filename
            })),
            ...videos.map(filename => ({
                url: `/media/videos/${filename}`,
                type: 'video',
                filename
            }))
        ];

        res.json(media);
    } catch (error) {
        console.error('Error loading media:', error);
        res.status(500).json({ error: 'Failed to load media' });
    }
});

// Delete media
app.delete('/api/admin/media/:filename', verifyToken, async (req, res) => {
    try {
        const { filename } = req.params;
        const imagePath = path.join(__dirname, '../public/media/images', filename);
        const videoPath = path.join(__dirname, '../public/media/videos', filename);

        try {
            await fs.promises.access(imagePath);
            await fs.promises.unlink(imagePath);
        } catch {
            try {
                await fs.promises.access(videoPath);
                await fs.promises.unlink(videoPath);
            } catch {
                throw new Error('File not found');
            }
        }

        res.json({ message: 'Media deleted successfully' });
    } catch (error) {
        console.error('Error deleting media:', error);
        res.status(500).json({ error: 'Failed to delete media' });
    }
});

// Settings endpoints
app.get('/api/admin/settings', verifyToken, async (req, res) => {
    try {
        const settings = {
            blogTitle: 'Your Blog',
            blogDescription: 'A modern blog built with Node.js',
            adminUsername: 'admin'
        };
        res.json(settings);
    } catch (error) {
        console.error('Error loading settings:', error);
        res.status(500).json({ error: 'Failed to load settings' });
    }
});

app.put('/api/admin/settings', verifyToken, async (req, res) => {
    try {
        const { blogTitle, blogDescription, adminUsername, adminPassword } = req.body;

        // Update settings
        if (adminPassword) {
            const hashedPassword = await bcrypt.hash(adminPassword, 10);
            // Update admin credentials
            adminCredentials.password = hashedPassword;
        }

        // Save settings to a file or database
        const settings = {
            blogTitle,
            blogDescription,
            adminUsername: adminUsername || 'admin'
        };

        // TODO: Save settings to a file or database

        res.json({ message: 'Settings updated successfully' });
    } catch (error) {
        console.error('Error saving settings:', error);
        res.status(500).json({ error: 'Failed to save settings' });
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