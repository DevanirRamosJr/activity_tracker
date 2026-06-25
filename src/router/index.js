import { createRouter, createWebHashHistory } from 'vue-router'
import { useAuth } from '../composables/useAuth'
import LoginView from '../views/LoginView.vue'
import ListView from '../views/ListView.vue'
import DrawView from '../views/DrawView.vue'

const routes = [
  { path: '/login', name: 'Login', component: LoginView },
  { path: '/', name: 'List', component: ListView, meta: { requiresAuth: true } },
  { path: '/draw', name: 'Draw', component: DrawView, meta: { requiresAuth: true } },
]

const router = createRouter({
  history: createWebHashHistory(),
  routes,
})

router.beforeEach((to) => {
  const { isAuthenticated } = useAuth()
  if (to.meta.requiresAuth && !isAuthenticated.value) {
    return { name: 'Login' }
  }
  if (to.name === 'Login' && isAuthenticated.value) {
    return { name: 'List' }
  }
})

export default router
