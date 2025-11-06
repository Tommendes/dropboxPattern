<template>
  <button :disabled="loading" @click="onPreview" title="Visualizar">
    <span v-if="loading">⏳</span>
    <span v-else>👁️</span>
  </button>
</template>

<script setup>
import { ref } from 'vue'
import { useDropboxStore } from '../store/dropboxStore'
import axios from 'axios'
const API_URL = import.meta.env.VITE_API_URL

const props = defineProps({
  path: { type: String, required: true },
  name: { type: String, required: false }
})
const loading = ref(false)
const store = useDropboxStore()

function isOfficeFile(p) {
  return /\.(doc|docx|xls|xlsx|ppt|pptx)$/i.test(p)
}
function isPdf(p) {
  return /\.pdf$/i.test(p)
}
function isImage(p) {
  return /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(p)
}

let win
async function onPreview() {
  try {
    loading.value = true
    // Pre-abre a aba sincronamente para não ser bloqueada pelo navegador
    win = window.open('about:blank', '_blank')
    let link
    if (typeof store.previewFile === 'function') {
      link = await store.previewFile(props.path)
    } else {
      // Fallback direto ao backend caso HMR não tenha atualizado a store
      const { data } = await axios.get(`${API_URL}/preview`, { params: { path: props.path } })
      link = data?.url
    }
    if (!link) throw new Error('Não foi possível gerar o link de visualização')

    if (isOfficeFile(props.name || props.path)) {
      const viewer = `https://view.officeapps.live.com/op/view.aspx?src=${encodeURIComponent(link)}`
      if (win) win.location = viewer
    } else if (isPdf(props.name || props.path) || isImage(props.name || props.path)) {
      // Para PDF/imagem, usar proxy inline do backend para forçar Content-Disposition inline
      const inlineUrl = `${API_URL}/preview/inline?path=${encodeURIComponent(props.path)}`
      if (win) win.location = inlineUrl
    } else {
      // Fallback: tentar abrir direto; se o navegador não suportar, o Dropbox fará download
      if (win) win.location = link
    }
  } catch (e) {
    // Fallback amigável
    console.error('[PreviewButton] Falha no preview:', e)
    try { if (win && !win.closed) win.close() } catch (_) {}
    alert(e?.message || 'Falha ao abrir visualização')
  } finally {
    loading.value = false
  }
}
</script>

<style scoped>
button { padding: 6px 10px; border: 1px solid #ccc; background: #fff; border-radius: 4px; cursor: pointer; }
button:hover { background: #f6f7f8; }
button:disabled { opacity: .6; cursor: not-allowed; }
</style>
