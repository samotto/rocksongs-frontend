<script setup>
import { ref, onMounted } from 'vue'
import SongForm from './components/SongForm.vue'
import SongList from './components/SongList.vue'
import SongService from './services/SongService.js'

const songs = ref([])
const editingSong = ref(null)
const showForm = ref(false)
const error = ref(null)
const loading = ref(false)

async function fetchSongs() {
  loading.value = true
  error.value = null
  try {
    const response = await SongService.getSongs()
    songs.value = response.data
  } catch (err) {
    error.value = 'Failed to load songs. Is the backend running?'
    console.error(err)
  } finally {
    loading.value = false
  }
}

async function saveSong(songData) {
  error.value = null
  try {
    if (editingSong.value) {
      await SongService.updateSong(editingSong.value.id, songData)
    } else {
      await SongService.createSong(songData)
    }
    cancelForm()
    await fetchSongs()
  } catch (err) {
    error.value = 'Failed to save song. Please try again.'
    console.error(err)
  }
}

async function deleteSong(id) {
  if (!confirm('Delete this song?')) return
  error.value = null
  try {
    await SongService.deleteSong(id)
    await fetchSongs()
  } catch (err) {
    error.value = 'Failed to delete song. Please try again.'
    console.error(err)
  }
}

function startEdit(song) {
  editingSong.value = song
  showForm.value = true
}

function startAdd() {
  editingSong.value = null
  showForm.value = true
}

function cancelForm() {
  showForm.value = false
  editingSong.value = null
}

onMounted(fetchSongs)
</script>

<template>
  <div class="app">
    <header class="app-header">
      <h1>🎸 Rock Songs</h1>
      <button v-if="!showForm" class="btn btn-add" @click="startAdd">+ Add Song</button>
    </header>

    <main class="app-main">
      <div v-if="error" class="error-banner">{{ error }}</div>

      <SongForm
        v-if="showForm"
        :song="editingSong"
        @save="saveSong"
        @cancel="cancelForm"
      />

      <div v-if="loading" class="loading">Loading songs…</div>
      <SongList
        v-else
        :songs="songs"
        @edit="startEdit"
        @delete="deleteSong"
      />
    </main>
  </div>
</template>

<style>
*,
*::before,
*::after {
  box-sizing: border-box;
  margin: 0;
  padding: 0;
}

body {
  background: #0d0d1a;
  color: #e0e0e0;
  font-family: 'Segoe UI', Tahoma, Geneva, Verdana, sans-serif;
  min-height: 100vh;
}

.app {
  max-width: 900px;
  margin: 0 auto;
  padding: 1.5rem 1rem;
}

.app-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 1.5rem;
}

.app-header h1 {
  font-size: 2rem;
  color: #c77dff;
  letter-spacing: 1px;
}

.btn-add {
  background: #c77dff;
  border: none;
  border-radius: 4px;
  color: #0d0d1a;
  cursor: pointer;
  font-size: 0.95rem;
  font-weight: 600;
  padding: 0.5rem 1.25rem;
  transition: opacity 0.2s;
}

.btn-add:hover {
  opacity: 0.85;
}

.app-main {
  min-height: 200px;
}

.error-banner {
  background: #5a1a22;
  border: 1px solid #8b2635;
  border-radius: 4px;
  color: #f8a4b0;
  margin-bottom: 1rem;
  padding: 0.75rem 1rem;
}

.loading {
  color: #888;
  padding: 2rem;
  text-align: center;
}
</style>
