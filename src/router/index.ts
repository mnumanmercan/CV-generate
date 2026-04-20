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

/**
 * Wait for the in-flight session-restore probe to finish before deciding
 * auth-gated navigation. Public routes don't call this — they render
 * immediately regardless of session state.
 *
 * Resolves as soon as `isSessionRestored` is true, or after a hard 2s cap
 * so a hung backend can't lock the user out of every protected route.
 */
function awaitSessionRestore(userStore: ReturnType<typeof useUserStore>): Promise<void> {
  if (userStore.isSessionRestored) return Promise.resolve()
  return new Promise((resolve) => {
    const cap = setTimeout(resolve, 2000)
    const unwatch = userStore.$subscribe(() => {
      if (userStore.isSessionRestored) {
        clearTimeout(cap)
        unwatch()
        resolve()
      }
    })
  })
}

router.beforeEach(async (to) => {
  const userStore = useUserStore()

  // Protected routes wait for the session probe so a refresh into /dashboard
  // doesn't briefly bounce to /login while the /auth/refresh call is in flight.
  // Public routes skip the wait — they render immediately.
  if (to.meta.requiresAuth || to.meta.requiresPremium || to.meta.guestOnly) {
    await awaitSessionRestore(userStore)
  }

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
//
// IMPORTANT: use clearLocalSession() here — NOT logout(). The server has
// already invalidated our session (that's why we got the 401 that led here).
// Calling logout() would fire POST /auth/logout, which would 401, which —
// even after excluding /auth/logout from refresh-and-dispatch in apiClient —
// is pure wasted work. clearLocalSession is sync, so by the time router.push
// runs, the storage delegate is already LocalStorage again and no subsequent
// view mount can fire an authed API call.
//
// Same-route guard prevents a duplicate push when the listener fires while
// we're already on /login (defence-in-depth; the loop in the store/apiClient
// is already broken by the changes above).
let sessionExpiryListenerRegistered = false
router.isReady().then(() => {
  if (sessionExpiryListenerRegistered) return
  sessionExpiryListenerRegistered = true
  window.addEventListener('resumark:session-expired', () => {
    const userStore = useUserStore()
    userStore.clearLocalSession()
    if (router.currentRoute.value.name !== 'login') {
      router.push({ name: 'login' })
    }
  })
})

export default router
