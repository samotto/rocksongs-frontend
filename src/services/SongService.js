import axios from 'axios'

const apiClient = axios.create({
  baseURL: import.meta.env.VITE_API_BASE_URL || 'http://localhost:5000',
  headers: {
    'Content-Type': 'application/json',
  },
})

export default {
  getSongs() {
    return apiClient.get('/songs')
  },
  getSong(id) {
    return apiClient.get(`/songs/${id}`)
  },
  createSong(song) {
    return apiClient.post('/songs', song)
  },
  updateSong(id, song) {
    return apiClient.put(`/songs/${id}`, song)
  },
  deleteSong(id) {
    return apiClient.delete(`/songs/${id}`)
  },
}
