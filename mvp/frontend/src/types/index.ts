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
  current_stage: 'created' | 'clarifying' | 'tech_selecting' | 'tech_selected' | 'requirement_splitting' | 'completed'
  requirement_summary?: string
  tech_stack?: TechStack
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

// 技术选型相关类型
export interface TechChoice {
  category: string
  technology: string
  reason: string
}

export interface TechStackData {
  tech_choices: TechChoice[]
  ai_suggestions?: string
}

export interface TechStack {
  selection_mode: 'user_defined' | 'ai_generated'
  tech_choices: TechChoice[]
  created_at: string
  ai_suggestions: string
}

// 需求拆分相关类型
export interface Epic {
  id?: string
  project_id?: string
  name: string
  description: string
  business_domain?: string
  service_boundary?: string
  dependencies?: string[]
  core_features?: string[]
  technical_requirements?: string[]
  capabilities?: Array<{
    endpoint_prefix: string
    description: string
  }>
  domain_models?: Array<{
    name: string
    fields: string[]
  }>
  integration_contracts?: string[]
  priority?: string | number
  complexity?: string
  status?: 'not_started' | 'in_progress' | 'completed'
  estimated_hours?: number
  created_at?: string
  updated_at?: string
}

export interface Story {
  id?: string
  epic_id?: string
  project_id?: string
  title: string
  user_story: string
  acceptance_criteria?: string[]
  technical_specifications?: string[]
  implementation_notes?: string
  dependencies?: string[]
  test_scenarios?: string[]
  backend_api?: {
    endpoint: string
    request_schema: any
    response_schema: any
    business_rules: string[]
  }
  database_design?: {
    tables: Array<{
      name: string
      fields: string[]
      indexes: string[]
    }>
  }
  frontend_specification?: {
    components: any[]
    routes: any[]
    state_management: any
  }
  mock_contracts?: any
  priority?: string | number
  story_points?: number
  status?: 'not_started' | 'in_progress' | 'completed'
  estimated_hours?: number
  created_at?: string
  updated_at?: string
}

export interface RequirementSplittingSession {
  id: string
  project_id: string
  ai_analysis: {
    project_analysis: string
    tech_considerations: string
    splitting_strategy: string
    generated_at: string
  }
  epic_suggestions: Epic[]
  story_suggestions: Story[]
  user_feedback: Array<{
    type: string
    content: string
    timestamp: string
  }>
  is_completed: boolean
  created_at: string
  updated_at: string
}