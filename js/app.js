/**
 * app.js — Application logic for RockSongs.
 *
 * Manages: state, rendering, search/filter, pagination,
 *          modal, CRUD handlers, and auth UI.
 *
 * All backend calls go through js/api.js.
 */

// ─── Constants ────────────────────────────────────────────────────────────────

/** Number of songs shown per page. Change this to adjust page size. */
const PAGE_SIZE = 25;

/** API boundary: app.js only talks to api.js through this namespace. */
const api = window.RockSongsApi;

// ─── Application State ────────────────────────────────────────────────────────

const state = {
  /** Full list of songs loaded from the API. */
  songs: [],

  /** Songs that match the current search query. */
  filteredSongs: [],

  /** Current page number (1-based). */
  currentPage: 1,

  /** Current search query string. */
  searchQuery: "",

  /** Current sort key: artist | song | album. */
  sortKey: "artist",

  /** Current sort direction: asc | desc. */
  sortDirection: "asc",

  /** Currently logged-in user object, or null if logged out. */
  currentUser: null,

  /**
   * Which modal mode is active: "create" | "edit" | "view" | null
   * null means the modal is closed.
   */
  modalMode: null,

  /** The song currently open in the modal (for edit/view). */
  modalSong: null,
};

// ─── DOM References ───────────────────────────────────────────────────────────
// Cached once so we don't query the DOM on every render.

const els = {
  searchInput:    document.getElementById("searchInput"),
  resultSummary:  document.getElementById("resultSummary"),
  songTableBody:  document.getElementById("songTableBody"),
  emptyState:     document.getElementById("emptyState"),
  tableWrapper:   document.querySelector(".table-wrapper"),
  songTable:      document.getElementById("songTable"),
  sortableHeaders: document.querySelectorAll(".song-table thead th[data-sort-key]"),
  pagination:     document.getElementById("pagination"),
  apiModeBadge:   document.getElementById("apiModeBadge"),

  addSongBtn:     document.getElementById("addSongBtn"),
  loginBtn:       document.getElementById("loginBtn"),
  logoutBtn:      document.getElementById("logoutBtn"),

  modalOverlay:   document.getElementById("modalOverlay"),
  modalTitle:     document.getElementById("modalTitle"),
  songForm:       document.getElementById("songForm"),
  fieldId:        document.getElementById("fieldId"),
  fieldArtist:    document.getElementById("fieldArtist"),
  fieldSong:      document.getElementById("fieldSong"),
  fieldAlbum:     document.getElementById("fieldAlbum"),
  fieldOverplayed: document.getElementById("fieldOverplayed"),
  modalSaveBtn:   document.getElementById("modalSaveBtn"),
  modalDeleteBtn: document.getElementById("modalDeleteBtn"),
  modalCloseBtn:  document.getElementById("modalCloseBtn"),
  modalCloseX:    document.getElementById("modalCloseX"),

  deleteConfirmOverlay: document.getElementById("deleteConfirmOverlay"),
  deleteConfirmText: document.getElementById("deleteConfirmText"),
  deleteConfirmCancelBtn: document.getElementById("deleteConfirmCancelBtn"),
  deleteConfirmOkBtn: document.getElementById("deleteConfirmOkBtn"),
};

// ─── Init ─────────────────────────────────────────────────────────────────────

/**
 * initApp — Entry point. Called once when the page loads.
 * Wires up events, checks auth, loads songs.
 */
async function initApp() {
  if (!api) {
    console.error("RockSongsApi is unavailable. Ensure js/api.js loads before js/app.js.");
    alert("App failed to start: API layer not found.");
    return;
  }

  updateApiModeBadge();
  wireEvents();
  await checkAuthAndUpdateUI();
  await loadSongs();
}

/**
 * updateApiModeBadge — Shows whether app is using mock data or live backend.
 */
function updateApiModeBadge() {
  if (!els.apiModeBadge) return;

  const config = window.RockSongsApiConfig || {};
  const useMock = config.USE_MOCK_API !== false;

  els.apiModeBadge.classList.remove("is-mock", "is-live");

  if (useMock) {
    els.apiModeBadge.textContent = "API: Mock";
    els.apiModeBadge.classList.add("is-mock");
    els.apiModeBadge.title = "Using local mock data";
  } else {
    els.apiModeBadge.textContent = "API: Live";
    els.apiModeBadge.classList.add("is-live");
    els.apiModeBadge.title = `Using live backend: ${config.API_BASE_URL || "(no URL set)"}`;
  }
}

// ─── Auth ─────────────────────────────────────────────────────────────────────

