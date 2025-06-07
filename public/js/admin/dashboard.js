// Admin dashboard functionality
const admin = {
    init() {
        this.checkAuth();
        this.setupLogout();
        this.setupNewPostModal();
        this.loadPosts();
        this.setupThemeToggle();
    },

    async checkAuth() {
        const token = localStorage.getItem('adminToken');
        if (!token) {
            window.location.href = '/admin/login';
            return;
        }

        try {
            const response = await fetch('/api/admin/verify', {
                headers: {
                    'Authorization': `Bearer ${token}`
                }
            });

            if (!response.ok) {
                throw new Error('Invalid token');
            }
        } catch (error) {
            console.error('Auth error:', error);
            localStorage.removeItem('adminToken');
            window.location.href = '/admin/login';
        }
    },

    setupLogout() {
        const logoutButton = document.getElementById('logout-button');
        if (logoutButton) {
            logoutButton.addEventListener('click', () => {
                localStorage.removeItem('adminToken');
                window.location.href = '/admin/login';
            });
        }
    },

    setupThemeToggle() {
        const themeToggle = document.getElementById('theme-toggle');
        if (themeToggle) {
            themeToggle.addEventListener('click', () => {
                const isDark = document.documentElement.classList.toggle('dark');
                localStorage.theme = isDark ? 'dark' : 'light';
            });
        }
    },

    setupNewPostModal() {
        const modal = document.getElementById('new-post-modal');
        const newPostButton = document.getElementById('new-post-button');
        const cancelButton = document.getElementById('cancel-post-button');
        const form = document.getElementById('new-post-form');

        if (newPostButton) {
            newPostButton.addEventListener('click', () => {
                modal.classList.remove('hidden');
                // Set default date to today
                document.getElementById('date').valueAsDate = new Date();
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                modal.classList.add('hidden');
                form.reset();
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                const formData = new FormData(form);
                const post = {
                    title: formData.get('title'),
                    date: formData.get('date'),
                    tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
                    excerpt: formData.get('excerpt'),
                    content: formData.get('content')
                };

                try {
                    const response = await fetch('/api/admin/posts', {
                        method: 'POST',
                        headers: {
                            'Content-Type': 'application/json',
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        },
                        body: JSON.stringify(post)
                    });

                    if (!response.ok) {
                        throw new Error('Failed to create post');
                    }

                    modal.classList.add('hidden');
                    form.reset();
                    this.loadPosts();
                } catch (error) {
                    console.error('Error creating post:', error);
                    alert('Failed to create post. Please try again.');
                }
            });
        }
    },

    async loadPosts() {
        const postsList = document.getElementById('posts-list');
        const totalPosts = document.getElementById('total-posts');
        const totalTags = document.getElementById('total-tags');
        const latestPost = document.getElementById('latest-post');

        try {
            const response = await fetch('/api/admin/posts', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load posts');
            }

            const posts = await response.json();
            
            // Update stats
            if (totalPosts) {
                totalPosts.textContent = posts.length;
            }

            if (totalTags) {
                const uniqueTags = new Set(posts.flatMap(post => post.frontmatter.tags || []));
                totalTags.textContent = uniqueTags.size;
            }

            if (latestPost && posts.length > 0) {
                const latest = posts[0];
                latestPost.textContent = latest.frontmatter.title;
            }

            // Update posts list
            if (postsList) {
                if (posts.length === 0) {
                    postsList.innerHTML = `
                        <li class="px-6 py-4 text-center text-gray-500 dark:text-gray-400">
                            No posts found. Create your first post!
                        </li>
                    `;
                    return;
                }

                postsList.innerHTML = posts.map(post => `
                    <li class="px-6 py-4">
                        <div class="flex items-center justify-between">
                            <div class="flex-1 min-w-0">
                                <h3 class="text-lg font-medium text-gray-900 dark:text-white truncate">
                                    ${post.frontmatter.title}
                                </h3>
                                <div class="mt-1 flex items-center text-sm text-gray-500 dark:text-gray-400">
                                    <span>${new Date(post.frontmatter.date).toLocaleDateString()}</span>
                                    ${post.frontmatter.tags ? `
                                        <span class="mx-2">•</span>
                                        <div class="flex flex-wrap gap-2">
                                            ${post.frontmatter.tags.map(tag => `
                                                <span class="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-blue-100 text-blue-800 dark:bg-blue-900 dark:text-blue-200">
                                                    ${tag}
                                                </span>
                                            `).join('')}
                                        </div>
                                    ` : ''}
                                </div>
                            </div>
                            <div class="ml-4 flex-shrink-0 flex space-x-2">
                                <a href="/post/${post.slug}" target="_blank"
                                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    View
                                </a>
                                <button onclick="admin.editPost('${post.slug}')"
                                    class="inline-flex items-center px-3 py-1.5 border border-gray-300 dark:border-gray-600 text-sm font-medium rounded-md text-gray-700 dark:text-gray-200 bg-white dark:bg-gray-700 hover:bg-gray-50 dark:hover:bg-gray-600 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500">
                                    Edit
                                </button>
                                <button onclick="admin.deletePost('${post.slug}')"
                                    class="inline-flex items-center px-3 py-1.5 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500">
                                    Delete
                                </button>
                            </div>
                        </div>
                    </li>
                `).join('');
            }
        } catch (error) {
            console.error('Error loading posts:', error);
            if (postsList) {
                postsList.innerHTML = `
                    <li class="px-6 py-4 text-center text-red-500">
                        Failed to load posts. Please try again.
                    </li>
                `;
            }
        }
    },

    async deletePost(slug) {
        if (!confirm('Are you sure you want to delete this post?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/posts/${slug}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete post');
            }

            this.loadPosts();
        } catch (error) {
            console.error('Error deleting post:', error);
            alert('Failed to delete post. Please try again.');
        }
    },

    async editPost(slug) {
        // TODO: Implement edit functionality
        alert('Edit functionality coming soon!');
    }
};

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => admin.init()); 