export interface Bookmark {
  id: string;
  title: string;
  url: string;
  icon: string;
  color: string;
  tags: string[];
  createdAt: number;
  updatedAt: number;
}

export type BookmarkInput = Pick<Bookmark, "title" | "url" | "icon" | "color" | "tags">;
export type BookmarkExport = BookmarkInput;

const IDS_KEY = ["meta", "ids"];

let kvInstance: Deno.Kv | null = null;

export async function getKv(): Promise<Deno.Kv> {
  if (!kvInstance) {
    kvInstance = await Deno.openKv();
  }
  return kvInstance;
}

export async function listBookmarks(
  page: number,
  limit: number,
): Promise<{ bookmarks: Bookmark[]; total: number }> {
  const kv = await getKv();
  const idsEntry = await kv.get<string[]>(IDS_KEY);
  const ids = idsEntry.value ?? [];
  const total = ids.length;

  const start = (page - 1) * limit;
  const end = start + limit;
  const pageIds = ids.slice(start, end);

  if (pageIds.length === 0) {
    return { bookmarks: [], total };
  }

  const keys = pageIds.map((id) => ["bookmark", id] as Deno.KvKey);
  const entries = await kv.getMany(keys);
  const bookmarks: Bookmark[] = [];
  for (const entry of entries) {
    if (entry.value) bookmarks.push(entry.value as Bookmark);
  }

  return { bookmarks, total };
}

export async function getBookmark(
  id: string,
): Promise<Bookmark | null> {
  const kv = await getKv();
  const entry = await kv.get<Bookmark>(["bookmark", id]);
  return entry.value ?? null;
}

export async function createBookmark(
  data: BookmarkInput,
): Promise<Bookmark> {
  const kv = await getKv();
  const id = crypto.randomUUID();
  const now = Date.now();
  const bookmark: Bookmark = { id, ...data, createdAt: now, updatedAt: now };

  // Retry loop to handle concurrent writes
  while (true) {
    const idsEntry = await kv.get<string[]>(IDS_KEY);
    const ids = idsEntry.value ?? [];
    const newIds = [id, ...ids];

    const res = await kv.atomic()
      .check(idsEntry)
      .set(["bookmark", id], bookmark)
      .set(IDS_KEY, newIds)
      .commit();

    if (res.ok) return bookmark;
  }
}

export async function updateBookmark(
  id: string,
  data: Partial<BookmarkInput>,
): Promise<Bookmark | null> {
  const kv = await getKv();
  const entry = await kv.get<Bookmark>(["bookmark", id]);
  if (!entry.value) return null;

  const updated: Bookmark = {
    ...entry.value,
    ...data,
    updatedAt: Date.now(),
  };

  await kv.set(["bookmark", id], updated);
  return updated;
}

export async function deleteBookmark(id: string): Promise<boolean> {
  const kv = await getKv();
  const entry = await kv.get<Bookmark>(["bookmark", id]);
  if (!entry.value) return false;

  // Retry loop to handle concurrent writes
  while (true) {
    const idsEntry = await kv.get<string[]>(IDS_KEY);
    const ids = (idsEntry.value ?? []).filter((i) => i !== id);

    const res = await kv.atomic()
      .check(idsEntry)
      .delete(["bookmark", id])
      .set(IDS_KEY, ids)
      .commit();

    if (res.ok) return true;
  }
}

export async function getAllBookmarksForExport(): Promise<BookmarkExport[]> {
  const kv = await getKv();
  const idsEntry = await kv.get<string[]>(IDS_KEY);
  const ids = idsEntry.value ?? [];

  if (ids.length === 0) return [];

  const keys = ids.map((id) => ["bookmark", id] as Deno.KvKey);
  const entries = await kv.getMany(keys);

  return entries
    .map((e) => e.value as Bookmark | null)
    .filter((b): b is Bookmark => b !== null)
    .map(({ id: _, createdAt: __, updatedAt: ___, ...rest }) => rest);
}

export async function importBookmarks(
  bookmarks: BookmarkInput[],
): Promise<number> {
  let count = 0;
  for (const data of bookmarks) {
    await createBookmark(data);
    count++;
  }
  return count;
}
