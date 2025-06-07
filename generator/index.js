const fs = require('fs').promises;
const path = require('path');
const marked = require('marked');
const { promisify } = require('util');
const { exec } = require('child_process');
const execAsync = promisify(exec);

class StaticSiteGenerator {
  constructor(options = {}) {
    this.sourceDir = options.sourceDir || path.join(process.cwd(), 'posts');
    this.distDir = options.distDir || path.join(process.cwd(), 'dist');
    this.templateDir = options.templateDir || path.join(process.cwd(), 'templates');
    this.cacheFile = path.join(this.distDir, '.build-cache.json');
    this.templates = {};
  }

  async init() {
    // Create necessary directories
    await fs.mkdir(this.distDir, { recursive: true });
    await fs.mkdir(this.templateDir, { recursive: true });

    // Load templates
    await this.loadTemplates();
  }

  async loadTemplates() {
    const templateFiles = await fs.readdir(this.templateDir);
    for (const file of templateFiles) {
      if (file.endsWith('.html')) {
        const content = await fs.readFile(path.join(this.templateDir, file), 'utf-8');
        this.templates[file.replace('.html', '')] = content;
      }
    }
  }

  async parseMarkdown(content) {
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
        const value = valueParts.join(':').trim();
        frontmatter[key.trim()] = value;
      }
    });

    return {
      frontmatter,
      content: marked.parse(markdown)
    };
  }

  async loadPosts() {
    const files = await fs.readdir(this.sourceDir);
    const posts = [];

    for (const file of files) {
      if (file.endsWith('.md')) {
        const content = await fs.readFile(path.join(this.sourceDir, file), 'utf-8');
        const { frontmatter, content: parsedContent } = await this.parseMarkdown(content);
        const slug = file.replace('.md', '');
        
        posts.push({
          slug,
          frontmatter,
          content: parsedContent
        });
      }
    }

    return posts.sort((a, b) => 
      new Date(b.frontmatter.date) - new Date(a.frontmatter.date)
    );
  }

  async loadBuildCache() {
    try {
      const cache = await fs.readFile(this.cacheFile, 'utf-8');
      return JSON.parse(cache);
    } catch {
      return {};
    }
  }

  async saveBuildCache(cache) {
    await fs.writeFile(this.cacheFile, JSON.stringify(cache, null, 2));
  }

  async renderPost(post) {
    const template = this.templates.post || this.templates.default;
    if (!template) {
      throw new Error('Post template not found');
    }

    // Replace template variables
    let html = template
      .replace('{{title}}', post.frontmatter.title)
      .replace('{{date}}', post.frontmatter.date)
      .replace('{{content}}', post.content)
      .replace('{{tags}}', post.frontmatter.tags || '');

    // Add meta tags
    const metaTags = `
      <meta name="description" content="${post.frontmatter.description || ''}">
      <meta name="keywords" content="${post.frontmatter.tags || ''}">
      <meta property="og:title" content="${post.frontmatter.title}">
      <meta property="og:type" content="article">
      <meta property="og:description" content="${post.frontmatter.description || ''}">
      <meta property="article:published_time" content="${post.frontmatter.date}">
    `;
    html = html.replace('{{meta}}', metaTags);

    return html;
  }

  async renderIndex(posts) {
    const template = this.templates.index || this.templates.default;
    if (!template) {
      throw new Error('Index template not found');
    }

    const postList = posts.map(post => `
      <article class="post-preview">
        <h2><a href="/post/${post.slug}">${post.frontmatter.title}</a></h2>
        <div class="post-meta">
          <time datetime="${post.frontmatter.date}">${post.frontmatter.date}</time>
          ${post.frontmatter.tags ? `<div class="tags">${post.frontmatter.tags}</div>` : ''}
        </div>
        <p>${post.frontmatter.description || ''}</p>
      </article>
    `).join('');

    return template
      .replace('{{title}}', 'Blog Index')
      .replace('{{content}}', postList)
      .replace('{{meta}}', `
        <meta name="description" content="Blog index page">
        <meta property="og:title" content="Blog Index">
        <meta property="og:type" content="website">
      `);
  }

  async build() {
    console.log('Starting build...');
    await this.init();

    // Load posts and build cache
    const posts = await this.loadPosts();
    const cache = await this.loadBuildCache();
    const newCache = {};

    // Build index page
    console.log('Building index page...');
    const indexHtml = await this.renderIndex(posts);
    await fs.writeFile(path.join(this.distDir, 'index.html'), indexHtml);
    newCache['index'] = Date.now();

    // Build individual posts
    for (const post of posts) {
      const sourcePath = path.join(this.sourceDir, `${post.slug}.md`);
      const stats = await fs.stat(sourcePath);
      const mtime = stats.mtime.getTime();

      // Check if post needs rebuilding
      if (!cache[post.slug] || cache[post.slug] < mtime) {
        console.log(`Building post: ${post.slug}`);
        const postHtml = await this.renderPost(post);
        await fs.writeFile(
          path.join(this.distDir, 'post', `${post.slug}.html`),
          postHtml
        );
        newCache[post.slug] = mtime;
      } else {
        console.log(`Skipping unchanged post: ${post.slug}`);
        newCache[post.slug] = cache[post.slug];
      }
    }

    // Save new cache
    await this.saveBuildCache(newCache);
    console.log('Build complete!');
  }
}

module.exports = StaticSiteGenerator; 