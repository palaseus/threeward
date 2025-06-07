#!/usr/bin/env node

const path = require('path');
const StaticSiteGenerator = require('./index');

// Parse command line arguments
const args = process.argv.slice(2);
const options = {
  sourceDir: path.join(process.cwd(), 'posts'),
  distDir: path.join(process.cwd(), 'dist'),
  templateDir: path.join(process.cwd(), 'templates')
};

// Parse options
for (let i = 0; i < args.length; i++) {
  const arg = args[i];
  if (arg === '--source' || arg === '-s') {
    options.sourceDir = path.resolve(args[++i]);
  } else if (arg === '--dist' || arg === '-d') {
    options.distDir = path.resolve(args[++i]);
  } else if (arg === '--templates' || arg === '-t') {
    options.templateDir = path.resolve(args[++i]);
  } else if (arg === '--help' || arg === '-h') {
    console.log(`
Static Site Generator

Usage:
  ssg [options]

Options:
  -s, --source <dir>     Source directory for markdown posts (default: ./posts)
  -d, --dist <dir>       Output directory for generated files (default: ./dist)
  -t, --templates <dir>  Directory containing HTML templates (default: ./templates)
  -h, --help            Show this help message

Example:
  ssg --source ./content --dist ./public --templates ./layouts
    `);
    process.exit(0);
  }
}

// Create and run generator
const generator = new StaticSiteGenerator(options);

generator.build().catch(error => {
  console.error('Build failed:', error);
  process.exit(1);
}); 