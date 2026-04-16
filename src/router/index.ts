import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'Resumark — ATS-Friendly Resume Builder' },
  },
  {
    path: '/builder',
    name: 'builder',
    component: () => import('@/views/BuilderView.vue'),
    meta: { title: 'CV Builder — Resumark' },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('@/views/PricingView.vue'),
    meta: { title: 'Pricing — Resumark' },
  },
  {
    path: '/login',
    name: 'login',
    component: () => import('@/views/LoginView.vue'),
    meta: { title: 'Sign In — Resumark', guestOnly: true },
  },
  {
    path: '/register',
    name: 'register',
    component: () => import('@/views/RegisterView.vue'),
    meta: { title: 'Create Account — Resumark', guestOnly: true },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard — Resumark', requiresAuth: true },
  },
  {
    path: '/cover-letter',
    name: 'cover-letter',
    component: () => import('@/views/CoverLetterView.vue'),
    meta: { title: 'Cover Letter — Resumark', requiresAuth: true },
  },
  {
    path: '/:pathMatch(.*)*',
    redirect: '/',
  },
]

const router = createRouter({
  history: createWebHistory(),
  routes,
  scrollBehavior: () => ({ top: 0 }),
})

router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.guestOnly && userStore.isLoggedIn) {
    return { name: 'home' }
  }

  if (to.meta.requiresAuth && !userStore.isLoggedIn) {
    return { name: 'login' }
  }

  if (to.meta.requiresPremium && !userStore.isPremium) {
    return { name: 'pricing' }
  }

  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }

  return true
})

// Handle session expiry events dispatched by apiClient on persistent 401 responses.
// Registered inside isReady() so it runs after Pinia is installed — calling
// useUserStore() at module scope is fragile if import order changes.
let sessionExpiryListenerRegistered = false
router.isReady().then(() => {
  if (sessionExpiryListenerRegistered) return
  sessionExpiryListenerRegistered = true
  window.addEventListener('resumark:session-expired', () => {
    const userStore = useUserStore()
    userStore.logout()
    router.push({ name: 'login' })
  })
})

export default router
