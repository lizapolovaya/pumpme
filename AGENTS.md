# Repository Guidelines

## Project Structure & Module Organization
This repository is a small static web app with no build step. Keep the top-level layout simple:

- `index.html`: app shell and DOM structure
- `script.js`: client-side behavior, localStorage reads/writes, and UI rendering
- `style.css`: all visual styles
- `manifest.json`: Progressive Web App metadata
- `README.md`: brief project overview

If the project grows, keep assets in an `assets/` directory and place new JavaScript modules in a `js/` folder rather than expanding one large script file.

## Build, Test, and Development Commands
There is no package manager or build system checked in. Use a local static server for development:

- `python3 -m http.server 8000`: serve the app locally at `http://localhost:8000`
- `open index.html`: quick manual check on macOS-style environments with a GUI
- `git status`: review working tree changes before committing

Because the app uses `localStorage`, browser-based testing through a local server is more reliable than opening files directly in every environment.

## Coding Style & Naming Conventions
Match the existing style:

- Use 4-space indentation in HTML, CSS, and JavaScript.
- Prefer `const` by default; use `let` only when reassignment is required.
- Use camelCase for JavaScript identifiers such as `saveSet` and `displayLogs`.
- Use kebab-case for CSS class names such as `.clear-btn`.
- Keep DOM IDs short and descriptive, for example `logList` or `weight`.

Avoid adding framework-specific patterns unless the repository is intentionally being restructured.

## Testing Guidelines
No automated tests are present today. For each change, manually verify:

- logging a set
- rendering session history
- clearing stored data
- layout behavior on mobile and desktop widths

If you add automated coverage later, place tests in a `tests/` directory and name them after the target file, for example `script.test.js`.

## Commit & Pull Request Guidelines
Recent commits use short, imperative summaries such as `Add manifest.json for Progressive Web App setup`. Follow that pattern.

Pull requests should include:

- a concise description of the user-visible change
- any manual test steps performed
- screenshots for layout or styling updates
- linked issues when applicable
