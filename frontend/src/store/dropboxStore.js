import { defineStore } from 'pinia'
import axios from 'axios'

const API_URL = import.meta.env.VITE_API_URL

export const useDropboxStore = defineStore('dropbox', {
  state: () => ({
    files: [],
    loading: false,
    error: null,
    authenticated: false
  }),
  actions: {
    async checkAuth() {
      try {
        const { data } = await axios.get(`${API_URL}/auth/status`)
        this.authenticated = !!data.authenticated
      } catch (_) {
        this.authenticated = false
      }
    },
    async login() {
      const { data } = await axios.get(`${API_URL}/auth/url`)
      const authUrl = data.url
      return new Promise((resolve) => {
        const popup = window.open(authUrl, 'dropbox-login', 'width=600,height=700')
        const handler = (event) => {
          if (!event?.data) return
          if (event.data.type === 'dropbox-auth-success') {
            window.removeEventListener('message', handler)
            try { popup && popup.close() } catch (_) {}
            this.authenticated = true
            resolve(true)
          }
        }
        window.addEventListener('message', handler)
      })
    },
    async listFiles() {
      this.loading = true
      this.error = null
      try {
        const { data } = await axios.get(`${API_URL}/files`)
        this.files = data.files
      } catch (err) {
        this.error = err?.response?.data?.error || err.message
      } finally {
        this.loading = false
      }
    },
    async uploadFile(file) {
      const form = new FormData()
      form.append('file', file)
      await axios.post(`${API_URL}/upload`, form, { headers: { 'Content-Type': 'multipart/form-data' } })
    },
    async downloadFile(pathLower) {
      const url = `${API_URL}/download${pathLower}`
      window.location.href = url
    },
    async deleteFile(pathLower) {
      await axios.delete(`${API_URL}/delete${pathLower}`)
    },
    async previewFile(pathLower) {
      // Usa query param para preservar barras no caminho
      const { data } = await axios.get(`${API_URL}/preview`, { params: { path: pathLower } })
      return data?.url
    }
  }
})
