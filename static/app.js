// ---------------------------------------------------------------------------
// State
// ---------------------------------------------------------------------------
let currentPage = 1;
let totalPages = 1;
const LIMIT = 20;

// ---------------------------------------------------------------------------
// DOM refs
// ---------------------------------------------------------------------------
const $ = (sel) => document.querySelector(sel);
const $$ = (sel) => document.querySelectorAll(sel);

const grid = $("#grid");
const paginationEl = $("#pagination");
const overlay = $("#modalOverlay");
const form = $("#bookmarkForm");
const modalTitle = $("#modalTitle");
const bookmarkId = $("#bookmarkId");
const titleInput = $("#title");
const urlInput = $("#url");
const iconInput = $("#icon");
const tagsInput = $("#tags");
const addBtn = $("#addBtn");
const exportBtn = $("#exportBtn");
const importBtn = $("#importBtn");
const importFile = $("#importFile");
const modalClose = $("#modalClose");
const modalCancel = $("#modalCancel");
const colorPicker = $("#colorPicker");
const colorInput = $("#color");
const previewIcon = $("#previewIcon");
const previewTitle = $("#previewTitle");
const previewUrl = $("#previewUrl");
const useFaviconInput = $("#useFavicon");
const customIconFields = $("#customIconFields");
const websiteIconFields = $("#websiteIconFields");
const faviconImg = $("#faviconImg");
const faviconStatus = $("#faviconStatus");
const modeBtns = $$(".mode-btn");

const ICON_COLORS = [
  "#6366f1", "#8b5cf6", "#a855f7", "#ec4899", "#ef4444",
  "#f97316", "#eab308", "#22c55e", "#14b8a6", "#06b6d4",
  "#3b82f6", "#78716c",
];

// ---------------------------------------------------------------------------
// Toast
// ---------------------------------------------------------------------------
function toast(message, type = "success") {
  const container = $("#toastContainer");
  const el = document.createElement("div");
  el.className = `toast toast-${type}`;
  el.textContent = message;
  container.appendChild(el);
  setTimeout(() => el.remove(), 3000);
}

// ---------------------------------------------------------------------------
// API helpers
// ---------------------------------------------------------------------------
async function api(path, options = {}) {
  const res = await fetch(path, {
    headers: { "Content-Type": "application/json" },
    ...options,
  });
  const data = await res.json();
  if (!res.ok) throw new Error(data.error || "Request failed");
  return data;
}

// ---------------------------------------------------------------------------
// Fetch & render bookmarks
// ---------------------------------------------------------------------------
async function loadBookmarks(page = 1) {
  currentPage = page;
  grid.innerHTML = Array(Math.min(LIMIT, 6))
    .fill(0)
    .map(() => `<div class="card"><div class="skeleton"></div></div>`)
    .join("");

  try {
    const data = await api(`/api/bookmarks?page=${page}&limit=${LIMIT}`);
    renderBookmarks(data.bookmarks);
    renderPagination(data.pagination);
  } catch (err) {
    grid.innerHTML =
      `<div class="empty"><p style="color:#ef4444">Failed to load links: ${err.message}</p></div>`;
  }
}

function renderBookmarks(bookmarks) {
  if (bookmarks.length === 0) {
    grid.innerHTML = `
      <div class="empty" style="grid-column:1/-1">
        <i data-lucide="bookmark-x" style="width:56px;height:56px;opacity:.4"></i>
        <h2>No links yet</h2>
        <p>Click <strong>+</strong> to create your first link.</p>
      </div>
    `;
    lucide.createIcons();
    return;
  }

  grid.innerHTML = bookmarks
    .map(
      (b) => {
        const faviconSrc = getFaviconUrl(b.url);
        const iconHtml = b.useFavicon && faviconSrc
          ? `<img src="${escapeHtml(faviconSrc)}" alt="" style="width:56px;height:56px;border-radius:0;object-fit:contain" />`
          : `<i data-lucide="${b.icon || "globe"}"></i>`;
        return `
    <div class="card" data-id="${b.id}">
      <a href="${escapeHtml(b.url)}" class="card-link" target="_blank" rel="noopener">
        <div class="card-icon" style="color:${escapeHtml(b.color || "#6366f1")}">${iconHtml}</div>
        <div class="card-body">
          <div class="card-title">${escapeHtml(b.title)}</div>
          <div class="card-url">${escapeHtml(b.url)}</div>
        </div>
      </a>
      <div class="card-actions">
        <button class="btn edit-btn" data-id="${b.id}">
          <i data-lucide="pencil" style="width:14px;height:14px"></i>
        </button>
        <button class="btn btn-danger delete-btn" data-id="${b.id}">
          <i data-lucide="trash-2" style="width:14px;height:14px"></i>
        </button>
      </div>
    </div>`;
      }
    )
    .join("");

  lucide.createIcons();

  // Attach event listeners
  grid.querySelectorAll(".edit-btn").forEach((btn) => {
    btn.addEventListener("click", () => editBookmark(btn.dataset.id));
  });
  grid.querySelectorAll(".delete-btn").forEach((btn) => {
    btn.addEventListener("click", () => deleteBookmark(btn.dataset.id));
  });
}

