/**
 * api.js — All backend communication for RockSongs.
 *
 * Currently uses MOCK DATA and simulated promises.
 * To connect to the real Railway backend, replace each function body
 * with a real fetch() call to the API_BASE_URL endpoint.
 */

// ─── Runtime Config (GitHub Pages + Railway) ───────────────────────────────
// Configure this in index.html via window.RockSongsConfig before loading api.js.
const DEFAULT_API_CONFIG = {
  // TODO: Replace with your real Railway backend URL when ready.
  // Example: "https://rocksongs-api.up.railway.app"
  API_BASE_URL: "https://your-railway-backend-url",
  // Keep mock mode on by default so the app works instantly on static hosting.
  USE_MOCK_API: true,
  REQUEST_TIMEOUT_MS: 10000,
};

const runtimeConfig = (typeof window !== "undefined" && window.RockSongsConfig)
  ? window.RockSongsConfig
  : {};

const API_CONFIG = { ...DEFAULT_API_CONFIG, ...runtimeConfig };
const API_BASE_URL = API_CONFIG.API_BASE_URL;
const USE_MOCK_API = Boolean(API_CONFIG.USE_MOCK_API);

// ─── Mock Data ───────────────────────────────────────────────────────────────
// 40+ sample rock songs used until the real API is wired up.
const MOCK_SONGS = [
  { id: "1",  artist: "Led Zeppelin",        song: "Stairway to Heaven",       album: "Led Zeppelin IV",           year: 1971, overplayed: "Y", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "2",  artist: "Led Zeppelin",        song: "Kashmir",                  album: "Physical Graffiti",         year: 1975, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "3",  artist: "Led Zeppelin",        song: "Whole Lotta Love",         album: "Led Zeppelin II",           year: 1969, overplayed: "N", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "4",  artist: "Black Sabbath",       song: "Iron Man",                 album: "Paranoid",                  year: 1970, overplayed: "Y", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "5",  artist: "Black Sabbath",       song: "War Pigs",                 album: "Paranoid",                  year: 1970, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "6",  artist: "Black Sabbath",       song: "Paranoid",                 album: "Paranoid",                  year: 1970, overplayed: "Y", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "7",  artist: "Deep Purple",         song: "Smoke on the Water",       album: "Machine Head",              year: 1972, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "8",  artist: "Deep Purple",         song: "Highway Star",             album: "Machine Head",              year: 1972, overplayed: "N", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "9",  artist: "AC/DC",               song: "Back in Black",            album: "Back in Black",             year: 1980, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "10", artist: "AC/DC",               song: "Highway to Hell",          album: "Highway to Hell",           year: 1979, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "11", artist: "AC/DC",               song: "Thunderstruck",            album: "The Razors Edge",           year: 1990, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "12", artist: "The Rolling Stones",  song: "Paint It Black",           album: "Aftermath",                 year: 1966, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "13", artist: "The Rolling Stones",  song: "Sympathy for the Devil",   album: "Beggars Banquet",           year: 1968, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "14", artist: "The Rolling Stones",  song: "Gimme Shelter",            album: "Let It Bleed",              year: 1969, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "15", artist: "The Who",             song: "Baba O'Riley",             album: "Who's Next",                year: 1971, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "16", artist: "The Who",             song: "Won't Get Fooled Again",   album: "Who's Next",                year: 1971, overplayed: "N", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "17", artist: "Pink Floyd",          song: "Comfortably Numb",         album: "The Wall",                  year: 1979, overplayed: "N", genre: "Prog Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "18", artist: "Pink Floyd",          song: "Wish You Were Here",       album: "Wish You Were Here",        year: 1975, overplayed: "N", genre: "Prog Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "19", artist: "Pink Floyd",          song: "Another Brick in the Wall","album": "The Wall",                year: 1979, overplayed: "Y", genre: "Prog Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "20", artist: "Aerosmith",           song: "Dream On",                 album: "Aerosmith",                 year: 1973, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "21", artist: "Aerosmith",           song: "Sweet Emotion",            album: "Toys in the Attic",         year: 1975, overplayed: "N", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "22", artist: "Guns N' Roses",       song: "Sweet Child O' Mine",      album: "Appetite for Destruction",  year: 1987, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "23", artist: "Guns N' Roses",       song: "Welcome to the Jungle",    album: "Appetite for Destruction",  year: 1987, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "24", artist: "Metallica",           song: "Enter Sandman",            album: "Metallica",                 year: 1991, overplayed: "Y", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "25", artist: "Metallica",           song: "Master of Puppets",        album: "Master of Puppets",         year: 1986, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "26", artist: "Metallica",           song: "One",                      album: "...And Justice for All",    year: 1988, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "27", artist: "Nirvana",             song: "Smells Like Teen Spirit",  album: "Nevermind",                 year: 1991, overplayed: "Y", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "28", artist: "Nirvana",             song: "Come as You Are",          album: "Nevermind",                 year: 1991, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "29", artist: "Pearl Jam",           song: "Jeremy",                   album: "Ten",                       year: 1991, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "30", artist: "Pearl Jam",           song: "Alive",                    album: "Ten",                       year: 1991, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "31", artist: "Soundgarden",         song: "Black Hole Sun",           album: "Superunknown",              year: 1994, overplayed: "Y", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "32", artist: "Soundgarden",         song: "Spoonman",                 album: "Superunknown",              year: 1994, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "33", artist: "Alice in Chains",     song: "Rooster",                  album: "Dirt",                      year: 1992, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "34", artist: "Alice in Chains",     song: "Would?",                   album: "Dirt",                      year: 1992, overplayed: "N", genre: "Grunge",        notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "35", artist: "Foo Fighters",        song: "Everlong",                 album: "The Colour and the Shape",  year: 1997, overplayed: "N", genre: "Alt Rock",      notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "36", artist: "Foo Fighters",        song: "Best of You",              album: "In Your Honor",             year: 2005, overplayed: "Y", genre: "Alt Rock",      notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "37", artist: "Red Hot Chili Peppers", song: "Under the Bridge",       album: "Blood Sugar Sex Magik",     year: 1991, overplayed: "Y", genre: "Alt Rock",      notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "38", artist: "Red Hot Chili Peppers", song: "Californication",        album: "Californication",           year: 1999, overplayed: "Y", genre: "Alt Rock",      notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "39", artist: "Rage Against the Machine", song: "Killing in the Name", album: "Rage Against the Machine",  year: 1992, overplayed: "N", genre: "Alt Metal",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "40", artist: "Ozzy Osbourne",       song: "Crazy Train",             album: "Blizzard of Ozz",           year: 1980, overplayed: "Y", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "41", artist: "Ozzy Osbourne",       song: "Mr. Crowley",             album: "Blizzard of Ozz",           year: 1980, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "42", artist: "Judas Priest",        song: "Breaking the Law",         album: "British Steel",             year: 1980, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "43", artist: "Iron Maiden",         song: "The Trooper",              album: "Piece of Mind",             year: 1983, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "44", artist: "Iron Maiden",         song: "Run to the Hills",         album: "The Number of the Beast",   year: 1982, overplayed: "N", genre: "Heavy Metal",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "45", artist: "Van Halen",           song: "Jump",                     album: "1984",                      year: 1984, overplayed: "Y", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "46", artist: "Van Halen",           song: "Eruption",                 album: "Van Halen",                 year: 1978, overplayed: "N", genre: "Hard Rock",     notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "47", artist: "Tom Petty",           song: "Free Fallin'",             album: "Full Moon Fever",           year: 1989, overplayed: "Y", genre: "Rock",          notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
  { id: "48", artist: "Tom Petty",           song: "American Girl",            album: "Tom Petty and the Heartbreakers", year: 1976, overplayed: "N", genre: "Rock",   notes: "", created_time: "", updated_time: "", created_id: 0, updated_id: 0 },
];

// Internal working copy of songs; modified by create/update/delete.
let _mockSongs = [...MOCK_SONGS];

// Simple counter for generating new mock IDs.
let _nextId = MOCK_SONGS.length + 1;

// ─── Helpers ─────────────────────────────────────────────────────────────────

/** Simulate a network delay so async patterns are realistic. */
function _delay(ms = 80) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

/**
 * apiRequest — helper for real backend calls when mock mode is disabled.
 */
async function apiRequest(path, options = {}) {
  const {
    method = "GET",
    body,
    headers = {},
    credentials = "include",
  } = options;

  const controller = new AbortController();
  const timeout = setTimeout(() => controller.abort(), API_CONFIG.REQUEST_TIMEOUT_MS);

  try {
    const response = await fetch(`${API_BASE_URL}${path}`, {
      method,
      credentials,
      headers: {
        ...(body ? { "Content-Type": "application/json" } : {}),
        ...headers,
      },
      body: body ? JSON.stringify(body) : undefined,
      signal: controller.signal,
    });

    if (!response.ok) {
      const error = new Error(`Request failed: ${response.status} ${response.statusText}`);
      error.status = response.status;
      throw error;
    }

    if (response.status === 204) return null;

    const contentType = response.headers.get("content-type") || "";
    if (contentType.includes("application/json")) {
      return response.json();
    }

    return response.text();
  } finally {
    clearTimeout(timeout);
  }
}

// ─── Auth Functions ───────────────────────────────────────────────────────────

/**
 * getCurrentUser — Returns the current logged-in user, or null.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/auth/me`, { credentials: "include" })
 *                    .then(res => res.ok ? res.json() : null);
 */
async function getCurrentUser() {
  if (!USE_MOCK_API) {
    try {
      return await apiRequest("/auth/me");
    } catch (error) {
      // 401 means not logged in, not a hard failure.
      if (error && error.status === 401) return null;
      throw error;
    }
  }

  await _delay();
  // Mock: always returns a user (assumed logged in per spec).
  return { id: 1, username: "sam", role: "admin" };
}

/**
 * login — Authenticate with the backend.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/auth/login`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   credentials: "include",
 *   body: JSON.stringify({ username, password })
 * }).then(res => res.json());
 */
async function login(username, password) {
  if (!USE_MOCK_API) {
    return apiRequest("/auth/login", {
      method: "POST",
      body: { username, password },
    });
  }

  await _delay();
  // Mock: always succeeds.
  return { id: 1, username: username || "sam", role: "admin" };
}

/**
 * logout — End the user session.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/auth/logout`, {
 *   method: "POST",
 *   credentials: "include"
 * });
 */
async function logout() {
  if (!USE_MOCK_API) {
    await apiRequest("/auth/logout", { method: "POST" });
    return { success: true };
  }

  await _delay();
  return { success: true };
}

// ─── Song CRUD Functions ──────────────────────────────────────────────────────

/**
 * getSongs — Fetch all songs from the backend.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/songs`)
 *                    .then(res => res.json());
 */
async function getSongs() {
  if (!USE_MOCK_API) {
    return apiRequest("/songs");
  }

  await _delay();
  // Return a shallow copy so callers don't mutate the mock store directly.
  return [..._mockSongs];
}

/**
 * createSong — POST a new song to the backend.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/songs`, {
 *   method: "POST",
 *   headers: { "Content-Type": "application/json" },
 *   credentials: "include",
 *   body: JSON.stringify(song)
 * }).then(res => res.json());
 *
 * @param {object} song - Song data (without id).
 * @returns {Promise<object>} The created song with its new id.
 */
async function createSong(song) {
  if (!USE_MOCK_API) {
    return apiRequest("/songs", {
      method: "POST",
      body: song,
    });
  }

  await _delay();
  const newSong = { ...song, id: String(_nextId++) };
  _mockSongs.push(newSong);
  return newSong;
}

/**
 * updateSong — PATCH/PUT an existing song.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/songs/${id}`, {
 *   method: "PUT",
 *   headers: { "Content-Type": "application/json" },
 *   credentials: "include",
 *   body: JSON.stringify(song)
 * }).then(res => res.json());
 *
 * @param {string|number} id  - The song's id.
 * @param {object}        song - Updated song fields.
 * @returns {Promise<object>} The updated song.
 */
async function updateSong(id, song) {
  if (!USE_MOCK_API) {
    return apiRequest(`/songs/${id}`, {
      method: "PUT",
      body: song,
    });
  }

  await _delay();
  const index = _mockSongs.findIndex(s => String(s.id) === String(id));
  if (index === -1) throw new Error(`Song ${id} not found`);
  _mockSongs[index] = { ..._mockSongs[index], ...song, id: String(id) };
  return _mockSongs[index];
}

/**
 * deleteSong — DELETE a song from the backend.
 *
 * TODO (real API): return fetch(`${API_BASE_URL}/songs/${id}`, {
 *   method: "DELETE",
 *   credentials: "include"
 * });
 *
 * @param {string|number} id - The song's id.
 */
async function deleteSong(id) {
  if (!USE_MOCK_API) {
    await apiRequest(`/songs/${id}`, { method: "DELETE" });
    return { success: true };
  }

  await _delay();
  const index = _mockSongs.findIndex(s => String(s.id) === String(id));
  if (index === -1) throw new Error(`Song ${id} not found`);
  _mockSongs.splice(index, 1);
  return { success: true };
}

// Single namespace exported to the global scope for app.js to consume.
window.RockSongsApi = {
  getCurrentUser,
  login,
  logout,
  getSongs,
  createSong,
  updateSong,
  deleteSong,
};

// Useful for debugging runtime mode (mock vs real backend).
window.RockSongsApiConfig = API_CONFIG;
