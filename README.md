# Daily Journal — Tags, Mood & Quick Search

A modern, accessible daily journal web app using Tailwind CSS and jQuery. It supports:

- Creating daily entries with a date, content, tags and mood
- Editing and deleting entries
- Quick search over content, tags, mood and date
- Tag filtering and quick filters (today, week, month)
- Export and import entries as JSON
- Persistent storage with localStorage so entries survive reloads

Files:
- index.html — main HTML layout and script/style includes
- styles/main.css — custom CSS complementing Tailwind
- scripts/helpers.js — storage and utility helpers
- scripts/ui.js — UI rendering module, exposes window.App
- scripts/main.js — entry point that initializes the app

Usage:
1. Open index.html in a modern browser.
2. Add an entry: pick a date, write your note, add comma-separated tags and pick a mood.
3. Use the search bar to quickly find notes. Click tags to filter.
4. Export your entries to a JSON file or import to merge.

Accessibility & UX:
- Keyboard shortcuts: Ctrl/Cmd + Enter to save, Esc to clear
- ARIA roles for important controls and live regions
- Prefers-reduced-motion respected in CSS

Developers:
- The global namespace is window.App. App.init() and App.render() are required and present.
- Helpers are available at window.AppHelpers.

