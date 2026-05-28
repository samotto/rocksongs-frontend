# rocksongs-frontend

A Vue 3 + Vite web application for managing a list of rock songs. It connects to a Python CRUD backend service and lets you **list, add, edit, and delete** songs.

## Features

- 🎸 View all rock songs in a clean table
- ➕ Add new songs (title, artist, year, genre)
- ✏️ Edit existing songs inline
- 🗑️ Delete songs with confirmation
- 🔌 Connects to a configurable backend REST API

## Prerequisites

- [Node.js](https://nodejs.org/) 18+
- A running rocksongs-backend Python service (default: `http://localhost:5000`)

## Setup

```bash
# Install dependencies
npm install

# Copy and edit environment config
cp .env.example .env
# Set VITE_API_BASE_URL to your backend URL in .env
```

## Development

```bash
npm run dev
```

Open [http://localhost:5173](http://localhost:5173) in your browser.

## Build for Production

```bash
npm run build
npm run preview   # preview the production build
```

## Environment Variables

| Variable | Default | Description |
|---|---|---|
| `VITE_API_BASE_URL` | `http://localhost:5000` | Base URL of the Python backend API |

## Backend API Contract

The app expects the following REST endpoints on the backend:

| Method | Path | Description |
|---|---|---|
| `GET` | `/songs` | List all songs |
| `POST` | `/songs` | Create a new song |
| `PUT` | `/songs/:id` | Update an existing song |
| `DELETE` | `/songs/:id` | Delete a song |

Each song object has the shape:

```json
{
  "id": 1,
  "title": "Stairway to Heaven",
  "artist": "Led Zeppelin",
  "year": 1971,
  "genre": "Hard Rock"
}
```
