// blog.js - Core blog functionality
const cache = require('./cache');
const seo = require('./seo');
const utils = require('./utils');
const api = require('./api');

class Blog {
  constructor(apiInstance = api) {
    this.api = apiInstance;
    this.posts = [];
    this.postCache = new Map();
    this.featuredPost = null;
  }

  async init() {
    try {
      await this.loadPosts();
      this.updateMetaTags();
      this.renderBlogIndex();
      if (this.posts.length > 0) {
        this.preloadPost(this.posts[0].id);
      }
    } catch (error) {
      console.error('Failed to initialize blog:', error);
      this.showError('Unable to load blog posts. Please try again later.');
    }
  }

  updateMetaTags(route) {
    if (route === 'home') {
      document.title = 'Blog Home';
      return;
    }
    const post = this.postCache.get(route);
    if (post) {
      document.title = post.title;
    }
  }

  updateMetaDescription(content) {
    let metaDesc = document.querySelector('meta[name="description"]');
    if (!metaDesc) {
      metaDesc = document.createElement('meta');
      metaDesc.name = 'description';
      document.head.appendChild(metaDesc);
    }
    metaDesc.content = content;
  }

  async loadPosts() {
    try {
      const data = await this.api.getPosts();
      this.posts = data;
      return data;
    } catch (error) {
      console.error('Error loading posts:', error);
      throw error;
    }
  }

  renderBlogIndex() {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;
    mainContent.innerHTML = '';
    if (this.posts.length > 0) {
      const featured = this.posts[0];
      const featuredSection = this.createPostPreview(featured, true);
      mainContent.appendChild(featuredSection);
    }
    const postList = document.createElement('section');
    postList.className = 'post-list';
    postList.setAttribute('aria-label', 'Blog posts');
    this.posts.slice(1).forEach(post => {
      const preview = this.createPostPreview(post);
      postList.appendChild(preview);
    });
    mainContent.appendChild(postList);
  }

  createPostPreview(post, isFeatured = false) {
    const article = document.createElement('article');
    article.className = isFeatured ? 'featured-post' : 'post-preview';
    article.setAttribute('aria-labelledby', `post-title-${post.id}`);
    const title = document.createElement('h2');
    title.id = `post-title-${post.id}`;
    title.className = 'post-title';
    title.textContent = post.title;
    const link = document.createElement('a');
    link.href = `#${post.id}`;
    link.appendChild(title);
    link.setAttribute('aria-label', `Read more about ${post.title}`);
    const excerpt = document.createElement('p');
    excerpt.className = 'post-excerpt';
    excerpt.textContent = post.excerpt;
    const meta = document.createElement('div');
    meta.className = 'post-meta';
    meta.innerHTML = `
      <time datetime="${post.date}">${new Date(post.date).toLocaleDateString()}</time>
      ${post.tags.length ? `<span class="post-tags">${post.tags.join(', ')}</span>` : ''}
    `;
    article.appendChild(link);
    article.appendChild(excerpt);
    article.appendChild(meta);
    return article;
  }

  async loadPost(slug) {
    try {
      const cachedPost = cache.get(`post:${slug}`);
      if (cachedPost) {
        return cachedPost;
      }
      const response = await fetch(`/posts/${slug}.md`);
      if (!response.ok) {
        throw new Error('Post not found');
      }
      const markdown = await response.text();
      const post = this.parseMarkdown(markdown);
      cache.set(`post:${slug}`, post, 3600000);
      return post;
    } catch (error) {
      throw new Error(`Failed to load post: ${error.message}`);
    }
  }

  async preloadPost(postId) {
    try {
      await this.loadPost(postId);
    } catch (error) {
      console.warn(`Failed to preload post ${postId}:`, error);
    }
  }

