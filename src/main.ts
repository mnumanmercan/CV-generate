import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import './assets/main.css'
import App from './App.vue'
import { useUserStore } from '@/stores/userStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)
app.use(router)

// Silently restore session on page load using the HttpOnly refresh token cookie.
// This runs before mount so authenticated state is ready before the first render.
const userStore = useUserStore(pinia)
await userStore.restoreSession()

app.mount('#app')