/**
 * checkAuthAndUpdateUI — Asks the API who is logged in,
 * stores the result in state, and refreshes auth-dependent UI.
 */
async function checkAuthAndUpdateUI() {
  try {
    state.currentUser = await api.getCurrentUser();
  } catch {
    state.currentUser = null;
  }
  updateAuthUI();
}

/**
 * updateAuthUI — Shows/hides buttons based on login state.
 * Call this whenever login state changes.
 */
function updateAuthUI() {
  const loggedIn = !!state.currentUser;
  els.addSongBtn.style.display  = loggedIn ? "inline-flex" : "none";
  els.loginBtn.style.display    = loggedIn ? "none"        : "inline-flex";
  els.logoutBtn.style.display   = loggedIn ? "inline-flex" : "none";
}

// ─── Data Loading ─────────────────────────────────────────────────────────────

/**
 * loadSongs — Fetch the full song list from the API,
 * then reapply filter and re-render.
 */
async function loadSongs() {
  try {
    state.songs = await api.getSongs();
  } catch (err) {
    console.error("Failed to load songs:", err);
    state.songs = [];
  }
  // Reset to page 1 after a full reload.
  state.currentPage = 1;
  renderApp();
}

// ─── Filtering ────────────────────────────────────────────────────────────────

/**
 * filterSongs — Applies the current search query to state.songs
 * and stores matches in state.filteredSongs.
 *
 * Matching is case-insensitive partial match against artist and song fields.
 */
function filterSongs() {
  const query = state.searchQuery.trim().toLowerCase();

  if (!query) {
    state.filteredSongs = [...state.songs];
  } else {
    state.filteredSongs = state.songs.filter(s => {
      const artist = (s.artist || "").toLowerCase();
      const song   = (s.song   || "").toLowerCase();
      return artist.includes(query) || song.includes(query);
    });
  }

  sortFilteredSongs();
}

/**
 * sortFilteredSongs — Sorts filtered songs by current sort state.
 * Default order is Artist then Song.
 */
function sortFilteredSongs() {
  const collator = new Intl.Collator(undefined, { sensitivity: "base" });
  const direction = state.sortDirection === "asc" ? 1 : -1;

  state.filteredSongs.sort((a, b) => {
    const primary = compareByKey(a, b, state.sortKey, collator) * direction;
    if (primary !== 0) return primary;

    // Tie-breakers keep ordering predictable and preserve Artist+Song intent.
    if (state.sortKey === "artist") {
      return compareByKey(a, b, "song", collator);
    }

    if (state.sortKey === "song") {
      const byArtist = compareByKey(a, b, "artist", collator);
      if (byArtist !== 0) return byArtist;
      return compareByKey(a, b, "album", collator);
    }

    const byArtist = compareByKey(a, b, "artist", collator);
    if (byArtist !== 0) return byArtist;
    return compareByKey(a, b, "song", collator);
  });
}

/**
 * compareByKey — Case-insensitive string comparison for a song field.
 */
function compareByKey(a, b, key, collator) {
  const aValue = String(a[key] || "");
  const bValue = String(b[key] || "");
  return collator.compare(aValue, bValue);
}

// ─── Rendering ────────────────────────────────────────────────────────────────

/**
 * renderApp — Top-level render. Filters songs, then renders table + pagination.
 * Call this whenever state changes that affects the displayed list.
 */
function renderApp() {
  filterSongs();
  renderSortHeaders();
  renderSongTable();
  renderPagination();
  renderResultSummary();
}

/**
 * renderSortHeaders — Updates sort indicators and ARIA metadata on headers.
 */
function renderSortHeaders() {
  els.sortableHeaders.forEach(header => {
    const key = header.dataset.sortKey;
    const indicator = header.querySelector(".sort-indicator");

    if (key === state.sortKey) {
      header.classList.add("is-sorted");
      header.setAttribute("aria-sort", state.sortDirection === "asc" ? "ascending" : "descending");
      if (indicator) indicator.textContent = state.sortDirection === "asc" ? "▲" : "▼";
    } else {
      header.classList.remove("is-sorted");
      header.setAttribute("aria-sort", "none");
      if (indicator) indicator.textContent = "↕";
    }
  });
}

/**
 * renderResultSummary — Updates the small text showing how many songs matched.
 */
function renderResultSummary() {
  const total    = state.songs.length;
  const filtered = state.filteredSongs.length;
  const query    = state.searchQuery.trim();

  if (!query) {
    els.resultSummary.textContent = `${total} song${total !== 1 ? "s" : ""} in catalog`;
  } else {
    els.resultSummary.textContent =
      `${filtered} match${filtered !== 1 ? "es" : ""} for "${query}" (${total} total)`;
  }
}

