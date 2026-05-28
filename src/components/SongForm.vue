<script setup>
import { ref, watch } from 'vue'

const props = defineProps({
  song: {
    type: Object,
    default: null,
  },
})

const emit = defineEmits(['save', 'cancel'])

const blankForm = () => ({ title: '', artist: '', year: '', genre: '' })

const form = ref(blankForm())

watch(
  () => props.song,
  (newSong) => {
    if (newSong) {
      form.value = { ...newSong }
    } else {
      form.value = blankForm()
    }
  },
  { immediate: true },
)

function submit() {
  emit('save', { ...form.value })
}

function cancel() {
  emit('cancel')
}
</script>

<template>
  <div class="song-form">
    <h2>{{ song ? 'Edit Song' : 'Add Song' }}</h2>
    <form @submit.prevent="submit">
      <div class="form-group">
        <label for="title">Title *</label>
        <input id="title" v-model="form.title" type="text" required placeholder="Song title" />
      </div>
      <div class="form-group">
        <label for="artist">Artist *</label>
        <input id="artist" v-model="form.artist" type="text" required placeholder="Artist name" />
      </div>
      <div class="form-group">
        <label for="year">Year</label>
        <input id="year" v-model="form.year" type="number" min="1900" max="2099" placeholder="Release year" />
      </div>
      <div class="form-group">
        <label for="genre">Genre</label>
        <input id="genre" v-model="form.genre" type="text" placeholder="e.g. Hard Rock, Classic Rock" />
      </div>
      <div class="form-actions">
        <button type="submit" class="btn btn-primary">{{ song ? 'Update' : 'Add' }}</button>
        <button type="button" class="btn btn-secondary" @click="cancel">Cancel</button>
      </div>
    </form>
  </div>
</template>

<style scoped>
.song-form {
  background: #1e1e2e;
  border: 1px solid #333;
  border-radius: 8px;
  padding: 1.5rem;
  margin-bottom: 1.5rem;
}

h2 {
  margin-top: 0;
  color: #e0aaff;
  font-size: 1.25rem;
}

.form-group {
  display: flex;
  flex-direction: column;
  gap: 0.25rem;
  margin-bottom: 1rem;
}

label {
  font-size: 0.875rem;
  color: #aaa;
}

input {
  background: #12121e;
  border: 1px solid #444;
  border-radius: 4px;
  color: #fff;
  font-size: 1rem;
  padding: 0.5rem 0.75rem;
  outline: none;
  transition: border-color 0.2s;
}

input:focus {
  border-color: #c77dff;
}

.form-actions {
  display: flex;
  gap: 0.75rem;
  margin-top: 1.25rem;
}

.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.95rem;
  padding: 0.5rem 1.25rem;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.85;
}

.btn-primary {
  background: #c77dff;
  color: #0d0d1a;
  font-weight: 600;
}

.btn-secondary {
  background: #333;
  color: #ccc;
}
</style>
