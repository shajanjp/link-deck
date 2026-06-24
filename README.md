# Link Deck

A lightweight bookmark manager with a clean, sharp-edged UI. Built with Deno, Hono, and Deno KV.

## Features

- **Bookmark CRUD** — Create, read, update, and delete bookmarks with title, URL, icon, and tags
- **Custom Icons** — Choose from 400+ Lucide icons with a built-in color picker (12 preset colors)
- **Auto Favicon** — Automatically fetch website favicons via Google's favicon service
- **Live Preview** — See a real-time preview of your bookmark card while editing
- **Pagination** — Browse bookmarks 20 at a time with page controls
- **Tag System** — Add comma-separated tags to organize your links
- **Import / Export** — Bulk export all bookmarks as JSON or import from a JSON file
- **Responsive Grid** — 5-column layout on desktop, down to 2 columns on mobile
- **Toast Notifications** — Non-intrusive success/error feedback
- **Sharp Edges Design** — Clean, border-radius-free UI with a modern look
- **Persistent Storage** — Backed by Deno KV (built-in key-value store)

## Tech Stack

| Layer     | Technology       |
|-----------|------------------|
| Runtime   | Deno             |
| Framework | Hono             |
| Database  | Deno KV          |
| Icons     | Lucide           |
| Favicons  | Google S2        |

## Getting Started

### Prerequisites

- [Deno](https://deno.com/) v1.40+

### Run

```bash
deno run --allow-net --allow-read --allow-write --unstable-kv main.ts
```

The server starts on `http://localhost:8090` (configurable via `PORT` environment variable).

### Usage

1. Click **+** to add a bookmark
2. Fill in the title and URL
3. Optionally pick a Lucide icon and color, or switch to auto-favicon mode
4. Add comma-separated tags (e.g. `design, dev, reference`)
5. Save — the card appears in the grid
6. Hover over a card to reveal edit and delete actions
7. Use the download/upload buttons to export or import your collection

## API Endpoints

| Method   | Path                     | Description            |
|----------|--------------------------|------------------------|
| GET      | `/api/bookmarks`         | List bookmarks (paginated) |
| GET      | `/api/bookmarks/:id`     | Get a single bookmark  |
| POST     | `/api/bookmarks`         | Create a bookmark      |
| PUT      | `/api/bookmarks/:id`     | Update a bookmark      |
| DELETE   | `/api/bookmarks/:id`     | Delete a bookmark      |
| GET      | `/api/export`            | Export all bookmarks as JSON |
| POST     | `/api/import`            | Import bookmarks from JSON |

## Query Parameters

### `GET /api/bookmarks`

| Param | Default | Description            |
|-------|---------|------------------------|
| page  | 1       | Page number            |
| limit | 20      | Items per page (max 100) |

## Project Structure

```
bookmark-page/
├── main.ts                # Server entry point & static file serving
├── views/
│   └── index.html         # Single-page app HTML + CSS
├── static/
│   ├── app.js             # Frontend JavaScript
│   └── logo.svg           # App icon
├── routes/
│   ├── bookmarks.ts       # Bookmark CRUD API routes
│   └── bulk.ts            # Import/export API routes
└── db/
    └── kv.ts              # Deno KV data layer
```
