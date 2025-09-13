import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { requirementSplittingApi } from '@/api/requirementSplitting'
import type { Epic, Story, RequirementSplittingSession } from '@/types'

export const useRequirementSplittingStore = defineStore('requirementSplitting', () => {
  // 状态
  const currentSession = ref<RequirementSplittingSession | null>(null)
  const epics = ref<Epic[]>([])
  const stories = ref<Story[]>([])
  const currentProjectId = ref<string>('')
  const loading = ref(false)
  const currentStep = ref<'epic_suggestion' | 'epic_confirm' | 'story_processing' | 'completed'>('epic_suggestion')
  const currentEpicIndex = ref(0)
  const currentEpicStoryStep = ref<'generating' | 'confirming' | 'completed'>('generating')

  // 计算属性
  const hasSession = computed(() => !!currentSession.value)
  const epicSuggestions = computed(() => currentSession.value?.epic_suggestions || [])
  const storySuggestions = computed(() => currentSession.value?.story_suggestions || [])
  
  // 当前正在处理的Epic
  const currentEpic = computed(() => {
    if (currentStep.value === 'story_processing' && epics.value.length > 0) {
      return epics.value[currentEpicIndex.value] || null
    }
    return null
  })
  
  // Story处理进度
  const storyProgress = computed(() => {
    if (epics.value.length === 0) return { current: 0, total: 0, percentage: 0 }
    
    const completedEpics = currentEpicIndex.value
    const totalEpics = epics.value.length
    const percentage = totalEpics > 0 ? Math.round((completedEpics / totalEpics) * 100) : 0
    
    return {
      current: completedEpics,
      total: totalEpics,
      percentage
    }
  })
  
  const progressSteps = computed(() => [
    { key: 'epic_suggestion', label: 'Epic建议', completed: currentStep.value !== 'epic_suggestion' },
    { key: 'epic_confirm', label: 'Epic确认', completed: ['story_processing', 'completed'].includes(currentStep.value) },
    { key: 'story_processing', label: 'Story拆分', completed: currentStep.value === 'completed' },
    { key: 'completed', label: '完成', completed: currentStep.value === 'completed' }
  ])

  // 开始需求拆分
  const startSplitting = async (projectId: string) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.startSplitting(projectId)
      
      if (response.session && response.epic_suggestions) {
        currentSession.value = response.session
        currentProjectId.value = projectId
        currentStep.value = 'epic_suggestion'
        
        return { success: true, session: response.session }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Start splitting error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '开始需求拆分失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取拆分会话
  const fetchSession = async (projectId: string) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.getSession(projectId)
      
      // 检查response是否是有效对象
      if (!response) {
        console.error('Response is null or undefined')
        throw new Error('Response is null or undefined')
      }
      
      if (typeof response !== 'object') {
        console.error('Response is not an object, got:', typeof response)
        throw new Error('Response is not an object')
      }
      
      if (!('session' in response)) {
        console.error('Response does not have session property, keys:', Object.keys(response))
        throw new Error('Response missing session property')
      }
      
      currentSession.value = response.session
      currentProjectId.value = projectId
      
      // 如果session为null，说明还没有创建拆分会话
      if (!response.session) {
        currentStep.value = 'epic_suggestion'
        return { success: true, session: null, notFound: true }
      }
      
      // 根据会话状态确定当前步骤
      if (response.session.is_completed) {
        currentStep.value = 'completed'
      } else if (epics.value.length > 0) {
        currentStep.value = 'story_processing'
        // 确定当前处理的Epic
        const completedEpics = epics.value.filter(epic => 
          stories.value.some(story => story.epic_id === epic.id)
        )
        currentEpicIndex.value = completedEpics.length
        
        if (currentEpicIndex.value < epics.value.length) {
          currentEpicStoryStep.value = response.session.story_suggestions?.length > 0 ? 'confirming' : 'generating'
        }
      } else {
        currentStep.value = 'epic_suggestion'
      }
      
      return { success: true, session: response.session }
    } catch (error: any) {
      console.error('Fetch session error:', error)
      
      // 如果是404错误，说明没有会话，这是正常的
      if (error.response?.status === 404) {
        return { 
          success: false, 
          message: '没有找到拆分会话',
          notFound: true
        }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.error || '获取拆分会话失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 重新生成Epic建议
  const regenerateEpics = async (feedback?: string) => {
    if (!currentProjectId.value) return { success: false, message: '项目ID不存在' }
    
    loading.value = true
    try {
      const response = await requirementSplittingApi.regenerateEpics(currentProjectId.value, feedback)
      
      if (response.epic_suggestions && currentSession.value) {
        currentSession.value.epic_suggestions = response.epic_suggestions
        return { success: true, suggestions: response.epic_suggestions }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Regenerate epics error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '重新生成Epic失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 确认Epic拆分
  const confirmEpics = async (selectedEpics: Epic[]) => {
    if (!currentProjectId.value) return { success: false, message: '项目ID不存在' }
    
    loading.value = true
    try {
      const response = await requirementSplittingApi.confirmEpics(currentProjectId.value, selectedEpics)
      
      if (response.epics) {
        epics.value = response.epics
        currentStep.value = 'story_processing'
        currentEpicIndex.value = 0
        currentEpicStoryStep.value = 'generating'
        return { success: true, epics: response.epics }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Confirm epics error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '确认Epic失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 为Epic生成Story建议
  const generateStories = async (epicId: string) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.generateStories(epicId)
      
      if (response.story_suggestions && currentSession.value) {
        currentSession.value.story_suggestions = response.story_suggestions
        currentEpicStoryStep.value = 'confirming'
        return { success: true, suggestions: response.story_suggestions }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Generate stories error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '生成Story失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 确认Story拆分
  const confirmStories = async (epicId: string, selectedStories: Story[]) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.confirmStories(epicId, selectedStories)
      
      if (response.stories) {
        stories.value = [...stories.value, ...response.stories]
        
        // 当前Epic完成，移动到下一个Epic
        currentEpicIndex.value++
        
        // 检查是否所有Epic都完成了Story拆分
        if (currentEpicIndex.value >= epics.value.length) {
          currentStep.value = 'completed'
        } else {
          // 重置当前Epic的Story步骤
          currentEpicStoryStep.value = 'generating'
          // 清空story_suggestions为下一个Epic准备
          if (currentSession.value) {
            currentSession.value.story_suggestions = []
          }
        }
        
        return { success: true, stories: response.stories }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Confirm stories error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '确认Story失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取项目的Epic列表
  const fetchEpics = async (projectId: string) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.getEpics(projectId)
      
      if (response && response.epics) {
        epics.value = response.epics
        return { success: true, epics: response.epics }
      } else {
        // 如果没有Epic，设置为空数组
        epics.value = []
        return { success: true, epics: [] }
      }
    } catch (error: any) {
      console.error('Fetch epics error:', error)
      
      // 如果是404错误，说明没有Epic，这是正常的
      if (error.response?.status === 404) {
        epics.value = []
        return { success: true, epics: [] }
      }
      
      return { 
        success: false, 
        message: error.response?.data?.error || '获取Epic列表失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 获取Epic的Story列表
  const fetchStories = async (epicId: string) => {
    loading.value = true
    try {
      const response = await requirementSplittingApi.getStories(epicId)
      
      if (response.stories) {
        // 更新或添加stories
        response.stories.forEach(story => {
          const existingIndex = stories.value.findIndex(s => s.id === story.id)
          if (existingIndex >= 0) {
            stories.value[existingIndex] = story
          } else {
            stories.value.push(story)
          }
        })
        
        return { success: true, stories: response.stories }
      } else {
        throw new Error('Invalid response format')
      }
    } catch (error: any) {
      console.error('Fetch stories error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '获取Story列表失败' 
      }
    } finally {
      loading.value = false
    }
  }

  // 导出Story文档
  const exportStory = async (storyId: string) => {
    try {
      const response = await requirementSplittingApi.exportStory(storyId)
      
      // 创建下载链接
      const blob = new Blob([response], { type: 'text/markdown' })
      const url = window.URL.createObjectURL(blob)
      const link = document.createElement('a')
      link.href = url
      
      // 获取Story标题作为文件名
      const story = stories.value.find(s => s.id === storyId)
      const filename = story ? `story-${story.title.replace(/[^a-zA-Z0-9]/g, '-')}.md` : `story-${storyId}.md`
      link.download = filename
      
      document.body.appendChild(link)
      link.click()
      document.body.removeChild(link)
      window.URL.revokeObjectURL(url)
      
      return { success: true }
    } catch (error: any) {
      console.error('Export story error:', error)
      return { 
        success: false, 
        message: error.response?.data?.error || '导出Story失败' 
      }
    }
  }

  // 跳过当前Epic
  const skipCurrentEpic = () => {
    if (currentStep.value === 'story_processing' && currentEpicIndex.value < epics.value.length) {
      currentEpicIndex.value++
      
      if (currentEpicIndex.value >= epics.value.length) {
        currentStep.value = 'completed'
      } else {
        currentEpicStoryStep.value = 'generating'
        if (currentSession.value) {
          currentSession.value.story_suggestions = []
        }
      }
    }
  }

  // 返回上一个Epic
  const goToPreviousEpic = () => {
    if (currentStep.value === 'story_processing' && currentEpicIndex.value > 0) {
      currentEpicIndex.value--
      currentEpicStoryStep.value = 'generating'
      if (currentSession.value) {
        currentSession.value.story_suggestions = []
      }
    }
  }

  // 清除状态
  const clearState = () => {
    currentSession.value = null
    epics.value = []
    stories.value = []
    currentProjectId.value = ''
    currentStep.value = 'epic_suggestion'
    currentEpicIndex.value = 0
    currentEpicStoryStep.value = 'generating'
  }

  // 设置当前步骤
  const setCurrentStep = (step: typeof currentStep.value) => {
    currentStep.value = step
  }

  return {
    // 状态
    currentSession,
    epics,
    stories,
    currentProjectId,
    loading,
    currentStep,
    currentEpicIndex,
    currentEpicStoryStep,
    
    // 计算属性
    hasSession,
    epicSuggestions,
    storySuggestions,
    progressSteps,
    currentEpic,
    storyProgress,
    
    // 方法
    startSplitting,
    fetchSession,
    regenerateEpics,
    confirmEpics,
    generateStories,
    confirmStories,
    fetchEpics,
    fetchStories,
    exportStory,
    skipCurrentEpic,
    goToPreviousEpic,
    clearState,
    setCurrentStep
  }
})