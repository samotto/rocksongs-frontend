# RockSongs Frontend

A searchable rock song catalog built with plain HTML, CSS, and vanilla JavaScript. No frameworks, no build tools, no npm.

## Purpose

Browse, search, and manage a catalog of classic rock songs. Logged-in users can create, edit, and delete songs. All users can search and browse.

## File Structure

```
rocksongs-frontend/
├── index.html          # Single page — all UI lives here
├── css/
│   └── styles.css      # All styles, no framework
├── js/
│   ├── api.js          # All backend communication (currently mock)
│   ├── config.js       # Local/remote environment selection
│   └── app.js          # App state, rendering, events, CRUD logic
└── README.md           # This file
```

## How to Run Locally

No build step required. Just serve the folder with any local HTTP server.

**Option 1 — Python (recommended):**

```bash
python3 -m http.server 5173
```

Then open: [http://localhost:5173](http://localhost:5173)

**Option 2 — VS Code Live Server:**

Install the [Live Server extension](https://marketplace.visualstudio.com/items?itemName=ritwickdey.LiveServer), right-click `index.html`, and choose **Open with Live Server**.

## Tech Stack

- Plain HTML5
- Standard CSS (no framework)
- Vanilla JavaScript (ES2020+, no transpilation)
- Standard browser APIs only (`fetch`, `localStorage`, DOM APIs)

## Architecture Notes

### `js/config.js`

All environment-specific frontend values live here. The frontend selects `local`
automatically on `localhost` or `127.0.0.1`; every other hostname uses `remote`.

- Local API: `http://localhost:8000`
- Remote API: set `REMOTE_API_BASE_URL` to the Railway public backend URL
- During local development, keep `ENVIRONMENT_OVERRIDE` set to `"local"`
- When publishing GitHub Pages, set `ENVIRONMENT_OVERRIDE` to `"remote"`
- `USE_MOCK_API` can be enabled independently in either environment
- Request timeouts are configurable per environment

No secrets belong in this file because GitHub Pages serves it publicly.

### `js/api.js`

All backend communication is isolated here and reads its URL, mode, and timeout
from `window.RockSongsConfig` created by `js/config.js`.

### `js/app.js`
Manages all application state, rendering, and user interactions. Key functions:

| Function | Purpose |
|---|---|
| `initApp()` | Entry point, called on page load |
| `loadSongs()` | Fetch all songs and re-render |
| `renderApp()` | Filter + render table + pagination |
| `renderSongTable()` | Render the current page of songs |
| `renderPagination()` | Render page controls |
| `filterSongs()` | Apply search query to song list |
| `openCreateModal()` | Open modal for a new song |
| `openEditModal(id)` | Open modal to edit an existing song |
| `closeModal()` | Close the modal |
| `handleSaveSong()` | Create or update a song via API |
| `handleDeleteSong(id)` | Delete a song via API |
| `updateAuthUI()` | Show/hide controls based on login state |

### Data Refresh Rule
After any create, update, or delete, the app calls `getSongs()` again and re-renders from the fresh data. It does **not** manually patch the local list.

## Song Data Shape

```js
{
  id: "uuid-or-number",
  artist: "Led Zeppelin",
  song: "Stairway to Heaven",
  album: "Led Zeppelin IV",
  year: 1971,
  overplayed: "Y",       // "Y" or "N"
  genre: "Rock",
  notes: "",
  created_time: "",
  updated_time: "",
  created_id: 0,
  updated_id: 0
}
```

## Deployment

This is a static frontend and can be deployed to **GitHub Pages**:

1. Push to GitHub.
2. In repo Settings → Pages, set source to the `main` branch root.
3. Your app will be live at `https://<username>.github.io/rocksongs-frontend/`.
4. Set `REMOTE_API_BASE_URL` in `js/config.js` to the Railway backend's HTTPS URL.

## Backend

The backend is a Python/FastAPI app deployed on Railway. Its public URL is configured once in `js/config.js`.
