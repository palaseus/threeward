const fs = require('fs');
const path = require('path');

const postsDir = path.join(__dirname, 'posts');
const indexFile = path.join(postsDir, 'index.json');

function extractFrontmatter(filepath) {
  const content = fs.readFileSync(filepath, 'utf8');
  const match = content.match(/^---\n([\s\S]+?)\n---/);
  if (!match) return null;

  const lines = match[1].split('\n');
  const frontmatter = {};

  for (let line of lines) {
    const [key, ...rest] = line.split(':');
    if (!key || !rest.length) continue;
    const rawValue = rest.join(':').trim();
    let value = rawValue.replace(/^"(.*)"$/, '$1');
    if (key === 'tags') {
      try {
        value = JSON.parse(value);
      } catch {
        value = [];
      }
    }
    frontmatter[key.trim()] = value;
  }

  return frontmatter;
}

function buildIndex() {
  const files = fs.readdirSync(postsDir);
  const posts = [];

  for (let file of files) {
    if (!file.endsWith('.md') || file === '404.md') continue;

    const fullPath = path.join(postsDir, file);
    const frontmatter = extractFrontmatter(fullPath);

    if (!frontmatter || !frontmatter.title || !frontmatter.date) {
      console.warn(`Skipping ${file}: Missing title or date`);
      continue;
    }

    posts.push({
      id: path.basename(file, '.md'),
      title: frontmatter.title,
      excerpt: frontmatter.excerpt || '',
      date: frontmatter.date,
      tags: Array.isArray(frontmatter.tags) ? frontmatter.tags : [],
    });
  }

  posts.sort((a, b) => new Date(b.date) - new Date(a.date));
  fs.writeFileSync(indexFile, JSON.stringify(posts, null, 2));
  console.log(`✅ index.json built with ${posts.length} posts`);
}

buildIndex();
