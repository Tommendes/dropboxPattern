import { createRouter, createWebHistory } from 'vue-router'
import Home from '../pages/Home.vue'
import UploadPage from '../pages/UploadPage.vue'
import PreviewPage from '../pages/PreviewPage.vue'

const routes = [
  { path: '/', component: Home },
  { path: '/upload', component: UploadPage },
  { path: '/preview', component: PreviewPage }
]

const router = createRouter({
  history: createWebHistory(),
  routes
})

export default router
