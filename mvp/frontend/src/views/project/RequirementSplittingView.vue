<template>
  <div class="requirement-splitting-container">
    <!-- 顶部导航 -->
    <div class="splitting-header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回项目
          </el-button>
          <div class="page-info">
            <h1>需求拆分</h1>
            <span class="project-name">{{ projectStore.currentProject?.name }}</span>
          </div>
        </div>
        <div class="header-right">
          <el-button 
            v-if="splittingStore.currentStep === 'completed'"
            type="success"
            @click="handleViewResults"
          >
            <el-icon><View /></el-icon>
            查看结果
          </el-button>
        </div>
      </div>
    </div>

    <!-- 进度指示器 -->
    <div class="progress-section">
      <SplittingProgress 
        :steps="splittingStore.progressSteps"
        :current-step="splittingStore.currentStep"
      />
    </div>

    <!-- 主体内容 -->
    <div class="splitting-main">
      <div class="main-content">
        <!-- 加载状态 -->
        <div v-if="splittingStore.loading && !splittingStore.hasSession" class="loading-container">
          <el-skeleton :rows="5" animated />
          <div class="loading-text">
            <div>AI正在分析项目需求和技术选型...</div>
            <div class="loading-tips">这是一个复杂的AI任务，通常需要1-2分钟，请耐心等待</div>
          </div>
        </div>

        <!-- Epic建议阶段 -->
        <div v-else-if="splittingStore.currentStep === 'epic_suggestion'" class="epic-suggestion-stage">
          <div class="stage-header">
            <h2>Epic拆分建议</h2>
            <p>AI基于您的需求总结和技术选型，识别出以下业务服务边界：</p>
          </div>

          <div class="ai-analysis" v-if="splittingStore.currentSession?.ai_analysis">
            <el-alert
              :title="splittingStore.currentSession.ai_analysis.project_analysis"
              type="info"
              :closable="false"
              show-icon
            />
          </div>

          <div class="epic-suggestions-grid">
            <EpicSuggestionCard
              v-for="(epic, index) in splittingStore.epicSuggestions"
              :key="index"
              :epic="epic"
              :selected="selectedEpics.includes(epic)"
              @toggle="handleToggleEpic"
            />
          </div>

          <div class="stage-actions">
            <el-button @click="handleRegenerateEpics">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
            <el-button 
              type="primary"
              :disabled="selectedEpics.length === 0"
              @click="handleConfirmEpics"
              :loading="splittingStore.loading"
            >
              确认选择 ({{ selectedEpics.length }})
            </el-button>
          </div>
        </div>

        <!-- Story处理阶段 -->
        <div v-else-if="splittingStore.currentStep === 'story_processing'" class="story-processing-stage">
          <!-- 进度显示 -->
          <div class="story-progress-section">
            <div class="progress-header">
              <h2>Story拆分进度</h2>
              <div class="progress-info">
                <span>{{ splittingStore.storyProgress.current }} / {{ splittingStore.storyProgress.total }} Epic已完成</span>
                <el-progress 
                  :percentage="splittingStore.storyProgress.percentage" 
                  :stroke-width="8"
                  :show-text="false"
                />
              </div>
            </div>
          </div>

          <!-- 当前Epic信息 -->
          <div v-if="splittingStore.currentEpic" class="current-epic-section">
            <div class="epic-card">
              <div class="epic-header">
                <div class="epic-info">
                  <h3>{{ splittingStore.currentEpic.name }}</h3>
                  <p class="epic-description">{{ splittingStore.currentEpic.description }}</p>
                </div>
                <div class="epic-meta">
                  <el-tag size="small" type="info">{{ splittingStore.currentEpic.business_domain }}</el-tag>
                  <el-tag size="small" :type="getPriorityType(splittingStore.currentEpic.priority)">
                    {{ splittingStore.currentEpic.priority }}
                  </el-tag>
                </div>
              </div>
            </div>
          </div>

          <!-- Story生成阶段 -->
          <div v-if="splittingStore.currentEpicStoryStep === 'generating'" class="story-generation-content">
            <div class="stage-header">
              <h3>为当前Epic生成Story</h3>
              <p>AI将基于Epic的描述和技术要求生成具体的用户故事</p>
            </div>

            <div class="generation-actions">
              <el-button 
                type="primary"
                size="large"
                @click="handleGenerateCurrentEpicStories"
                :loading="splittingStore.loading"
              >
                <el-icon><Star /></el-icon>
                生成Story建议
              </el-button>
              
              <div class="action-buttons">
                <el-button 
                  v-if="splittingStore.currentEpicIndex > 0"
                  @click="handlePreviousEpic"
                >
                  <el-icon><ArrowLeft /></el-icon>
                  上一个Epic
                </el-button>
                <el-button @click="handleSkipCurrentEpic">
                  跳过此Epic
                </el-button>
              </div>
            </div>
          </div>

          <!-- Story确认阶段 -->
          <div v-else-if="splittingStore.currentEpicStoryStep === 'confirming'" class="story-confirm-content">
            <div class="stage-header">
              <h3>确认Story建议</h3>
              <p>请选择需要的Story，可以修改或跳过不需要的Story</p>
            </div>

            <div class="story-suggestions-grid">
              <StorySuggestionCard
                v-for="(story, index) in splittingStore.storySuggestions"
                :key="index"
                :story="story"
                :selected="selectedStories.includes(story)"
                @toggle="handleToggleStory"
                @view-detail="handleViewStoryDetail"
              />
            </div>

            <div class="confirm-actions">
              <div class="action-buttons">
                <el-button @click="handleRegenerateCurrentEpicStories">
                  <el-icon><Refresh /></el-icon>
                  重新生成
                </el-button>
                <el-button 
                  v-if="splittingStore.currentEpicIndex > 0"
                  @click="handlePreviousEpic"
                >
                  <el-icon><ArrowLeft /></el-icon>
                  上一个Epic
                </el-button>
                <el-button @click="handleSkipCurrentEpic">
                  跳过此Epic
                </el-button>
              </div>
              
              <el-button 
                type="primary"
                size="large"
                :disabled="selectedStories.length === 0"
                @click="handleConfirmCurrentEpicStories"
                :loading="splittingStore.loading"
              >
                确认选择 ({{ selectedStories.length }})
                <el-icon><ArrowRight /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 完成阶段 -->
        <div v-else-if="splittingStore.currentStep === 'completed'" class="completed-stage">
          <div class="completion-banner">
            <el-result
              icon="success"
              title="需求拆分完成！"
              sub-title="AI已成功将您的项目需求拆分为Epic和Story，可以开始开发了"
            >
              <template #extra>
                <el-button type="primary" @click="handleViewResults">
                  查看拆分结果
                </el-button>
                <el-button @click="handleExportAll">
                  导出所有文档
                </el-button>
              </template>
            </el-result>
          </div>

          <div class="results-summary">
            <div class="summary-stats">
              <div class="stat-item">
                <div class="stat-number">{{ splittingStore.epics.length }}</div>
                <div class="stat-label">Epic</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ splittingStore.stories.length }}</div>
                <div class="stat-label">Story</div>
              </div>
              <div class="stat-item">
                <div class="stat-number">{{ totalEstimatedHours }}</div>
                <div class="stat-label">预估工时</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="error-container">
          <el-result 
            icon="warning" 
            title="加载失败" 
            sub-title="无法获取需求拆分信息，请刷新页面重试"
          >
            <template #extra>
              <el-button type="primary" @click="initializeSplitting">重新加载</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <!-- Epic确认对话框 -->
    <EpicConfirmDialog
      v-model="showEpicConfirmDialog"
      :epics="selectedEpics"
      @confirm="handleEpicConfirmDialogConfirm"
    />

    <!-- Story详情模态框 -->
    <StoryDetailModal
      v-model="showStoryDetailModal"
      :story="selectedStoryForDetail"
    />

    <!-- 重新生成Epic对话框 -->
    <el-dialog
      v-model="showRegenerateDialog"
      title="重新生成Epic建议"
      width="500px"
    >
      <el-form>
        <el-form-item label="反馈意见">
          <el-input
            v-model="regenerateFeedback"
            type="textarea"
            :rows="4"
            placeholder="请描述您希望AI如何调整Epic拆分建议..."
          />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showRegenerateDialog = false">取消</el-button>
        <el-button 
          type="primary" 
          @click="handleRegenerateConfirm"
          :loading="splittingStore.loading"
        >
          重新生成
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted, onUnmounted, nextTick, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, ArrowRight, Refresh, View, Star } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useRequirementSplittingStore } from '@/stores/requirementSplitting'
import SplittingProgress from '@/components/business/SplittingProgress.vue'
import EpicSuggestionCard from '@/components/business/EpicSuggestionCard.vue'
import EpicConfirmDialog from '@/components/business/EpicConfirmDialog.vue'
import StorySuggestionCard from '@/components/business/StorySuggestionCard.vue'
import StoryDetailModal from '@/components/business/StoryDetailModal.vue'
import type { Epic, Story } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const splittingStore = useRequirementSplittingStore()