/**
 * renderSongTable — Renders the current page of filtered songs into the table.
 */
function renderSongTable() {
  const { filteredSongs, currentPage } = state;

  // Calculate slice for the current page.
  const startIndex = (currentPage - 1) * PAGE_SIZE;
  const endIndex   = startIndex + PAGE_SIZE;
  const pageSongs  = filteredSongs.slice(startIndex, endIndex);

  // Clear existing rows.
  els.songTableBody.innerHTML = "";

  if (pageSongs.length === 0) {
    els.songTable.style.display  = "none";
    els.emptyState.style.display = "block";
    return;
  }

  els.songTable.style.display  = "";
  els.emptyState.style.display = "none";

  // Build one row per song.
  pageSongs.forEach(song => {
    const tr = document.createElement("tr");
    tr.dataset.songId = song.id;

    // Artist cell — add overplayed badge when applicable.
    const overplayedBadge = song.overplayed === "Y"
      ? `<span class="badge-overplayed" title="Overplayed">overplayed</span>`
      : "";

    tr.innerHTML = `
      <td>${escapeHtml(song.artist)}${overplayedBadge}</td>
      <td>${escapeHtml(song.song)}</td>
      <td>${escapeHtml(song.album || "")}</td>
    `;

    tr.addEventListener("click", () => openViewOrEditModal(song.id));
    els.songTableBody.appendChild(tr);
  });
}

/**
 * renderPagination — Renders Previous / page numbers / Next controls.
 */
function renderPagination() {
  const totalPages = Math.ceil(state.filteredSongs.length / PAGE_SIZE);
  els.pagination.innerHTML = "";

  // Nothing to paginate.
  if (totalPages <= 1) return;

  // Previous button.
  const prevBtn = makePaginationBtn("← Prev", state.currentPage === 1, () => {
    state.currentPage--;
    renderApp();
    window.scrollTo(0, 0);
  });
  els.pagination.appendChild(prevBtn);

  // Determine which page numbers to show (up to 7 around current).
  const pageNumbers = getPageNumbers(state.currentPage, totalPages);

  pageNumbers.forEach(p => {
    if (p === "...") {
      const ellipsis = document.createElement("span");
      ellipsis.className = "page-btn";
      ellipsis.textContent = "…";
      ellipsis.style.cursor = "default";
      ellipsis.style.opacity = "0.5";
      els.pagination.appendChild(ellipsis);
    } else {
      const btn = makePaginationBtn(String(p), false, () => {
        state.currentPage = p;
        renderApp();
        window.scrollTo(0, 0);
      });
      if (p === state.currentPage) btn.classList.add("active");
      els.pagination.appendChild(btn);
    }
  });

  // Next button.
  const nextBtn = makePaginationBtn("Next →", state.currentPage === totalPages, () => {
    state.currentPage++;
    renderApp();
    window.scrollTo(0, 0);
  });
  els.pagination.appendChild(nextBtn);
}

/**
 * makePaginationBtn — Creates a single pagination <button> element.
 * @param {string}   label    - Button label text.
 * @param {boolean}  disabled - Whether the button is disabled.
 * @param {function} onClick  - Click handler.
 */
function makePaginationBtn(label, disabled, onClick) {
  const btn = document.createElement("button");
  btn.className = "page-btn";
  btn.textContent = label;
  btn.disabled = disabled;
  if (!disabled) btn.addEventListener("click", onClick);
  return btn;
}

/**
 * getPageNumbers — Returns an array of page numbers (and "..." ellipses)
 * to display in the pagination bar.
 */
function getPageNumbers(current, total) {
  if (total <= 7) {
    return Array.from({ length: total }, (_, i) => i + 1);
  }

  const pages = [];
  pages.push(1);

  if (current > 3) pages.push("...");

  const start = Math.max(2, current - 1);
  const end   = Math.min(total - 1, current + 1);
  for (let i = start; i <= end; i++) pages.push(i);

  if (current < total - 2) pages.push("...");

  pages.push(total);
  return pages;
}

// ─── Modal ────────────────────────────────────────────────────────────────────

/**
 * openCreateModal — Opens the modal for creating a new song.
 */
function openCreateModal() {
  state.modalMode = "create";
  state.modalSong = null;

  els.modalTitle.textContent = "New Song";
  clearModalForm();
  setModalFieldsReadOnly(false);

  els.modalSaveBtn.style.display   = "inline-flex";
  els.modalDeleteBtn.style.display = "none";
  els.modalSaveBtn.textContent     = "Create";

  showModal();
}