function renderPagination(pagination) {
  totalPages = pagination.totalPages;

  if (totalPages <= 1) {
    paginationEl.innerHTML = "";
    return;
  }

  const pages = [];

  // Prev
  pages.push(
    `<button class="page-btn" data-page="${currentPage - 1}" ${currentPage <= 1 ? "disabled" : ""}>
      <i data-lucide="chevron-left" style="width:14px;height:14px"></i>
    </button>`
  );

  // Page numbers
  const maxVisible = 5;
  let start = Math.max(1, currentPage - Math.floor(maxVisible / 2));
  let end = Math.min(totalPages, start + maxVisible - 1);
  if (end - start + 1 < maxVisible) {
    start = Math.max(1, end - maxVisible + 1);
  }

  for (let i = start; i <= end; i++) {
    pages.push(
      `<button class="page-btn ${i === currentPage ? "active" : ""}" data-page="${i}">${i}</button>`
    );
  }

  // Next
  pages.push(
    `<button class="page-btn" data-page="${currentPage + 1}" ${currentPage >= totalPages ? "disabled" : ""}>
      <i data-lucide="chevron-right" style="width:14px;height:14px"></i>
    </button>`
  );

  paginationEl.innerHTML = pages.join(" ");

  // Re-render Lucide icons inside pagination
  lucide.createIcons();

  paginationEl.querySelectorAll(".page-btn:not([disabled])").forEach((btn) => {
    btn.addEventListener("click", () => {
      const page = parseInt(btn.dataset.page, 10);
      if (page >= 1 && page <= totalPages) {
        loadBookmarks(page);
      }
    });
  });
}

// ---------------------------------------------------------------------------
// CRUD operations
// ---------------------------------------------------------------------------
async function deleteBookmark(id) {
  if (!confirm("Delete this link?")) return;
  try {
    await api(`/api/bookmarks/${id}`, { method: "DELETE" });
    toast("Link deleted");
    loadBookmarks(currentPage);
  } catch (err) {
    toast(err.message, "error");
  }
}

async function editBookmark(id) {
  try {
    const bookmark = await api(`/api/bookmarks/${id}`);
    openModal(bookmark);
  } catch (err) {
    toast(err.message, "error");
  }
}

function openModal(bookmark) {
  if (bookmark) {
    modalTitle.textContent = "Edit Link";
    bookmarkId.value = bookmark.id;
    titleInput.value = bookmark.title;
    urlInput.value = bookmark.url;
    iconInput.value = bookmark.icon || "globe";
    colorInput.value = bookmark.color || "#6366f1";
    tagsInput.value = bookmark.tags.join(", ");
    setIconMode(bookmark.useFavicon ? "website" : "custom");
  } else {
    modalTitle.textContent = "Add Link";
    bookmarkId.value = "";
    form.reset();
    iconInput.value = "globe";
    colorInput.value = ICON_COLORS[0];
    setIconMode("custom");
  }
  // Trigger favicon fetch for current URL
  urlInput.dispatchEvent(new Event("input"));
  updatePreview();
  selectColor(colorInput.value);
  overlay.classList.add("open");
}

function closeModal() {
  overlay.classList.remove("open");
}

form.addEventListener("submit", async (e) => {
  e.preventDefault();
  const id = bookmarkId.value;
  const useFavicon = useFaviconInput.value === "true";
  const data = {
    title: titleInput.value.trim(),
    url: urlInput.value.trim(),
    icon: iconInput.value.trim() || "globe",
    color: colorInput.value,
    tags: tagsInput.value
      .split(",")
      .map((s) => s.trim())
      .filter(Boolean),
    useFavicon,
  };

  try {
    if (id) {
      await api(`/api/bookmarks/${id}`, {
        method: "PUT",
        body: JSON.stringify(data),
      });
      toast("Link updated");
    } else {
      await api("/api/bookmarks", {
        method: "POST",
        body: JSON.stringify(data),
      });
      toast("Link created");
    }
    closeModal();
    loadBookmarks(id ? currentPage : 1);
  } catch (err) {
    toast(err.message, "error");
  }
});

iconInput.addEventListener("input", updatePreview);
titleInput.addEventListener("input", updatePreview);
urlInput.addEventListener("input", updatePreview);