// 路由参数
const projectId = computed(() => route.params.id as string)

// 组件状态
const selectedEpics = ref<Epic[]>([])
const selectedStories = ref<Story[]>([])
const showEpicConfirmDialog = ref(false)
const showStoryDetailModal = ref(false)
const selectedStoryForDetail = ref<Story | null>(null)
const showRegenerateDialog = ref(false)
const regenerateFeedback = ref('')

// 计算属性
const totalEstimatedHours = computed(() => {
  return splittingStore.stories.reduce((total, story) => {
    return total + (story.estimated_hours || 0)
  }, 0)
})

// 方法
const initializeSplitting = async () => {
  if (!projectId.value) {
    ElMessage.error('项目ID缺失，请重新进入页面')
    router.push('/home')
    return
  }

  // 先加载项目信息
  const projectResult = await projectStore.fetchProject(projectId.value)
  if (!projectResult.success) {
    ElMessage.error(projectResult.message || '加载项目信息失败')
    return
  }

  // 检查项目是否可以进行需求拆分
  const project = projectStore.currentProject
  if (!project?.requirement_summary || !project?.tech_stack) {
    ElMessage.error('项目需要先完成需求澄清和技术选型才能进行需求拆分')
    router.push(`/project/${projectId.value}`)
    return
  }

  // 尝试获取现有会话
  const sessionResult = await splittingStore.fetchSession(projectId.value)
  
  if (!sessionResult.success && !sessionResult.notFound) {
    ElMessage.error(sessionResult.message || '获取拆分会话失败')
    return
  }
  
  if (!sessionResult.success || sessionResult.notFound) {
    // 没有会话，开始新的拆分
    const startResult = await splittingStore.startSplitting(projectId.value)
    if (!startResult.success) {
      ElMessage.error(startResult.message || '开始需求拆分失败')
      return
    }
  }

  // 如果已有Epic，加载Epic列表
  if (splittingStore.currentStep !== 'epic_suggestion') {
    const epicsResult = await splittingStore.fetchEpics(projectId.value)
    if (!epicsResult.success) {
      ElMessage.error(epicsResult.message || '加载Epic列表失败')
    }
  }
}

