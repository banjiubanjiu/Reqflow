import { defineStore } from 'pinia'
import { ref } from 'vue'
import { projectApi } from '@/api/project'
import type { Project, CreateProjectForm } from '@/types'

export const useProjectStore = defineStore('project', () => {
  // 状态
  const projects = ref<Project[]>([])
  const currentProject = ref<Project | null>(null)
  const loading = ref(false)

  // 获取项目列表
  const fetchProjects = async () => {
    loading.value = true
    try {
      const response = await projectApi.getProjects()
      projects.value = response.projects || []
      return { success: true }
    } catch (error: any) {
      console.error('Fetch projects error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '获取项目列表失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 创建项目
  const createProject = async (form: CreateProjectForm) => {
    loading.value = true
    try {
      const response = await projectApi.createProject(form)
      if (response.project) {
        projects.value.unshift(response.project)
        return { success: true, project: response.project }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Create project error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '创建项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取项目详情
  const fetchProject = async (id: string) => {
    loading.value = true
    try {
      const response = await projectApi.getProject(id)
      currentProject.value = response.project
      return { success: true, project: response.project }
    } catch (error: any) {
      console.error('Fetch project error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '获取项目详情失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 更新项目
  const updateProject = async (id: string, data: Partial<Project>) => {
    loading.value = true
    try {
      const response = await projectApi.updateProject(id, data)
      if (response.project) {
        // 更新列表中的项目
        const index = projects.value.findIndex(p => p.id === id)
        if (index !== -1) {
          projects.value[index] = response.project
        }
        
        // 更新当前项目
        if (currentProject.value?.id === id) {
          currentProject.value = response.project
        }
        
        return { success: true, project: response.project }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Update project error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '更新项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 删除项目
  const deleteProject = async (id: string) => {
    loading.value = true
    try {
      await projectApi.deleteProject(id)
      
      // 从列表中移除
      projects.value = projects.value.filter(p => p.id !== id)
      
      // 清除当前项目
      if (currentProject.value?.id === id) {
        currentProject.value = null
      }
      
      return { success: true }
    } catch (error: any) {
      console.error('Delete project error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '删除项目失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 完成技术选型
  const completeTechSelection = async (id: string, techStack: any) => {
    loading.value = true
    try {
      const response = await projectApi.completeTechSelection(id, techStack)
      
      // 更新当前项目
      if (currentProject.value?.id === id) {
        currentProject.value = response.project
      }
      
      // 更新项目列表中的项目
      const index = projects.value.findIndex(p => p.id === id)
      if (index >= 0) {
        projects.value[index] = response.project
      }
      
      return { success: true, project: response.project }
    } catch (error: any) {
      console.error('Complete tech selection error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '完成技术选型失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 清除状态
  const clearProjects = () => {
    projects.value = []
    currentProject.value = null
  }

  return {
    // 状态
    projects,
    currentProject,
    loading,
    
    // 方法
    fetchProjects,
    createProject,
    fetchProject,
    updateProject,
    deleteProject,
    completeTechSelection,
    clearProjects
  }
})