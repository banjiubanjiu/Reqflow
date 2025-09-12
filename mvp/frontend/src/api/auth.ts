import api from './index'
import type { LoginForm, RegisterForm, User } from '@/types'

export interface AuthResponse {
  message: string
  token: string
  user: User
}

export const authApi = {
  // 用户登录
  login: (data: LoginForm): Promise<AuthResponse> => {
    return api.post('/auth/login', data)
  },

  // 用户注册
  register: (data: RegisterForm): Promise<AuthResponse> => {
    return api.post('/auth/register', data)
  }
}