import api from './index'
import type { Conversation } from '@/types'

export interface CreateConversationRequest {
  project_id: string
  conversation_type: 'requirement_clarification' | 'tech_selection'
}

export interface SendMessageRequest {
  content: string
}

export interface TechSelectionRequest {
  mode: 'vibe' | 'manual'
  content: string
}

export interface ConversationResponse {
  conversation: Conversation
}

export interface ConversationCreateResponse {
  message: string
  conversation: Conversation
}

export interface ConversationMessageResponse {
  message: string
  conversation: Conversation
  ai_reply: string
}

export interface TechSelectionResponse {
  message: string
  conversation: Conversation
  ai_reply: string
  mode: 'vibe' | 'manual'
}

export interface ConversationCompleteResponse {
  message: string
  conversation: Conversation
  requirement_summary?: string
}

export const conversationApi = {
  // 创建对话
  createConversation: (data: CreateConversationRequest): Promise<ConversationCreateResponse> => {
    return api.post('/conversations', data)
  },

  // 获取对话详情
  getConversation: (id: string): Promise<ConversationResponse> => {
    return api.get(`/conversations/${id}`)
  },

  // 发送消息 - AI请求需要更长超时时间
  sendMessage: (id: string, data: SendMessageRequest): Promise<ConversationMessageResponse> => {
    return api.post(`/conversations/${id}/messages`, data, { timeout: 60000 }) // 60秒超时
  },

  // 技术选型专用接口
  techSelection: (id: string, data: TechSelectionRequest): Promise<TechSelectionResponse> => {
    return api.post(`/conversations/${id}/tech-selection`, data, { timeout: 60000 }) // 60秒超时
  },

  // 完成对话
  completeConversation: (id: string): Promise<ConversationCompleteResponse> => {
    return api.put(`/conversations/${id}/complete`)
  }
}