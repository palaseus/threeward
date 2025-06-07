# Threeward Blog

A simple static site generator for the Threeward blog, built with vanilla JavaScript and HTML/CSS.

## Project Structure

- `/posts`: Contains Markdown files for blog posts.
- `/js`: Contains JavaScript files for routing and blog functionality.
- `/css`: Contains the CSS file for styling the blog.
- `/index.html`: The main HTML file for the blog.

## How to Run

1. **Clone the Repository**: Clone this repository to your local machine.
2. **Navigate to the Project Directory**: Open your terminal and navigate to the project directory.
3. **Serve the Project**: Use a local server to serve the project. You can use Python's built-in server or any other local server of your choice.
   - For Python 3: `python -m http.server`
   - For Python 2: `python -m SimpleHTTPServer`
4. **Open in Browser**: Open your web browser and go to `http://localhost:8000` to view the blog.

## Adding New Posts

1. **Create a Markdown File**: Create a new Markdown file in the `/posts` directory.
2. **Add Frontmatter**: Include frontmatter at the top of the file with the following format:
   ```markdown
   ---
   title: "Your Post Title"
   date: "YYYY-MM-DD"
   tags: ["tag1", "tag2"]
   excerpt: "A brief excerpt of your post."
   ---
   ```
3. **Write Your Post**: Write your blog post content in Markdown format.
4. **Update `index.json`**: Add the new post details to the `posts/index.json` file.

## Features

- Dynamically loads blog posts from Markdown files.
- Parses frontmatter to extract post metadata.
- Generates a blog index page with post titles and excerpts.
- Simple hash-based routing for client-side navigation.
- Responsive design with a clean, minimalist aesthetic.

## License

This project is open source and available under the MIT License. 