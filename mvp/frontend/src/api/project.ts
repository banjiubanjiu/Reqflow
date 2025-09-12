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
  }
}