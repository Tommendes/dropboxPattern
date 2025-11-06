<template>
  <form @submit.prevent="onSubmit">
    <input type="file" @change="onFile" />
    <button type="submit" :disabled="!file">Enviar</button>
  </form>
</template>

<script setup>
import { ref } from 'vue'
import { useDropboxStore } from '../store/dropboxStore'

const file = ref(null)
const store = useDropboxStore()

function onFile(e) {
  file.value = e.target.files[0]
}

async function onSubmit() {
  if (!file.value) return
  await store.uploadFile(file.value)
  file.value = null
  alert('Upload concluído!')
}
</script>

<style scoped>
form { display:flex; gap:8px; align-items:center; }
</style>