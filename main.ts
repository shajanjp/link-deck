import { Hono } from "hono";
import { bookmarks } from "./routes/bookmarks.ts";
import { bulk } from "./routes/bulk.ts";

const app = new Hono();

// --- API routes ---
app.route("/api/bookmarks", bookmarks);
app.route("/api", bulk);

// --- Static files ---
let appJsCache: string | null = null;

app.get("/static/app.js", async (c) => {
  if (!appJsCache) {
    appJsCache = await Deno.readTextFile(`${Deno.cwd()}/static/app.js`);
  }
  return new Response(appJsCache, {
    headers: {
      "Content-Type": "application/javascript",
      "Cache-Control": "public, max-age=3600",
    },
  });
});

// --- Main HTML page ---
app.get("/", async (c) => {
  return c.html(await getIndexHtml());
});

// --- Start ---
const port = parseInt(Deno.env.get("PORT") ?? "80", 10);
Deno.serve({ port }, app.fetch);

console.log(`Server running at http://localhost:${port}`);

// ---------------------------------------------------------------------------
// HTML template
// ---------------------------------------------------------------------------
let indexHtml: string | null = null;

async function getIndexHtml(): Promise<string> {
  if (!indexHtml) {
    indexHtml = await Deno.readTextFile(`${Deno.cwd()}/views/index.html`);
  }
  return indexHtml;
}