const handleToggleEpic = (epic: Epic) => {
  const index = selectedEpics.value.findIndex(e => e.name === epic.name)
  if (index >= 0) {
    selectedEpics.value.splice(index, 1)
  } else {
    selectedEpics.value.push(epic)
  }
}

const handleRegenerateEpics = () => {
  showRegenerateDialog.value = true
  regenerateFeedback.value = ''
}

const handleRegenerateConfirm = async () => {
  const result = await splittingStore.regenerateEpics(regenerateFeedback.value)
  
  if (result.success) {
    ElMessage.success('Epic建议重新生成成功')
    selectedEpics.value = []
  } else {
    ElMessage.error(result.message || '重新生成失败')
  }
  
  showRegenerateDialog.value = false
}

const handleConfirmEpics = () => {
  showEpicConfirmDialog.value = true
}

const handleEpicConfirmDialogConfirm = async (epics: Epic[]) => {
  const result = await splittingStore.confirmEpics(epics)
  
  if (result.success) {
    ElMessage.success('Epic确认成功')
    selectedEpics.value = []
  } else {
    ElMessage.error(result.message || 'Epic确认失败')
  }
  
  showEpicConfirmDialog.value = false
}

const handleGenerateCurrentEpicStories = async () => {
  const currentEpic = splittingStore.currentEpic
  if (!currentEpic?.id) {
    ElMessage.error('当前Epic信息不存在')
    return
  }
  
  const result = await splittingStore.generateStories(currentEpic.id)
  
  if (result.success) {
    ElMessage.success('Story建议生成成功')
  } else {
    ElMessage.error(result.message || 'Story生成失败')
  }
}

