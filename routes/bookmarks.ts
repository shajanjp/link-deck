import { Hono } from "hono";
import {
  listBookmarks,
  getBookmark,
  createBookmark,
  updateBookmark,
  deleteBookmark,
} from "../db/kv.ts";

const bookmarks = new Hono();

// List with pagination
bookmarks.get("/", async (c) => {
  const page = Math.max(1, parseInt(c.req.query("page") ?? "1", 10));
  const limit = Math.min(100, Math.max(1, parseInt(c.req.query("limit") ?? "20", 10)));

  const { bookmarks: items, total } = await listBookmarks(page, limit);

  return c.json({
    bookmarks: items,
    pagination: {
      page,
      limit,
      total,
      totalPages: Math.ceil(total / limit),
    },
  });
});

// Get single bookmark
bookmarks.get("/:id", async (c) => {
  const id = c.req.param("id");
  const bookmark = await getBookmark(id);
  if (!bookmark) {
    return c.json({ error: "Link not found" }, 404);
  }
  return c.json(bookmark);
});

// Create bookmark
bookmarks.post("/", async (c) => {
  const body = await c.req.json();
  const { title, url, icon, color, tags, useFavicon } = body;

  if (!title || !url) {
    return c.json({ error: "Title and URL are required" }, 400);
  }

  const bookmark = await createBookmark({
    title: String(title).trim(),
    url: String(url).trim(),
    icon: String(icon ?? "globe").trim(),
    color: String(color ?? "#6366f1").trim(),
    tags: Array.isArray(tags) ? tags.map(String) : [],
    useFavicon: useFavicon === true,
  });

  return c.json(bookmark, 201);
});

// Update bookmark
bookmarks.put("/:id", async (c) => {
  const id = c.req.param("id");
  const body = await c.req.json();
  const { title, url, icon, color, tags, useFavicon } = body;

  const data: Record<string, unknown> = {};
  if (title !== undefined) data.title = String(title).trim();
  if (url !== undefined) data.url = String(url).trim();
  if (icon !== undefined) data.icon = String(icon).trim();
  if (color !== undefined) data.color = String(color).trim();
  if (tags !== undefined) data.tags = Array.isArray(tags) ? tags.map(String) : [];
  if (useFavicon !== undefined) data.useFavicon = useFavicon === true;

  const bookmark = await updateBookmark(id, data);
  if (!bookmark) {
    return c.json({ error: "Link not found" }, 404);
  }
  return c.json(bookmark);
});

// Delete bookmark
bookmarks.delete("/:id", async (c) => {
  const id = c.req.param("id");
  const deleted = await deleteBookmark(id);
  if (!deleted) {
    return c.json({ error: "Link not found" }, 404);
  }
  return c.json({ message: "Link deleted" });
});

export { bookmarks };
