import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import UploadPage from '../pages/UploadPage.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/upload', component: UploadPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
