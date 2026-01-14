import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import type { User } from '@/types'
import { loginApi } from '@/api/auth'
import { ElMessage } from 'element-plus'

export const useUserStore = defineStore('user', () => {
  const currentUser = ref<User | null>(null)
  const token = ref<string | null>(localStorage.getItem('token'))

  const login = async (username: string, password: string): Promise<void> => {
    try {
      const res = await loginApi({ username, password })
      token.value = res.data.token
      // 如果后端返回 user，直接使用；否则需要 fetch (但 API 目前不支持)
      // 假设后端返回 user
      if (res.data) {
        currentUser.value = res.data
        // 存储用户信息以便持久化 (简单示例)
        localStorage.setItem('user', JSON.stringify(res.data))
      } else {
        // Fallback: 构造一个临时用户或报错
        // 由于没有 /me 接口，我们只能依赖 login 返回
        currentUser.value = {
          id: 0,
          username: username,
          real_name: username, // 暂用 username
          role: 'user', // 默认
        }
      }

      localStorage.setItem('token', res.data.token)
      ElMessage.success('登录成功')
    } catch (error) {
      // 错误已在拦截器处理，但这里可以捕获进行特定逻辑
      throw error
    }
  }

  const logout = async () => {
    // 纯前端退出
    currentUser.value = null
    token.value = null
    localStorage.removeItem('token')
    localStorage.removeItem('user')
    // 可以选择跳转到登录页，通常在组件或路由守卫中处理
  }

  const roleName = computed(() => {
    if (!currentUser.value) return ''
    const role = currentUser.value.role
    if (role === 'Admin') return '管理员'
    if (role === 'Keeper') return '检验员'
    return role // Default fallback
  })

  // Restore user from local storage on init if needed
  const initUser = () => {
    const storedUser = localStorage.getItem('user')
    if (storedUser) {
      try {
        currentUser.value = JSON.parse(storedUser)
      } catch {
        localStorage.removeItem('user')
      }
    }
  }

  // Call init
  initUser()

  return {
    currentUser,
    token,
    roleName,
    login,
    logout,
    // fetchUserInfo, // Removed
  }
})
