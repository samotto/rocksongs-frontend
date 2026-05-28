<script setup>
defineProps({
  songs: {
    type: Array,
    required: true,
  },
})

const emit = defineEmits(['edit', 'delete'])
</script>

<template>
  <div class="song-list">
    <p v-if="songs.length === 0" class="empty-state">No songs found. Add one above!</p>
    <table v-else>
      <thead>
        <tr>
          <th>Title</th>
          <th>Artist</th>
          <th>Year</th>
          <th>Genre</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
        <tr v-for="song in songs" :key="song.id">
          <td>{{ song.title }}</td>
          <td>{{ song.artist }}</td>
          <td>{{ song.year || '—' }}</td>
          <td>{{ song.genre || '—' }}</td>
          <td class="actions">
            <button class="btn btn-edit" @click="emit('edit', song)">Edit</button>
            <button class="btn btn-delete" @click="emit('delete', song.id)">Delete</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<style scoped>
.song-list {
  overflow-x: auto;
}

.empty-state {
  color: #888;
  text-align: center;
  padding: 2rem 0;
}

table {
  width: 100%;
  border-collapse: collapse;
  font-size: 0.95rem;
}

thead th {
  background: #1e1e2e;
  color: #e0aaff;
  font-weight: 600;
  padding: 0.75rem 1rem;
  text-align: left;
  border-bottom: 2px solid #333;
}

tbody tr {
  border-bottom: 1px solid #222;
  transition: background 0.15s;
}

tbody tr:hover {
  background: #16162a;
}

td {
  padding: 0.7rem 1rem;
  color: #ddd;
}

.actions {
  display: flex;
  gap: 0.5rem;
}

.btn {
  border: none;
  border-radius: 4px;
  cursor: pointer;
  font-size: 0.85rem;
  padding: 0.3rem 0.8rem;
  transition: opacity 0.2s;
}

.btn:hover {
  opacity: 0.8;
}

.btn-edit {
  background: #7b5ea7;
  color: #fff;
}

.btn-delete {
  background: #8b2635;
  color: #fff;
}
</style>
