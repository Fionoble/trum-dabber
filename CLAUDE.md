# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Build Commands
- `pnpm dev` - Start the development server
- `pnpm build` - Build for production
- `pnpm preview` - Preview the production build

## Code Style Guidelines
- **Component Style**: Use function declarations with PascalCase names
- **Imports**: Group by: (1) Preact/hooks, (2) services/utils, (3) styles, (4) components/assets
- **Naming**: PascalCase for components, camelCase for variables/functions, ALL_CAPS for constants
- **State**: Use Preact hooks (useState, useEffect) and @preact/signals for reactive state
- **Error Handling**: Use try/catch with specific error messages and user-friendly feedback
- **Formatting**: 2-space indentation, semicolons, single quotes in JS, double quotes in JSX
- **Styling**: Use Tailwind CSS classes with SCSS for component-specific styles
- **File Structure**: Components in directories with index.jsx and styles.scss files

## Project Structure
- Preact-based drum tab editor application
- Uses Supabase for backend services
- Follows component-based architecture with shared utilities
- Organized by feature folders in the src/pages directory

## Git Worktrees
- When creating git worktrees, always place them in a `worktrees/` folder at the project root (e.g. `git worktree add worktrees/my-feature -b my-feature`)
- Never create worktrees outside the project directory