// ---------------------------------------------------------------------------
// Export
// ---------------------------------------------------------------------------
exportBtn.addEventListener("click", async () => {
  try {
    const res = await fetch("/api/export");
    const blob = await res.blob();
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = `linkdeck-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    toast("Export downloaded");
  } catch (err) {
    toast(err.message, "error");
  }
});

// ---------------------------------------------------------------------------
// Import
// ---------------------------------------------------------------------------
importBtn.addEventListener("click", () => importFile.click());

importFile.addEventListener("change", async () => {
  const file = importFile.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const data = JSON.parse(text);
    const bookmarks = data.bookmarks;
    if (!Array.isArray(bookmarks)) {
      throw new Error("JSON must contain a 'bookmarks' array");
    }

    const res = await api("/api/import", {
      method: "POST",
      body: JSON.stringify({ bookmarks }),
    });
    toast(res.message);
    importFile.value = "";
    loadBookmarks(1);
  } catch (err) {
    toast(err.message || "Invalid JSON file", "error");
    importFile.value = "";
  }
});

// ---------------------------------------------------------------------------
// Modal controls
// ---------------------------------------------------------------------------
addBtn.addEventListener("click", () => openModal(null));
modalClose.addEventListener("click", closeModal);
modalCancel.addEventListener("click", closeModal);
overlay.addEventListener("click", (e) => {
  if (e.target === overlay) closeModal();
});
document.addEventListener("keydown", (e) => {
  if (e.key === "Escape") closeModal();
});

// ---------------------------------------------------------------------------
// Live preview
// ---------------------------------------------------------------------------
function updatePreview() {
  const icon = iconInput.value.trim() || "globe";
  const color = colorInput.value;
  const title = titleInput.value.trim() || "My Link";
  const url = urlInput.value.trim() || "https://example.com";

  if (useFaviconInput.value === "true") {
    const faviconUrl = getFaviconUrl(url);
    previewIcon.style.color = "";
    previewIcon.innerHTML = faviconUrl
      ? `<img src="${escapeHtml(faviconUrl)}" alt="" style="width:48px;height:48px;border-radius:0;object-fit:contain" />`
      : `<i data-lucide="link" style="width:36px;height:36px"></i>`;
  } else {
    previewIcon.style.color = color;
    previewIcon.innerHTML = `<i data-lucide="${escapeHtml(icon)}" style="width:36px;height:36px"></i>`;
  }
  previewTitle.textContent = title;
  previewUrl.textContent = url;
  try { lucide.createIcons(); } catch {}
}

// ---------------------------------------------------------------------------
// Color picker
// ---------------------------------------------------------------------------
function selectColor(hex) {
  colorPicker.querySelectorAll(".color-swatch").forEach((el) => {
    el.classList.toggle("selected", el.dataset.color === hex);
  });
  colorInput.value = hex;
}

function buildColorPicker() {
  colorPicker.innerHTML = ICON_COLORS
    .map(
      (c) =>
        `<div class="color-swatch" style="background:${c}" data-color="${c}"></div>`
    )
    .join("");

  colorPicker.addEventListener("click", (e) => {
    const swatch = e.target.closest(".color-swatch");
    if (swatch) {
      selectColor(swatch.dataset.color);
      updatePreview();
    }
  });

  selectColor(colorInput.value);
}

buildColorPicker();

// ---------------------------------------------------------------------------
// Icon mode & favicon
// ---------------------------------------------------------------------------
function getFaviconUrl(pageUrl) {
  try {
    const u = new URL(pageUrl);
    return `https://www.google.com/s2/favicons?domain=${u.hostname}&sz=64`;
  } catch {
    return null;
  }
}

function setIconMode(mode) {
  const isWebsite = mode === "website";
  useFaviconInput.value = isWebsite ? "true" : "false";
  customIconFields.style.display = isWebsite ? "none" : "";
  websiteIconFields.style.display = isWebsite ? "" : "none";
  modeBtns.forEach((btn) => {
    btn.classList.toggle("active", btn.dataset.mode === mode);
  });
  if (isWebsite) {
    refreshFavicon();
  }
  updatePreview();
}

modeBtns.forEach((btn) => {
  btn.addEventListener("click", () => setIconMode(btn.dataset.mode));
});

function refreshFavicon() {
  const url = urlInput.value.trim();
  const faviconUrl = getFaviconUrl(url);
  if (faviconUrl) {
    faviconImg.src = faviconUrl;
  } else {
    faviconImg.src = "";
  }
}

urlInput.addEventListener("input", () => {
  refreshFavicon();
  updatePreview();
});

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
function escapeHtml(str) {
  const div = document.createElement("div");
  div.textContent = str;
  return div.innerHTML;
}

// ---------------------------------------------------------------------------
// Init
// ---------------------------------------------------------------------------
loadBookmarks(1);
