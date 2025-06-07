const fs = require('fs').promises;
const path = require('path');

class Generator {
  constructor(options) {
    this.templateDir = options.templateDir;
    this.outputDir = options.outputDir;
    this.templates = {};
  }

  async loadTemplates() {
    const files = await fs.readdir(this.templateDir);
    for (const file of files) {
      const content = await fs.readFile(path.join(this.templateDir, file), 'utf-8');
      this.templates[file] = content;
    }
  }

  async generate(posts) {
    await this.loadTemplates();
    await fs.mkdir(this.outputDir, { recursive: true });

    // Generate index page
    await this.generateIndex(posts);

    // Generate individual post pages
    for (const post of posts) {
      await this.generatePost(post);
    }
  }

  async generatePost(post) {
    const template = this.templates['post.html'] || '{{title}}\n{{content}}';
    const content = template
      .replace('{{title}}', post.title)
      .replace('{{content}}', post.content);

    const outputPath = path.join(this.outputDir, `post-${post.id}.html`);
    await fs.writeFile(outputPath, content);
  }

  async generateIndex(posts) {
    const template = this.templates['index.html'] || '{{postList}}';
    const postList = posts.map(post => `
      <article>
        <h2>${post.title}</h2>
        <p>${post.content}</p>
      </article>
    `).join('\n');

    const content = template.replace('{{postList}}', postList);
    const outputPath = path.join(this.outputDir, 'index.html');
    await fs.writeFile(outputPath, content);
  }
}

module.exports = { Generator }; 