import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { authApi } from '@/api/auth'
import type { User, LoginForm, RegisterForm } from '@/types'

export const useAuthStore = defineStore('auth', () => {
  // 状态
  const user = ref<User | null>(null)
  const token = ref<string | null>(null)
  const initialized = ref(false)
  const loading = ref(false)

  // 计算属性
  const isAuthenticated = computed(() => !!token.value && !!user.value)

  // 初始化认证状态
  const initializeAuth = async () => {
    const savedToken = localStorage.getItem('auth_token')
    const savedUser = localStorage.getItem('auth_user')
    
    if (savedToken && savedUser) {
      try {
        token.value = savedToken
        user.value = JSON.parse(savedUser)
      } catch (error) {
        console.error('Failed to parse saved user:', error)
        clearAuth()
      }
    }
    
    initialized.value = true
  }

  // 登录
  const login = async (form: LoginForm) => {
    loading.value = true
    try {
      const response = await authApi.login(form)
      
      if (response.token && response.user) {
        token.value = response.token
        user.value = response.user
        
        // 保存到本地存储
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        
        return { success: true }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Login error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || error.message || '登录失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 注册
  const register = async (form: RegisterForm) => {
    loading.value = true
    try {
      const response = await authApi.register(form)
      
      if (response.token && response.user) {
        token.value = response.token
        user.value = response.user
        
        // 保存到本地存储
        localStorage.setItem('auth_token', response.token)
        localStorage.setItem('auth_user', JSON.stringify(response.user))
        
        return { success: true }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Register error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || error.message || '注册失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 登出
  const logout = () => {
    clearAuth()
    // 跳转到登录页由路由守卫处理
  }

  // 清除认证信息
  const clearAuth = () => {
    user.value = null
    token.value = null
    localStorage.removeItem('auth_token')
    localStorage.removeItem('auth_user')
  }

  // 更新用户信息
  const updateUser = (newUser: User) => {
    user.value = newUser
    localStorage.setItem('auth_user', JSON.stringify(newUser))
  }

  return {
    // 状态
    user,
    token,
    initialized,
    loading,
    
    // 计算属性
    isAuthenticated,
    
    // 方法
    initializeAuth,
    login,
    register,
    logout,
    updateUser
  }
})