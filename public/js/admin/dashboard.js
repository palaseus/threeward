// Admin dashboard functionality
const admin = {
    init() {
        this.checkAuth();
        this.setupLogout();
        this.setupThemeToggle();
        this.setupNewPostModal();
        this.setupNavigation();
        this.loadPosts();
    },

    setupNavigation() {
        // Handle navigation links
        const navLinks = document.querySelectorAll('[data-nav-link]');
        navLinks.forEach(link => {
            link.addEventListener('click', (e) => {
                e.preventDefault();
                const target = link.getAttribute('data-nav-link');
                this.navigateTo(target);
            });
        });

        // Handle current page highlighting
        const currentPath = window.location.pathname;
        navLinks.forEach(link => {
            const target = link.getAttribute('data-nav-link');
            if (currentPath.includes(target)) {
                link.classList.add('bg-gray-100', 'dark:bg-gray-800');
            }
        });
    },

    navigateTo(target) {
        switch (target) {
            case 'dashboard':
                window.location.href = '/admin/dashboard';
                break;
            case 'posts':
                window.location.href = '/admin/posts';
                break;
            case 'media':
                window.location.href = '/admin/media';
                break;
            case 'settings':
                window.location.href = '/admin/settings';
                break;
        }
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
        const modal = document.getElementById('post-modal');
        const newPostButton = document.getElementById('new-post-button');
        const cancelButton = document.getElementById('cancel-post-button');
        const form = document.getElementById('post-form');
        const contentTextarea = document.getElementById('content');
        const mediaButton = document.getElementById('media-button');
        const mediaModal = document.getElementById('media-modal');
        const mediaUploadInput = document.getElementById('media-upload');
        const mediaList = document.getElementById('media-list');
        const closeMediaModal = document.getElementById('close-media-modal');

        if (newPostButton) {
            newPostButton.addEventListener('click', () => {
                this.openPostModal();
            });
        }

        if (cancelButton) {
            cancelButton.addEventListener('click', () => {
                this.closePostModal();
            });
        }

        if (form) {
            form.addEventListener('submit', async (e) => {
                e.preventDefault();
                await this.savePost();
            });
        }

        // Media button click handler
        if (mediaButton) {
            mediaButton.addEventListener('click', () => {
                mediaModal.classList.remove('hidden');
                this.loadMediaList();
            });
        }

        // Close media modal
        if (closeMediaModal) {
            closeMediaModal.addEventListener('click', () => {
                mediaModal.classList.add('hidden');
            });
        }

        // Media upload handler
        if (mediaUploadInput) {
            mediaUploadInput.addEventListener('change', async (e) => {
                const file = e.target.files[0];
                if (!file) return;

                const formData = new FormData();
                formData.append('file', file);

                try {
                    const response = await fetch('/api/admin/media', {
                        method: 'POST',
                        headers: {
                            'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                        },
                        body: formData
                    });

                    if (!response.ok) {
                        throw new Error('Upload failed');
                    }

                    const result = await response.json();
                    this.insertMedia(result.url, result.type);
                    this.loadMediaList();
                } catch (error) {
                    console.error('Error uploading media:', error);
                    alert('Failed to upload media. Please try again.');
                }
            });
        }
    },

    openPostModal(post = null) {
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        const title = document.getElementById('title');
        const date = document.getElementById('date');
        const tags = document.getElementById('tags');
        const excerpt = document.getElementById('excerpt');
        const content = document.getElementById('content');
        const slug = document.getElementById('post-slug');
        const modalTitle = document.getElementById('modal-title');

        if (post) {
            // Edit mode
            modalTitle.textContent = 'Edit Post';
            title.value = post.frontmatter.title;
            date.value = post.frontmatter.date;
            tags.value = (post.frontmatter.tags || []).join(', ');
            excerpt.value = post.frontmatter.excerpt || '';
            content.value = post.content;
            slug.value = post.slug;
        } else {
            // New post mode
            modalTitle.textContent = 'New Post';
            form.reset();
            date.valueAsDate = new Date();
            slug.value = '';
        }

        modal.classList.remove('hidden');
    },

    closePostModal() {
        const modal = document.getElementById('post-modal');
        const form = document.getElementById('post-form');
        modal.classList.add('hidden');
        form.reset();
    },

    async savePost() {
        const form = document.getElementById('post-form');
        const formData = new FormData(form);
        const slug = formData.get('slug');
        const post = {
            title: formData.get('title'),
            date: formData.get('date'),
            tags: formData.get('tags').split(',').map(tag => tag.trim()).filter(Boolean),
            excerpt: formData.get('excerpt'),
            content: formData.get('content')
        };

        try {
            const url = slug ? `/api/admin/posts/${slug}` : '/api/admin/posts';
            const method = slug ? 'PUT' : 'POST';

            const response = await fetch(url, {
                method,
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                },
                body: JSON.stringify(post)
            });

            if (!response.ok) {
                throw new Error('Failed to save post');
            }

            this.closePostModal();
            this.loadPosts();
        } catch (error) {
            console.error('Error saving post:', error);
            alert('Failed to save post. Please try again.');
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

    async editPost(slug) {
        try {
            const response = await fetch(`/api/admin/posts/${slug}`, {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });
            
            if (!response.ok) {
                throw new Error('Failed to load post');
            }
            
            const post = await response.json();
            
            // Open the modal first
            const modal = document.getElementById('post-modal');
            modal.classList.remove('hidden');
            
            // Populate the form with post data
            document.getElementById('title').value = post.title;
            document.getElementById('date').value = post.date;
            document.getElementById('tags').value = post.tags.join(', ');
            document.getElementById('excerpt').value = post.excerpt;
            document.getElementById('content').value = post.content;
            
            // Store the current slug for updating
            document.getElementById('post-form').dataset.editSlug = slug;
            
            // Update modal title
            document.getElementById('modal-title').textContent = 'Edit Post';
        } catch (error) {
            console.error('Error loading post:', error);
            alert('Failed to load post for editing');
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

    async loadMediaList() {
        const mediaList = document.getElementById('media-list');
        if (!mediaList) return;

        try {
            const response = await fetch('/api/admin/media', {
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to load media');
            }

            const media = await response.json();
            mediaList.innerHTML = media.map(item => `
                <div class="relative group">
                    ${item.type === 'image' ? `
                        <img src="${item.url}" alt="" class="w-full h-32 object-cover rounded-lg">
                    ` : `
                        <video src="${item.url}" class="w-full h-32 object-cover rounded-lg"></video>
                    `}
                    <div class="absolute inset-0 bg-black bg-opacity-50 opacity-0 group-hover:opacity-100 transition-opacity rounded-lg flex items-center justify-center space-x-2">
                        <button onclick="admin.insertMedia('${item.url}', '${item.type}')" class="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700">
                            Insert
                        </button>
                        <button onclick="admin.deleteMedia('${item.filename}')" class="p-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Delete
                        </button>
                    </div>
                </div>
            `).join('');
        } catch (error) {
            console.error('Error loading media:', error);
            mediaList.innerHTML = '<p class="text-red-500">Failed to load media</p>';
        }
    },

    async deleteMedia(filename) {
        if (!confirm('Are you sure you want to delete this media?')) {
            return;
        }

        try {
            const response = await fetch(`/api/admin/media/${filename}`, {
                method: 'DELETE',
                headers: {
                    'Authorization': `Bearer ${localStorage.getItem('adminToken')}`
                }
            });

            if (!response.ok) {
                throw new Error('Failed to delete media');
            }

            this.loadMediaList();
        } catch (error) {
            console.error('Error deleting media:', error);
            alert('Failed to delete media. Please try again.');
        }
    },

    insertMedia(url, type) {
        const contentTextarea = document.getElementById('content');
        if (!contentTextarea) return;

        const cursorPos = contentTextarea.selectionStart;
        const textBefore = contentTextarea.value.substring(0, cursorPos);
        const textAfter = contentTextarea.value.substring(cursorPos);

        let mediaMarkdown = '';
        if (type === 'image') {
            mediaMarkdown = `\n![Image](${url})\n`;
        } else {
            mediaMarkdown = `\n<video src="${url}" controls class="w-full rounded-lg"></video>\n`;
        }

        contentTextarea.value = textBefore + mediaMarkdown + textAfter;
        contentTextarea.focus();
        contentTextarea.selectionStart = contentTextarea.selectionEnd = cursorPos + mediaMarkdown.length;
    }
};

// Initialize admin functionality when DOM is loaded
document.addEventListener('DOMContentLoaded', () => admin.init()); 