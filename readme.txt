Running this site locally
==========================

Pages use root-relative paths (/styles/styles.css, /img/..., etc.), which
only resolve correctly when served from the project root — the same way
GitHub Pages serves it remotely. Opening an .html file directly (double-
click, or file:// in the browser) will break the CSS and images.

To view it locally:

1. Open a terminal in this project folder.
2. Run:

     ./serve.sh

   (Optionally pass a port: ./serve.sh 9000 — defaults to 8000.)

3. Open http://localhost:8000 in your browser.
4. Press Ctrl+C in the terminal to stop the server when done.

Note: serve.sh is gitignored — it's a local dev convenience script and
isn't part of the deployed site.
