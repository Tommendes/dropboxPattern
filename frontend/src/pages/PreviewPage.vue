<template>
  <section>
    <header style="display:flex;align-items:center;gap:12px;margin-bottom:12px;">
      <button @click="$router.back()">← Voltar</button>
      <h2 style="margin:0;">Preview: {{ name || path }}</h2>
    </header>

    <div v-if="loading">Carregando…</div>
    <div v-else>
      <template v-if="isPdf">
        <iframe :src="inlineUrl" style="width:100%;height:80vh;border:1px solid #ddd;"/>
      </template>
      <template v-else-if="isImage">
        <img :src="inlineUrl" :alt="name || path" style="max-width:100%;height:auto;border:1px solid #ddd;" />
      </template>
      <template v-else-if="isMarkdown">
        <article v-html="markdownHtml" class="markdown-body" />
      </template>
      <template v-else-if="isCsv">
        <div style="overflow:auto;">
          <table class="table">
            <thead>
              <tr>
                <th v-for="(h,i) in csvHeaders" :key="'h'+i">{{ h }}</th>
              </tr>
            </thead>
            <tbody>
              <tr v-for="(row,ri) in csvRows" :key="'r'+ri">
                <td v-for="(cell,ci) in row" :key="'c'+ri+'-'+ci">{{ cell }}</td>
              </tr>
            </tbody>
          </table>
        </div>
      </template>
      <template v-else>
        <pre style="white-space:pre-wrap; word-break:break-word; border:1px solid #ddd; padding:12px;">{{ textContent }}</pre>
      </template>
    </div>
  </section>
</template>

<script setup>
import { ref, computed, onMounted } from 'vue'
import { useRoute } from 'vue-router'
import * as MarkedNS from 'marked'
import Papa from 'papaparse'

const route = useRoute()
const API_URL = import.meta.env.VITE_API_URL

const path = computed(() => route.query.path || '')
const name = computed(() => route.query.name || '')

const isPdf = computed(() => /\.pdf$/i.test(name.value || path.value))
const isImage = computed(() => /\.(png|jpe?g|gif|webp|bmp|svg)$/i.test(name.value || path.value))
const isMarkdown = computed(() => /\.md$/i.test(name.value || path.value))
const isCsv = computed(() => /\.csv$/i.test(name.value || path.value))

const inlineUrl = computed(() => `${API_URL}/preview/inline?path=${encodeURIComponent(path.value)}`)
// Compat de import do marked (named vs default)
const markedLib = MarkedNS.marked || MarkedNS.default || MarkedNS
const loading = ref(true)
const textContent = ref('')
const markdownHtml = ref('')
const csvHeaders = ref([])
const csvRows = ref([])

async function fetchText() {
  const resp = await fetch(inlineUrl.value)
  const text = await resp.text()
  return text
}

onMounted(async () => {
  try {
    if (isPdf.value || isImage.value) {
      // iframe/img usa inlineUrl diretamente
      loading.value = false
      return
    }
    const text = await fetchText()
    if (isMarkdown.value) {
      // Usa parse quando disponível; caso contrário, chama a função diretamente
      if (markedLib && typeof markedLib.parse === 'function') {
        markdownHtml.value = markedLib.parse(text)
      } else if (typeof markedLib === 'function') {
        markdownHtml.value = markedLib(text)
      } else {
        markdownHtml.value = text
      }
    } else if (isCsv.value) {
      const parsed = Papa.parse(text.trim())
      csvHeaders.value = parsed.data[0] || []
      csvRows.value = parsed.data.slice(1)
    } else {
      textContent.value = text
    }
  } catch (e) {
    textContent.value = `Erro ao carregar: ${e?.message || e}`
  } finally {
    loading.value = false
  }
})
</script>

<style scoped>
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border: 1px solid #ddd; padding: 6px 8px; text-align: left; }
.markdown-body :deep(h1,h2,h3){ margin-top: 1em; }
</style>
