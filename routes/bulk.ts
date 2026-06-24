import { Hono } from "hono";
import { getAllBookmarksForExport, importBookmarks } from "../db/kv.ts";

const bulk = new Hono();

// Export all bookmarks as JSON
bulk.get("/export", async (c) => {
  const bookmarks = await getAllBookmarksForExport();

  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    bookmarks,
  };

  return new Response(JSON.stringify(payload, null, 2), {
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="linkdeck-export.json"`,
    },
  });
});

// Import bookmarks from JSON
bulk.post("/import", async (c) => {
  let body: unknown;
  try {
    body = await c.req.json();
  } catch {
    return c.json({ error: "Invalid JSON body" }, 400);
  }

  const { bookmarks } = body as { bookmarks?: unknown[] };

  if (!Array.isArray(bookmarks) || bookmarks.length === 0) {
    return c.json({ error: "Links array is required and must not be empty" }, 400);
  }

  const valid: Array<{ title: string; url: string; icon: string; color: string; tags: string[]; useFavicon: boolean }> = [];
  const errors: Array<{ index: number; reason: string }> = [];

  for (let i = 0; i < bookmarks.length; i++) {
    const b = bookmarks[i] as Record<string, unknown>;
    if (!b.title || !b.url) {
      errors.push({ index: i, reason: "Missing required field: title or url" });
      continue;
    }
    valid.push({
      title: String(b.title).trim(),
      url: String(b.url).trim(),
      icon: b.icon ? String(b.icon).trim() : "globe",
      color: b.color ? String(b.color).trim() : "#6366f1",
      tags: Array.isArray(b.tags) ? b.tags.map(String) : [],
      useFavicon: b.useFavicon === true,
    });
  }

  if (valid.length === 0) {
    return c.json({ error: "No valid links to import", errors }, 400);
  }

  const count = await importBookmarks(valid);

  return c.json({
    message: `Imported ${count} link(s)`,
    imported: count,
    errors: errors.length > 0 ? errors : undefined,
  }, errors.length > 0 ? 207 : 201);
});

export { bulk };