/**
 * openViewOrEditModal — Opens the modal for viewing or editing a song.
 * If the user is logged in, they get edit + delete buttons.
 * If logged out, the form is read-only.
 *
 * @param {string|number} songId - The id of the song to open.
 */
function openViewOrEditModal(songId) {
  const song = state.songs.find(s => String(s.id) === String(songId));
  if (!song) return;

  const loggedIn = !!state.currentUser;
  state.modalMode = loggedIn ? "edit" : "view";
  state.modalSong = song;

  els.modalTitle.textContent = loggedIn ? "Edit Song" : "Song Details";

  // Populate form fields.
  els.fieldId.value              = song.id;
  els.fieldArtist.value          = song.artist  || "";
  els.fieldSong.value            = song.song    || "";
  els.fieldAlbum.value           = song.album   || "";
  els.fieldOverplayed.checked    = song.overplayed === "Y";

  setModalFieldsReadOnly(!loggedIn);

  els.modalSaveBtn.style.display   = loggedIn ? "inline-flex" : "none";
  els.modalDeleteBtn.style.display = loggedIn ? "inline-flex" : "none";
  els.modalSaveBtn.textContent     = "Update";

  showModal();
}

// openEditModal is an alias used if called directly with a song id.
function openEditModal(songId) {
  openViewOrEditModal(songId);
}

/**
 * closeModal — Hides the modal and resets state.
 */
function closeModal() {
  state.modalMode = null;
  state.modalSong = null;
  els.modalOverlay.style.display = "none";
  clearModalForm();
}

function showModal() {
  els.modalOverlay.style.display = "flex";
  // Focus the first visible text field for accessibility.
  setTimeout(() => els.fieldArtist.focus(), 50);
}

function clearModalForm() {
  els.songForm.reset();
  els.fieldId.value = "";
}

function setModalFieldsReadOnly(readOnly) {
  [els.fieldArtist, els.fieldSong, els.fieldAlbum].forEach(input => {
    input.readOnly = readOnly;
  });
  els.fieldOverplayed.disabled = readOnly;
}

// ─── CRUD Handlers ────────────────────────────────────────────────────────────

/**
 * handleSaveSong — Called when the Save/Create button in the modal is clicked.
 * Builds a song object from the form, calls the API, reloads songs.
 */
async function handleSaveSong() {
  const artist = els.fieldArtist.value.trim();
  const song   = els.fieldSong.value.trim();

  if (!artist || !song) {
    alert("Artist and Song fields are required.");
    return;
  }

  // Build the song payload using the full data shape.
  const payload = {
    id:           els.fieldId.value || undefined,
    artist:       artist,
    song:         song,
    album:        els.fieldAlbum.value.trim(),
    overplayed:   els.fieldOverplayed.checked ? "Y" : "N",
    // Fields not in the form — preserved from existing record or left blank.
    year:         state.modalSong?.year         ?? null,
    genre:        state.modalSong?.genre        ?? "",
    notes:        state.modalSong?.notes        ?? "",
    created_time: state.modalSong?.created_time ?? "",
    updated_time: state.modalSong?.updated_time ?? "",
    created_id:   state.modalSong?.created_id   ?? 0,
    updated_id:   state.modalSong?.updated_id   ?? 0,
  };

  els.modalSaveBtn.disabled = true;
  els.modalSaveBtn.textContent = "Saving…";

  try {
    if (state.modalMode === "create") {
      await api.createSong(payload);
    } else {
      await api.updateSong(payload.id, payload);
    }

    closeModal();
    // Always reload from the source of truth after a mutation.
    await loadSongs();
  } catch (err) {
    console.error("Save failed:", err);
    alert("Could not save song. Please try again.");
  } finally {
    els.modalSaveBtn.disabled = false;
    els.modalSaveBtn.textContent = state.modalMode === "create" ? "Create" : "Update";
  }
}

/**
 * handleDeleteSong — Called when the Delete button in the modal is clicked.
 * Confirms with the user, calls the API, reloads songs.
 *
 * @param {string|number} songId - The song id to delete.
 */
async function handleDeleteSong(songId) {
  const song = state.songs.find(s => String(s.id) === String(songId));
  const name = song ? `"${song.artist} – ${song.song}"` : "this song";

  const confirmed = await confirmDeleteWarning(name);
  if (!confirmed) return;

  els.modalDeleteBtn.disabled = true;
  els.modalDeleteBtn.textContent = "Deleting…";

  try {
    await api.deleteSong(songId);
    closeModal();
    // Reload from source of truth.
    await loadSongs();
  } catch (err) {
    console.error("Delete failed:", err);
    alert("Could not delete song. Please try again.");
  } finally {
    els.modalDeleteBtn.disabled = false;
    els.modalDeleteBtn.textContent = "Delete";
  }
}

