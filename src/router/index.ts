import { createRouter, createWebHistory } from 'vue-router'
import { useUserStore } from '@/stores/user'

const router = createRouter({
  history: createWebHistory(import.meta.env.BASE_URL),
  routes: [
    {
      path: '/login',
      name: 'login',
      component: () => import('../views/LoginView.vue'),
    },
    {
      path: '/',
      component: () => import('../layout/MainLayout.vue'),
      children: [
        {
          path: '',
          redirect: '/dashboard',
        },
        {
          path: 'dashboard',
          name: 'dashboard',
          component: () => import('../views/DashboardView.vue'),
          meta: { title: '效期预警看板' },
        },
        {
          path: 'inventory',
          name: 'inventory',
          component: () => import('../views/InventoryView.vue'),
          meta: { title: '库存总表' },
        },
        {
          path: 'material',
          name: 'material',
          component: () => import('../views/MaterialView.vue'),
          meta: { title: '物料管理' },
        },
        {
          path: 'approval',
          name: 'approval',
          component: () => import('../views/ApprovalView.vue'),
          meta: { title: '审批管理', roles: ['Admin'] },
        },
        {
          path: 'outbound',
          name: 'outbound',
          component: () => import('../views/ConsumptionHistoryView.vue'),
          meta: { title: '全部领用记录' },
        },
      ],
    },
  ],
})

router.beforeEach((to, from, next) => {
  const userStore = useUserStore()

  // 1. 检查是否登录
  if (to.name !== 'login' && !userStore.currentUser) {
    next({ name: 'login' })
    return
  }

  // 2. 检查权限
  if (to.meta.roles && Array.isArray(to.meta.roles)) {
    const roles = to.meta.roles as string[]
    const userRole = userStore.currentUser?.role || ''
    if (!roles.includes(userRole)) {
      // 无权限，重定向到首页或提示
      next({ name: 'dashboard' }) // 或者显示 403 页面
      return
    }
  }

  next()
})

export default router
