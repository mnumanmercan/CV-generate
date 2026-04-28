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

// Mount immediately — do NOT await session restore at the top level. Awaiting
// here blocks first paint on every visit (guests and returning users alike)
// until the backend responds, which with the 15 s apiClient timeout can be up
// to 15 s of blank page on slow networks.
//
// Instead we kick off the probe in the background and let the router's guard
// wait on `userStore.isSessionRestored` for auth-gated routes. Public routes
// (/, /pricing, /login, /register) render instantly.
app.mount('#app')

const userStore = useUserStore(pinia)
void userStore.restoreSession()