const handleRegenerateCurrentEpicStories = async () => {
  // 重置到生成阶段，然后重新生成
  splittingStore.currentEpicStoryStep = 'generating'
  selectedStories.value = []
  
  // 清空当前的story建议
  if (splittingStore.currentSession) {
    splittingStore.currentSession.story_suggestions = []
  }
  
  await handleGenerateCurrentEpicStories()
}

const handleToggleStory = (story: Story) => {
  const index = selectedStories.value.findIndex(s => s.title === story.title)
  if (index >= 0) {
    selectedStories.value.splice(index, 1)
  } else {
    selectedStories.value.push(story)
  }
}

const handleViewStoryDetail = (story: Story) => {
  selectedStoryForDetail.value = story
  showStoryDetailModal.value = true
}

const handleConfirmCurrentEpicStories = async () => {
  const currentEpic = splittingStore.currentEpic
  if (!currentEpic?.id) {
    ElMessage.error('当前Epic信息不存在')
    return
  }
  
  const result = await splittingStore.confirmStories(currentEpic.id, selectedStories.value)
  
  if (result.success) {
    ElMessage.success(`Epic "${currentEpic.name}" 的Story确认成功`)
    selectedStories.value = []
    
    // 如果还有更多Epic，提示用户
    if (splittingStore.currentEpicIndex < splittingStore.epics.length - 1) {
      ElMessage.info('继续处理下一个Epic')
    }
  } else {
    ElMessage.error(result.message || 'Story确认失败')
  }
}

const handleSkipCurrentEpic = () => {
  const currentEpic = splittingStore.currentEpic
  if (currentEpic) {
    ElMessageBox.confirm(
      `确定要跳过Epic "${currentEpic.name}" 吗？跳过后可以稍后回来处理。`,
      '跳过Epic',
      {
        confirmButtonText: '跳过',
        cancelButtonText: '取消',
        type: 'warning'
      }
    ).then(() => {
      splittingStore.skipCurrentEpic()
      selectedStories.value = []
      
      if (splittingStore.currentStep === 'completed') {
        ElMessage.success('所有Epic处理完成！')
      }
    }).catch(() => {
      // 用户取消
    })
  }
}

const handlePreviousEpic = () => {
  splittingStore.goToPreviousEpic()
  selectedStories.value = []
}

const handleViewResults = () => {
  router.push(`/project/${projectId.value}/results`)
}

const handleExportAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要导出所有 ${splittingStore.stories.length} 个Story的文档吗？`,
      '批量导出',
      {
        confirmButtonText: '确定导出',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 逐个导出Story
    for (const story of splittingStore.stories) {
      const result = await splittingStore.exportStory(story.id)
      if (!result.success) {
        ElMessage.error(`导出Story "${story.title}" 失败: ${result.message}`)
        break
      }
    }

    ElMessage.success('所有Story文档导出成功')
  } catch (error) {
    // 用户取消
  }
}

const getPriorityType = (priority: string | number) => {
  const p = String(priority || '').toLowerCase()
  switch (p) {
    case 'high':
    case '高':
    case '3':
      return 'danger'
    case 'medium':
    case '中':
    case '2':
      return 'warning'
    case 'low':
    case '低':
    case '1':
      return 'info'
    default:
      return ''
  }
}

// 监听路由参数变化
watch(() => route.params.id, (newId) => {
  if (newId) {
    initializeSplitting()
  }
}, { immediate: true })

// 页面初始化
onMounted(async () => {
  // 如果路由参数已经存在，直接初始化
  if (projectId.value) {
    initializeSplitting()
  }
})

// 页面卸载时清理状态
onUnmounted(() => {
  splittingStore.clearState()
})
</script>

<style scoped>
.requirement-splitting-container {
  min-height: 100vh;
  background-color: var(--bg-color-page);
}

.splitting-header {
  background: white;
  border-bottom: 1px solid var(--border-color-lighter);
  padding: 16px 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  align-items: center;
  justify-content: space-between;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 16px;
}

.page-info h1 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: var(--color-text-primary);
}

.project-name {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.progress-section {
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.splitting-main {
  padding: 24px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.loading-container {
  text-align: center;
  padding: 60px 20px;
}

.loading-text {
  margin-top: 16px;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.stage-header {
  margin-bottom: 24px;
  text-align: center;
}

.stage-header h2 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: var(--color-text-primary);
}

.stage-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 16px;
}

.ai-analysis {
  margin-bottom: 24px;
}

.epic-suggestions-grid,
.story-suggestions-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(400px, 1fr));
  gap: 20px;
  margin-bottom: 32px;
}

.epics-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
  margin-bottom: 32px;
}

.epic-item {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color-lighter);
}

.epic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.epic-header h3 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.epic-description {
  margin: 0;
  color: var(--color-text-secondary);
  line-height: 1.5;
}

.stage-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  padding: 24px 0;
}

/* Story处理阶段样式 */
.story-processing-stage {
  display: flex;
  flex-direction: column;
  gap: 24px;
}

.story-progress-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color-lighter);
}

.progress-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  gap: 20px;
}

.progress-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.progress-info {
  display: flex;
  align-items: center;
  gap: 12px;
  min-width: 300px;
}

.progress-info span {
  font-size: 14px;
  color: var(--color-text-secondary);
  white-space: nowrap;
}

.current-epic-section {
  background: white;
  border-radius: 8px;
  padding: 20px;
  border: 1px solid var(--border-color-lighter);
}

.epic-card {
  border: 2px solid var(--color-primary);
  border-radius: 8px;
  padding: 16px;
  background: var(--color-primary-light-9);
}

.epic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  gap: 16px;
}

.epic-info h3 {
  margin: 0 0 8px 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.epic-description {
  margin: 0;
  color: var(--color-text-regular);
  line-height: 1.5;
}

.epic-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.story-generation-content,
.story-confirm-content {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color-lighter);
}

.story-generation-content .stage-header,
.story-confirm-content .stage-header {
  text-align: center;
  margin-bottom: 24px;
}

.story-generation-content h3,
.story-confirm-content h3 {
  margin: 0 0 8px 0;
  font-size: 20px;
  color: var(--color-text-primary);
}

.generation-actions {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 24px;
}

.confirm-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 24px;
  gap: 16px;
}

.action-buttons {
  display: flex;
  gap: 12px;
}

.completion-banner {
  margin-bottom: 32px;
}

.results-summary {
  background: white;
  border-radius: 8px;
  padding: 24px;
  border: 1px solid var(--border-color-lighter);
}

.summary-stats {
  display: flex;
  justify-content: center;
  gap: 48px;
}

.stat-item {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.error-container {
  padding: 60px 20px;
  text-align: center;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .epic-suggestions-grid,
  .story-suggestions-grid {
    grid-template-columns: 1fr;
  }
  
  .summary-stats {
    flex-direction: column;
    gap: 24px;
  }
  
  .stage-actions {
    flex-direction: column;
    align-items: center;
  }
}
</style>