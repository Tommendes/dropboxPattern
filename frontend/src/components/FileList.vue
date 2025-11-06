<template>
  <div>
    <div style="display:flex; gap:8px; align-items:center; margin-bottom:12px;">
      <button @click="onRefresh" :disabled="loading">Atualizar</button>
      <button @click="onLogin" v-if="!authenticated">Login Dropbox</button>
      <span v-else class="badge">Autenticado</span>
    </div>

    <div v-if="error" style="color:#b00; margin-bottom:8px;">{{ error }}</div>

    <table class="table">
      <thead>
        <tr>
          <th>Nome</th>
          <th>Modificado</th>
          <th>Tamanho</th>
          <th>Visualizar</th>
          <th>Ações</th>
        </tr>
      </thead>
      <tbody>
        <tr v-if="loading">
          <td colspan="4">Carregando...</td>
        </tr>
        <tr v-for="f in files" :key="f.id">
          <td>
            <span v-if="f.tag==='folder'">📁</span>
            <span v-else>📄</span>
            {{ f.name }}
          </td>
          <td>{{ formatDate(f.client_modified || f.server_modified) }}</td>
          <td>{{ formatSize(f.size) }}</td>
          <td>
            <PreviewButton v-if="f.tag==='file'" :path="f.path_lower" :name="f.name" />
          </td>
          <td class="actions">
            <button @click="onDownload(f.path_lower)" :disabled="f.tag==='folder'">Download</button>
            <button @click="onDelete(f.path_lower)" :disabled="f.tag==='folder'">Excluir</button>
          </td>
        </tr>
      </tbody>
    </table>
  </div>
</template>

<script setup>
import { onMounted } from 'vue'
import { storeToRefs } from 'pinia'
import { useDropboxStore } from '../store/dropboxStore'
import PreviewButton from './PreviewButton.vue'

const store = useDropboxStore()
const { files, loading, error, authenticated } = storeToRefs(store)

onMounted(async () => {
  await store.checkAuth()
  if (authenticated.value) await store.listFiles()
})

function onRefresh() {
  store.listFiles()
}
async function onLogin() {
  await store.login()
  await store.listFiles()
}
function onDownload(pathLower) {
  store.downloadFile(pathLower)
}
async function onDelete(pathLower) {
  if (confirm('Excluir este arquivo?')) {
    await store.deleteFile(pathLower)
    await store.listFiles()
  }
}
function formatDate(iso) {
  if (!iso) return '-'
  const d = new Date(iso)
  return d.toLocaleString()
}
function formatSize(bytes) {
  if (!bytes) return '-'
  const units = ['B', 'KB', 'MB', 'GB']
  let v = bytes, i = 0
  while (v >= 1024 && i < units.length - 1) { v /= 1024; i++ }
  return `${v.toFixed(1)} ${units[i]}`
}
</script>

<style scoped>
button { padding: 6px 10px; border: 1px solid #ccc; background: #fff; border-radius: 4px; }
button:hover { background: #f6f7f8; }
</style>
