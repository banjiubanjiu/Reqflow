// 用户类型
export interface User {
  id: string
  email: string
  name?: string
  avatar_url?: string
  created_at: string
  updated_at: string
}

// 项目类型
export interface Project {
  id: string
  user_id: string
  name: string
  description?: string
  current_stage: 'created' | 'clarifying' | 'tech_selecting' | 'requirement_splitting' | 'completed'
  requirement_summary?: string
  tech_stack?: Record<string, any>
  created_at: string
  updated_at: string
  ai_conversations?: Conversation[]
}

// 对话类型
export interface Conversation {
  id: string
  project_id: string
  conversation_type: 'requirement_clarification' | 'tech_selection'
  messages: Message[]
  is_completed: boolean
  created_at: string
  updated_at: string
}

// 消息类型
export interface Message {
  role: 'user' | 'ai' | 'assistant'
  content: string
  timestamp: string
}

// API响应类型
export interface ApiResponse<T = any> {
  data?: T
  message?: string
  error?: string
}

// 分页类型
export interface Pagination {
  page: number
  limit: number
  total: number
}

// 登录表单
export interface LoginForm {
  email: string
  password: string
}

// 注册表单
export interface RegisterForm {
  email: string
  password: string
  name?: string
}

// 创建项目表单
export interface CreateProjectForm {
  name: string
  description?: string
}