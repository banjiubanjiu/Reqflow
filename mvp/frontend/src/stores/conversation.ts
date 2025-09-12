import { defineStore } from 'pinia'
import { ref } from 'vue'
import { conversationApi } from '@/api/conversation'
import type { Conversation } from '@/types'

export const useConversationStore = defineStore('conversation', () => {
  // 状态
  const currentConversation = ref<Conversation | null>(null)
  const loading = ref(false)
  const sendingMessage = ref(false)

  // 创建对话
  const createConversation = async (projectId: string, type: 'requirement_clarification' | 'tech_selection') => {
    loading.value = true
    try {
      const response = await conversationApi.createConversation({
        project_id: projectId,
        conversation_type: type
      })
      
      if (response.conversation) {
        currentConversation.value = response.conversation
        return { success: true, conversation: response.conversation }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Create conversation error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '创建对话失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取对话详情
  const fetchConversation = async (id: string) => {
    loading.value = true
    try {
      const response = await conversationApi.getConversation(id)
      currentConversation.value = response.conversation
      return { success: true, conversation: response.conversation }
    } catch (error: any) {
      console.error('Fetch conversation error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '获取对话失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 发送消息
  const sendMessage = async (conversationId: string, content: string) => {
    sendingMessage.value = true
    try {
      const response = await conversationApi.sendMessage(conversationId, { content })
      
      if (response.conversation) {
        currentConversation.value = response.conversation
        return { success: true, aiReply: response.ai_reply }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Send message error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || error.response?.data?.details || '发送消息失败' 
      }
    } finally {
      sendingMessage.value = false
    }
  }

  // 完成对话
  const completeConversation = async (conversationId: string) => {
    loading.value = true
    try {
      const response = await conversationApi.completeConversation(conversationId)
      
      if (response.conversation && currentConversation.value) {
        currentConversation.value = response.conversation
        return { 
          success: true, 
          requirementSummary: response.requirement_summary 
        }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Complete conversation error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '完成对话失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 清除对话状态
  const clearConversation = () => {
    currentConversation.value = null
  }

  return {
    // 状态
    currentConversation,
    loading,
    sendingMessage,
    
    // 方法
    createConversation,
    fetchConversation,
    sendMessage,
    completeConversation,
    clearConversation
  }
})