  parseMarkdown(markdown) {
    const frontmatterMatch = markdown.match(/^---\n([\s\S]*?)\n---\n([\s\S]*)$/);
    if (!frontmatterMatch) {
      return {
        frontmatter: {},
        content: this.processMarkdownContent(markdown)
      };
    }
    const [, frontmatterStr, content] = frontmatterMatch;
    const frontmatter = this.parseFrontmatter(frontmatterStr);
    return {
      frontmatter,
      content: this.processMarkdownContent(content)
    };
  }

  processMarkdownContent(content) {
    let html = content
      .replace(/^# (.*$)/gm, '<h1>$1</h1>')
      .replace(/^## (.*$)/gm, '<h2>$1</h2>')
      .replace(/^### (.*$)/gm, '<h3>$1</h3>')
      .replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
      .replace(/\*(.*?)\*/g, '<em>$1</em>')
      .replace(/!\[(.*?)\]\((.*?)\)/g, '<img alt="$1" src="$2" loading="lazy" />')
      .replace(/\[(.*?)\]\((.*?)\)/g, '<a href="$2">$1</a>')
      .replace(/\n\n/g, '<br><br>');
    return html;
  }

  parseFrontmatter(frontmatter) {
    const result = {};
    frontmatter.split('\n').forEach(line => {
      const [key, ...valueParts] = line.split(':');
      if (key && valueParts.length) {
        const value = valueParts.join(':').trim();
        result[key.trim()] = value;
      }
    });
    return result;
  }

  showError(message) {
    const mainContent = document.querySelector('.main-content');
    if (!mainContent) return;

    const error = document.createElement('div');
    error.className = 'error-message';
    error.setAttribute('role', 'alert');
    error.innerHTML = `
      <p>${message}</p>
      <a href="#home" class="error-link">Return to home</a>
    `;
    mainContent.appendChild(error);
  }

  renderPost(post, container) {
    // Update meta tags
    seo.updateMetaTags(post);

    // Create post element
    const article = document.createElement('article');
    article.className = 'post';

    // Add post content
    article.innerHTML = `
      <h1 class="post-title">${post.frontmatter.title || 'Untitled'}</h1>
      <div class="post-meta">
        <time datetime="${post.frontmatter.date || ''}">${post.frontmatter.date || ''}</time>
        ${post.frontmatter.tags ? `
          <div class="post-tags">
            ${post.frontmatter.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
          </div>
        ` : ''}
      </div>
      <div class="post-content">${post.content}</div>
    `;

    // Clear container and append post
    container.innerHTML = '';
    container.appendChild(article);

    // Prefetch next post
    this.prefetchNextPost(post.frontmatter.tags, post.frontmatter.slug);
  }

  async prefetchNextPost(tags, currentSlug) {
    try {
      const posts = await this.api.getPosts();
      const nextPost = posts.find(post => post.slug !== currentSlug && post.tags.some(tag => tags.includes(tag)));
      if (nextPost) {
        const link = document.createElement('link');
        link.rel = 'prefetch';
        link.href = `/posts/${nextPost.slug}.md`;
        document.head.appendChild(link);
      }
    } catch (error) {
      console.warn('Failed to prefetch next post:', error);
    }
  }

  async renderBlogIndex(container) {
    try {
      const response = await fetch('/posts/index.json');
      const posts = await response.json();

      const html = posts.map(post => `
        <article class="post-preview">
          <h2><a href="#${post.slug}">${post.title}</a></h2>
          <div class="post-meta">
            <time datetime="${post.date}">${post.date}</time>
            ${post.tags ? `
              <div class="post-tags">
                ${post.tags.map(tag => `<span class="tag">${tag}</span>`).join('')}
              </div>
            ` : ''}
          </div>
          <p>${post.excerpt || ''}</p>
        </article>
      `).join('');

      container.innerHTML = html;
      seo.resetMetaTags();
    } catch (error) {
      container.innerHTML = `<div class="error-message">${utils.handleError(error)}</div>`;
    }
  }
}

// Export both the Blog class and a singleton instance for app use
module.exports = {
  Blog,
  blog: new Blog()
};

// Initialize when DOM is ready
document.addEventListener('DOMContentLoaded', () => {
  blog.init();
}); 