import { createApp } from 'vue'
import { createPinia } from 'pinia'
import router from '@/router'
import './assets/main.css'
import App from './App.vue'
import { useUserStore } from '@/stores/userStore'

const app = createApp(App)
const pinia = createPinia()

app.use(pinia)

// Restore session BEFORE the router activates so that guestOnly/requiresAuth
// guards have the correct isLoggedIn state on the very first navigation.
const userStore = useUserStore(pinia)
await userStore.restoreSession()

app.use(router)
app.mount('#app')
