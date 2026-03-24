import { createRouter, createWebHistory, type RouteRecordRaw } from 'vue-router'
import { useUserStore } from '@/stores/userStore'

const routes: RouteRecordRaw[] = [
  {
    path: '/',
    name: 'home',
    component: () => import('@/views/HomeView.vue'),
    meta: { title: 'CV Generate — ATS-Friendly Resume Builder' },
  },
  {
    path: '/builder',
    name: 'builder',
    component: () => import('@/views/BuilderView.vue'),
    meta: { title: 'CV Builder — CV Generate' },
  },
  {
    path: '/pricing',
    name: 'pricing',
    component: () => import('@/views/PricingView.vue'),
    meta: { title: 'Pricing — CV Generate' },
  },
  {
    path: '/dashboard',
    name: 'dashboard',
    component: () => import('@/views/DashboardView.vue'),
    meta: { title: 'Dashboard — CV Generate', requiresPremium: true },
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

// Route guard — Phase 2: gate /dashboard behind real auth
router.beforeEach((to) => {
  const userStore = useUserStore()

  if (to.meta.requiresPremium && !userStore.isPremium) {
    return { name: 'pricing' }
  }

  if (to.meta.title && typeof to.meta.title === 'string') {
    document.title = to.meta.title
  }
})

export default router
