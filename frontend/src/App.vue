<template>
  <div class="container">
    <header>
      <h1>Dropbox App</h1>
      <nav>
        <RouterLink to="/">Arquivos</RouterLink>
        <RouterLink to="/upload">Upload</RouterLink>
      </nav>
    </header>
    <main>
      <RouterView />
    </main>
  </div>
</template>

<script setup>
</script>

<style>
* { box-sizing: border-box; }
body { margin: 0; font-family: system-ui, -apple-system, Segoe UI, Roboto, Ubuntu, Cantarell, Noto Sans, Helvetica Neue, Arial, "Apple Color Emoji", "Segoe UI Emoji"; }
.container { max-width: 960px; margin: 0 auto; padding: 16px; }
header { display: flex; gap: 16px; align-items: center; justify-content: space-between; }
nav { display: flex; gap: 12px; }
a { text-decoration: none; color: #2c3e50; }
a.router-link-active { font-weight: 700; }
button { cursor: pointer; }
.table { width: 100%; border-collapse: collapse; }
.table th, .table td { border-bottom: 1px solid #ddd; padding: 8px; text-align: left; }
.table th { background: #f6f7f8; }
.badge { display: inline-block; padding: 2px 6px; border-radius: 4px; background: #eef; }
.actions { display: flex; gap: 8px; }
</style>
