// post.js - Handle individual post pages
const post = {
  init() {
    this.setupMobileMenu();
    this.setupNewsletterForm();
    this.loadPost();
  },

  async loadPost() {
    const postContent = document.getElementById('post-content');
    if (!postContent) return;

    try {
      // Get the post slug from the URL
      const slug = window.location.pathname.split('/').pop();
      const response = await fetch(`/api/posts/${slug}`);
      
      if (!response.ok) {
        if (response.status === 404) {
          this.showError('Post not found');
        } else {
          throw new Error('Failed to load post');
        }
        return;
      }

      const post = await response.json();
      this.renderPost(post);
    } catch (error) {
      console.error('Error loading post:', error);
      this.showError('Failed to load post. Please try again later.');
    }
  },

  renderPost(post) {
    const postContent = document.getElementById('post-content');
    if (!postContent) return;

    // Update page title and meta description
    document.title = `${post.frontmatter.title} - Threeward`;
    const metaDescription = document.querySelector('meta[name="description"]');
    if (metaDescription) {
      metaDescription.content = post.excerpt;
    }

    // Process content to enhance media elements
    let processedContent = post.content;
    
    // Add classes to images
    processedContent = processedContent.replace(
        /<img([^>]*)>/g,
        '<img$1 class="rounded-lg shadow-lg my-8 max-w-full h-auto">'
    );

    // Add classes to videos
    processedContent = processedContent.replace(
        /<video([^>]*)>/g,
        '<video$1 class="rounded-lg shadow-lg my-8 w-full max-w-full h-auto" controls>'
    );

    postContent.innerHTML = `
        <header class="mb-8">
            <div class="flex items-center space-x-2 mb-4">
                ${Array.isArray(post.frontmatter.tags) ? post.frontmatter.tags.map(tag => `
                    <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                        ${tag}
                    </span>
                `).join('') : ''}
            </div>
            <h1 class="text-4xl font-bold text-gray-900 dark:text-white mb-4">
                ${post.frontmatter.title}
            </h1>
            <div class="flex items-center space-x-4 text-gray-600 dark:text-gray-400">
                <time datetime="${post.frontmatter.date}">
                    ${new Date(post.frontmatter.date).toLocaleDateString('en-US', {
                        year: 'numeric',
                        month: 'long',
                        day: 'numeric'
                    })}
                </time>
                ${post.frontmatter.author ? `
                    <span>by ${post.frontmatter.author}</span>
                ` : ''}
            </div>
        </header>
        <div class="prose dark:prose-invert max-w-none">
            ${processedContent}
        </div>
    `;

    // Add lazy loading to images
    const images = postContent.getElementsByTagName('img');
    for (const img of images) {
        img.loading = 'lazy';
    }
  },

  showError(message) {
    const postContent = document.getElementById('post-content');
    if (!postContent) return;

    postContent.innerHTML = `
      <div class="text-center">
        <h1 class="text-2xl font-bold text-gray-900 dark:text-white mb-4">Oops!</h1>
        <p class="text-gray-600 dark:text-gray-400">${message}</p>
        <a href="/" class="inline-block mt-4 text-blue-600 hover:text-blue-800 dark:text-blue-400 dark:hover:text-blue-300 transition-colors">
          ← Back to Home
        </a>
      </div>
    `;
  },

  setupMobileMenu() {
    const button = document.getElementById('mobile-menu-button');
    const menu = document.getElementById('mobile-menu');
    if (!button || !menu) return;

    button.addEventListener('click', () => {
      menu.classList.toggle('hidden');
    });

    // Close menu when clicking outside
    document.addEventListener('click', (e) => {
      if (!menu.contains(e.target) && !button.contains(e.target)) {
        menu.classList.add('hidden');
      }
    });
  },

  setupNewsletterForm() {
    const form = document.getElementById('newsletter-form');
    if (!form) return;

    form.addEventListener('submit', async (e) => {
      e.preventDefault();
      const email = form.querySelector('input[type="email"]').value;

      try {
        // Here you would typically send the email to your backend
        console.log('Subscribing email:', email);
        
        // Show success message
        const button = form.querySelector('button');
        const originalText = button.textContent;
        button.textContent = 'Subscribed!';
        button.disabled = true;
        
        // Reset form
        form.reset();
        
        // Reset button after 3 seconds
        setTimeout(() => {
          button.textContent = originalText;
          button.disabled = false;
        }, 3000);
      } catch (error) {
        console.error('Failed to subscribe:', error);
        alert('Failed to subscribe. Please try again.');
      }
    });
  }
};

// Initialize post functionality
document.addEventListener('DOMContentLoaded', () => post.init()); 