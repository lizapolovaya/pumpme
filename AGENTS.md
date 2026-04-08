# Repository Guidelines

## Project Structure & Module Organization
This repository is a Next.js 16 app using the App Router, TypeScript, Tailwind CSS v4, and a small PWA layer.

- `app/`: route files, layouts, manifest metadata, global styles, and UI components
- `app/components/`: shared UI such as navigation or future reusable shells
- `public/`: static assets, including PWA icons and the service worker script
- `README.md`: brief setup notes
- `DESIGN.md`: product and UI direction when present

Keep route-specific UI close to the route unless it is reused across screens. When markup or behavior repeats across pages, extract it into `app/components/` instead of copying it between route files.

## Build, Test, and Development Commands
Use the npm scripts defined in `package.json`:

- `npm install`: install dependencies
- `npm run dev`: start the Next.js dev server
- `npm run build`: create a production build
- `npm run start`: run the production server
- `git status`: review local changes before finishing work

## Coding Style & Naming Conventions
Match the existing TypeScript and TSX style:

- Use 4-space indentation in TypeScript, TSX, CSS, and Markdown edits.
- Prefer `const`; use `let` only when reassignment is needed.
- Use PascalCase for React component names such as `BottomNav`.
- Use camelCase for variables, helpers, and data structures.
- Keep shared components in dedicated files when they are used by more than one route.
- Prefer server components by default and add `'use client'` only when hooks or browser APIs are required.
- Follow the existing Tailwind-first styling approach in `app/globals.css` and route components rather than introducing a separate styling system.

## Styling & UI Notes
The app already has an established visual direction:

- dark theme
- custom font variables defined in `app/layout.tsx`
- theme tokens and utility extensions in `app/globals.css`
- heavy use of Tailwind utility classes for layout and presentation

Preserve that direction when extending the UI. Reuse common header, navigation, and card patterns instead of letting similar screens drift apart visually.

## PWA Notes
The PWA setup currently lives in:

- `app/manifest.ts`
- `app/sw-register.tsx`
- `public/sw.js`
- `public/icons/`

When changing app shell behavior, installability, or offline behavior, update the manifest, service worker, and icon set together if needed.

## Testing Guidelines
There is no automated test suite checked in yet. For every change, manually verify the affected routes in a browser:

- `Today` dashboard at `/`
- `Workouts` at `/workouts`
- `Calendar` at `/calendar`
- `Progress` at `/progress`
- `Profile` at `/profile`
- mobile and desktop layouts
- PWA installability or service worker behavior when relevant

Run `npm run build` when changes could affect routing, TypeScript correctness, metadata, or production behavior.

## Plane Workflow
Track concrete work and findings in Plane under the `PUMPI` project.

- Create a Plane work item for each meaningful task or issue you identify.
- New findings should start in `Backlog`.
- When you begin work on a task, move it to `In Progress`.
- When the work is complete, move it to `Done`.
- If a relevant Plane task already exists, update that task instead of creating a duplicate.

## Commit & Pull Request Guidelines
Use short, imperative commit messages that describe the user-visible or engineering change.

Pull requests should include:

- a concise summary of the change
- manual verification steps performed
- screenshots for UI changes
- linked Plane work items when applicable