/**
 * confirmDeleteWarning — Shows a custom warning dialog for delete actions.
 * Returns true only when the user explicitly confirms deletion.
 */
function confirmDeleteWarning(songLabel) {
  if (!els.deleteConfirmOverlay) {
    return Promise.resolve(confirm(`Delete ${songLabel}? This cannot be undone.`));
  }

  return new Promise(resolve => {
    els.deleteConfirmText.textContent =
      `You are about to permanently delete ${songLabel}. This action cannot be undone.`;

    const finish = (result) => {
      els.deleteConfirmOverlay.style.display = "none";
      els.deleteConfirmOkBtn.removeEventListener("click", onConfirm);
      els.deleteConfirmCancelBtn.removeEventListener("click", onCancel);
      els.deleteConfirmOverlay.removeEventListener("click", onOverlayClick);
      document.removeEventListener("keydown", onKeydown);
      resolve(result);
    };

    const onConfirm = () => finish(true);
    const onCancel = () => finish(false);
    const onOverlayClick = (event) => {
      if (event.target === els.deleteConfirmOverlay) finish(false);
    };
    const onKeydown = (event) => {
      if (event.key === "Escape") finish(false);
    };

    els.deleteConfirmOkBtn.addEventListener("click", onConfirm);
    els.deleteConfirmCancelBtn.addEventListener("click", onCancel);
    els.deleteConfirmOverlay.addEventListener("click", onOverlayClick);
    document.addEventListener("keydown", onKeydown);

    els.deleteConfirmOverlay.style.display = "flex";
    els.deleteConfirmCancelBtn.focus();
  });
}

// ─── Event Wiring ─────────────────────────────────────────────────────────────

/**
 * wireEvents — Attaches all DOM event listeners.
 * Called once during initApp.
 */
function wireEvents() {
  // Search input — filter without hitting the API.
  els.searchInput.addEventListener("input", () => {
    state.searchQuery = els.searchInput.value;
    state.currentPage = 1; // Reset to first page on new search.
    renderApp();
  });

  // Click table headers to toggle sorting by that column.
  els.sortableHeaders.forEach(header => {
    header.addEventListener("click", () => {
      const clickedKey = header.dataset.sortKey;
      if (!clickedKey) return;

      if (state.sortKey === clickedKey) {
        state.sortDirection = state.sortDirection === "asc" ? "desc" : "asc";
      } else {
        state.sortKey = clickedKey;
        state.sortDirection = "asc";
      }

      state.currentPage = 1;
      renderApp();
    });
  });

  // + New Song button.
  els.addSongBtn.addEventListener("click", openCreateModal);

  // Login button — mock login.
  els.loginBtn.addEventListener("click", async () => {
    try {
      state.currentUser = await api.login("sam", "password");
    } catch {
      state.currentUser = { id: 1, username: "sam", role: "admin" };
    }
    updateAuthUI();
    // Re-render so edit controls reflect login state.
    renderApp();
  });

  // Logout button — mock logout.
  els.logoutBtn.addEventListener("click", async () => {
    await api.logout();
    state.currentUser = null;
    updateAuthUI();
    // Close modal if open, in case user was editing.
    closeModal();
    renderApp();
  });

  // Modal — Save button.
  els.modalSaveBtn.addEventListener("click", handleSaveSong);

  // Modal — Delete button.
  els.modalDeleteBtn.addEventListener("click", () => {
    const id = els.fieldId.value || state.modalSong?.id;
    if (id) handleDeleteSong(id);
  });

  // Modal — Close (X button and Close button).
  els.modalCloseBtn.addEventListener("click", closeModal);
  els.modalCloseX.addEventListener("click",   closeModal);

  // Close modal when clicking the dark overlay backdrop.
  els.modalOverlay.addEventListener("click", (e) => {
    if (e.target === els.modalOverlay) closeModal();
  });

  // Close modal with Escape key.
  document.addEventListener("keydown", (e) => {
    if (e.key === "Escape" && state.modalMode !== null) closeModal();
  });
}

// ─── Utilities ────────────────────────────────────────────────────────────────

/**
 * escapeHtml — Prevents XSS when inserting user data into innerHTML.
 * @param {string} str
 * @returns {string}
 */
function escapeHtml(str) {
  const div = document.createElement("div");
  div.appendChild(document.createTextNode(str));
  return div.innerHTML;
}

// ─── Bootstrap ───────────────────────────────────────────────────────────────
// Start the app when the DOM is ready.
document.addEventListener("DOMContentLoaded", initApp);
