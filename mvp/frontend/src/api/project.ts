import api from './index'
import type { Project, CreateProjectForm } from '@/types'

export interface ProjectListResponse {
  projects: Project[]
}

export interface ProjectResponse {
  project: Project
}

export interface ProjectCreateResponse {
  message: string
  project: Project
}

export interface ProjectUpdateResponse {
  message: string
  project: Project
}

export interface ProjectDeleteResponse {
  message: string
}

export interface ProjectNameSuggestion {
  name: string
  reason: string
}

export interface GenerateNamesRequest {
  description: string
}

export interface GenerateNamesResponse {
  suggestions: ProjectNameSuggestion[]
}

export const projectApi = {
  // 获取项目列表
  getProjects: (): Promise<ProjectListResponse> => {
    return api.get('/projects')
  },

  // 创建项目
  createProject: (data: CreateProjectForm): Promise<ProjectCreateResponse> => {
    return api.post('/projects', data)
  },

  // 获取项目详情
  getProject: (id: string): Promise<ProjectResponse> => {
    return api.get(`/projects/${id}`)
  },

  // 更新项目
  updateProject: (id: string, data: Partial<Project>): Promise<ProjectUpdateResponse> => {
    return api.put(`/projects/${id}`, data)
  },

  // 删除项目
  deleteProject: (id: string): Promise<ProjectDeleteResponse> => {
    return api.delete(`/projects/${id}`)
  },

  // AI生成项目名称建议
  generateProjectNames: (data: GenerateNamesRequest): Promise<GenerateNamesResponse> => {
    return api.post('/projects/generate-names', data)
  },

  // 完成技术选型
  completeTechSelection: (id: string, techStack: any): Promise<{ message: string; project: Project }> => {
    return api.post(`/projects/${id}/tech-selection`, { tech_stack: techStack })
  }
}