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

### `js/api.js`
All backend communication is isolated here. Currently uses mock data and simulated `async` functions. To connect to the real FastAPI/Railway backend:

1. Set `API_BASE_URL` to your Railway URL:
   ```js
   const API_BASE_URL = "https://rocksongs-api.up.railway.app";
   ```
2. Replace each mock function body with a real `fetch()` call. Each function has a `TODO (real API):` comment showing exactly what the real call should look like.

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

## Backend

The backend is a Python/FastAPI app deployed on Railway. Backend URL is configured in `js/api.js` via the `API_BASE_URL` constant.
