import api from './index'
import type { Epic, Story, RequirementSplittingSession } from '@/types'

export interface StartSplittingResponse {
  message: string
  session: RequirementSplittingSession
  epic_suggestions: Epic[]
  ai_analysis: any
}

export interface SessionResponse {
  session: RequirementSplittingSession
}

export interface RegenerateEpicsRequest {
  feedback?: string
}

export interface RegenerateEpicsResponse {
  message: string
  epic_suggestions: Epic[]
}

export interface ConfirmEpicsRequest {
  epics: Epic[]
}

export interface ConfirmEpicsResponse {
  message: string
  epics: Epic[]
}

export interface GenerateStoriesResponse {
  message: string
  epic: {
    id: string
    name: string
  }
  story_suggestions: Story[]
}

export interface ConfirmStoriesRequest {
  stories: Story[]
}

export interface ConfirmStoriesResponse {
  message: string
  epic_id: string
  stories: Story[]
}

export interface EpicsListResponse {
  project_id: string
  epics: Epic[]
}

export interface StoriesListResponse {
  epic_id: string
  stories: Story[]
}

export interface EpicResponse {
  epic: Epic
}

export interface StoryResponse {
  story: Story
}

export const requirementSplittingApi = {
  // 开始需求拆分
  startSplitting: (projectId: string): Promise<StartSplittingResponse> => {
    return api.post(`/projects/${projectId}/requirement-splitting/start`)
  },

  // 获取拆分会话
  getSession: (projectId: string): Promise<SessionResponse> => {
    return api.get(`/projects/${projectId}/requirement-splitting/session`)
  },

  // 重新生成Epic建议
  regenerateEpics: (projectId: string, feedback?: string): Promise<RegenerateEpicsResponse> => {
    return api.post(`/requirement-splitting/projects/${projectId}/generate-epics`, { feedback })
  },

  // 确认Epic拆分
  confirmEpics: (projectId: string, epics: Epic[]): Promise<ConfirmEpicsResponse> => {
    return api.post(`/requirement-splitting/projects/${projectId}/confirm-epics`, { epics })
  },

  // 为Epic生成Story建议
  generateStories: (epicId: string): Promise<GenerateStoriesResponse> => {
    return api.post(`/epics/${epicId}/stories/generate`)
  },

  // 确认Story拆分
  confirmStories: (epicId: string, stories: Story[]): Promise<ConfirmStoriesResponse> => {
    return api.put(`/epics/${epicId}/stories/confirm`, { stories })
  },

  // 获取项目Epic列表
  getEpics: (projectId: string): Promise<EpicsListResponse> => {
    return api.get(`/projects/${projectId}/epics`)
  },

  // 获取Epic的Story列表
  getStories: (epicId: string): Promise<StoriesListResponse> => {
    return api.get(`/epics/${epicId}/stories`)
  },

  // 获取Epic详情
  getEpic: (epicId: string): Promise<EpicResponse> => {
    return api.get(`/epics/${epicId}`)
  },

  // 获取Story详情
  getStory: (storyId: string): Promise<StoryResponse> => {
    return api.get(`/stories/${storyId}`)
  },

  // 更新Epic
  updateEpic: (epicId: string, data: Partial<Epic>): Promise<{ message: string; epic: Epic }> => {
    return api.put(`/epics/${epicId}`, data)
  },

  // 更新Story
  updateStory: (storyId: string, data: Partial<Story>): Promise<{ message: string; story: Story }> => {
    return api.put(`/stories/${storyId}`, data)
  },

  // 导出Story为Markdown
  exportStory: (storyId: string): Promise<string> => {
    return api.get(`/stories/${storyId}/export`, { responseType: 'text' })
  },

  // 删除Epic
  deleteEpic: (epicId: string): Promise<{ message: string }> => {
    return api.delete(`/epics/${epicId}`)
  },

  // 删除Story
  deleteStory: (storyId: string): Promise<{ message: string }> => {
    return api.delete(`/stories/${storyId}`)
  }
}