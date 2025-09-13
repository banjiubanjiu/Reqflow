<template>
  <div class="project-detail-container">
    <!-- 加载状态 -->
    <div v-if="projectStore.loading" class="loading-container">
      <el-skeleton :rows="8" animated />
    </div>

    <!-- 项目详情 -->
    <div v-else-if="project" class="project-detail">
      <!-- 项目头部 -->
      <div class="project-header">
        <div class="header-content">
          <div class="header-left">
            <el-button text @click="$router.push('/home')">
              <el-icon><ArrowLeft /></el-icon>
              返回项目列表
            </el-button>
            <div class="project-info">
              <h1>{{ project.name }}</h1>
              <el-tag :type="stageConfig.type" size="small">
                {{ stageConfig.label }}
              </el-tag>
            </div>
          </div>
          <div class="header-actions">
            <el-button @click="handleEdit">
              <el-icon><Edit /></el-icon>
              编辑项目
            </el-button>
            <el-button type="danger" @click="handleDelete">
              <el-icon><Delete /></el-icon>
              删除项目
            </el-button>
          </div>
        </div>
      </div>

      <!-- 项目内容 -->
      <div class="project-content">
        <div class="content-grid">
          <!-- 基本信息 -->
          <div class="info-section">
            <h2>项目信息</h2>
            <div class="info-card">
              <div class="info-item">
                <label>项目描述：</label>
                <p>{{ project.description || '暂无描述' }}</p>
              </div>
              <div class="info-item">
                <label>创建时间：</label>
                <p>{{ formatDate(project.created_at) }}</p>
              </div>
              <div class="info-item">
                <label>更新时间：</label>
                <p>{{ formatDate(project.updated_at) }}</p>
              </div>
            </div>
          </div>

          <!-- 需求总结 -->
          <div v-if="project.requirement_summary" class="info-section">
            <h2>需求总结</h2>
            <div class="info-card">
              <p class="requirement-text">{{ project.requirement_summary }}</p>
            </div>
          </div>

          <!-- 技术栈 -->
          <div v-if="project.tech_stack" class="info-section">
            <h2>技术选型</h2>
            <TechStackDisplay :tech-stack="project.tech_stack" />
          </div>

          <!-- 对话历史 -->
          <div class="conversations-section">
            <h2>对话记录</h2>
            <div v-if="conversations.length > 0" class="conversations-list">
              <div 
                v-for="conversation in conversations" 
                :key="conversation.id"
                class="conversation-card"
              >
                <div class="conversation-header">
                  <div class="conversation-info">
                    <h3>{{ getConversationTitle(conversation.conversation_type) }}</h3>
                    <span class="message-count">{{ conversation.messages.length }} 条消息</span>
                  </div>
                  <div class="conversation-actions">
                    <el-tag 
                      :type="conversation.is_completed ? 'success' : 'warning'" 
                      size="small"
                    >
                      {{ conversation.is_completed ? '已完成' : '进行中' }}
                    </el-tag>
                    <el-button 
                      text 
                      type="primary" 
                      @click="viewConversation(conversation.id)"
                    >
                      查看详情
                    </el-button>
                  </div>
                </div>
                <div class="conversation-preview">
                  <p v-if="getLastMessage(conversation)">
                    {{ getLastMessage(conversation)?.content.slice(0, 100) }}
                    {{ getLastMessage(conversation)?.content.length > 100 ? '...' : '' }}
                  </p>
                  <p v-else class="no-messages">暂无消息</p>
                </div>
              </div>
            </div>
            <div v-else class="no-conversations">
              <el-empty description="还没有对话记录" :image-size="80">
                <el-button type="primary" @click="startNewConversation">
                  开始需求澄清
                </el-button>
              </el-empty>
            </div>
          </div>

          <!-- 快速操作 -->
          <div class="actions-section">
            <h2>快速操作</h2>
            <div class="actions-grid">
              <el-button 
                v-if="project.current_stage === 'created'"
                type="primary" 
                size="large"
                @click="startNewConversation"
              >
                <el-icon><ChatDotRound /></el-icon>
                开始需求澄清
              </el-button>
              
              <el-button 
                v-if="canStartTechSelection"
                type="primary" 
                size="large"
                @click="startTechSelection"
              >
                <el-icon><Setting /></el-icon>
                开始技术选型
              </el-button>
              
              <el-button 
                v-if="project.current_stage === 'completed'"
                type="success" 
                size="large"
                @click="exportDocument"
              >
                <el-icon><Download /></el-icon>
                导出文档
              </el-button>
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 错误状态 -->
    <div v-else class="error-container">
      <el-result 
        icon="warning" 
        title="项目不存在" 
        sub-title="该项目可能已被删除或您没有访问权限"
      >
        <template #extra>
          <el-button type="primary" @click="$router.push('/home')">
            返回首页
          </el-button>
        </template>
      </el-result>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { useConversationStore } from '@/stores/conversation'
import TechStackDisplay from '@/components/business/TechStackDisplay.vue'
import type { Project, Conversation, Message } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const conversationStore = useConversationStore()

// 路由参数
const projectId = computed(() => route.params.id as string)

// 计算属性
const project = computed(() => projectStore.currentProject)

const conversations = computed(() => 
  project.value?.ai_conversations || []
)

const stageConfigs = {
  created: { label: '已创建', type: 'info' },
  clarifying: { label: '需求澄清中', type: 'warning' },
  tech_selecting: { label: '技术选型中', type: 'warning' },
  requirement_splitting: { label: '需求拆分中', type: 'warning' },
  completed: { label: '已完成', type: 'success' }
} as const

const stageConfig = computed(() => 
  project.value ? stageConfigs[project.value.current_stage] : stageConfigs.created
)

const canStartTechSelection = computed(() => 
  project.value && 
  project.value.current_stage === 'clarifying' && 
  project.value.requirement_summary
)

// 方法
const formatDate = (dateString: string) => {
  return new Date(dateString).toLocaleString('zh-CN')
}

const getConversationTitle = (type: string) => {
  return type === 'requirement_clarification' ? '需求澄清' : '技术选型'
}

const getLastMessage = (conversation: Conversation): Message | undefined => {
  return conversation.messages[conversation.messages.length - 1]
}

const viewConversation = (conversationId: string) => {
  router.push(`/project/${projectId.value}/conversation/${conversationId}`)
}

const startNewConversation = async () => {
  const result = await conversationStore.createConversation(
    projectId.value,
    'requirement_clarification'
  )
  
  if (result.success && result.conversation) {
    router.push(`/project/${projectId.value}/conversation/${result.conversation.id}`)
  } else {
    ElMessage.error(result.message || '创建对话失败')
  }
}

const startTechSelection = async () => {
  const result = await conversationStore.createConversation(
    projectId.value,
    'tech_selection'
  )
  
  if (result.success && result.conversation) {
    router.push(`/project/${projectId.value}/conversation/${result.conversation.id}`)
  } else {
    ElMessage.error(result.message || '创建技术选型对话失败')
  }
}

const handleEdit = () => {
  ElMessage.info('编辑功能开发中...')
}

const handleDelete = async () => {
  if (!project.value) return
  
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.value.name}"吗？此操作不可恢复。`,
      '删除项目',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const result = await projectStore.deleteProject(project.value.id)
    if (result.success) {
      ElMessage.success('项目删除成功')
      router.push('/home')
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

const exportDocument = () => {
  ElMessage.info('导出功能开发中...')
}

// 页面初始化
onMounted(async () => {
  const result = await projectStore.fetchProject(projectId.value)
  if (!result.success) {
    ElMessage.error(result.message || '获取项目详情失败')
  }
})
</script>

<style scoped>
.project-detail-container {
  min-height: 100vh;
  background-color: var(--bg-color-page);
}

.loading-container {
  padding: 40px;
  max-width: 1200px;
  margin: 0 auto;
}

.error-container {
  min-height: 100vh;
  display: flex;
  align-items: center;
  justify-content: center;
}

.project-header {
  background: white;
  border-bottom: 1px solid var(--border-color-lighter);
  padding: 20px 24px;
}

.header-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.header-left {
  display: flex;
  align-items: center;
  gap: 20px;
}

.project-info h1 {
  margin: 0 0 8px 0;
  font-size: 24px;
  color: var(--color-text-primary);
}

.header-actions {
  display: flex;
  gap: 12px;
}

.project-content {
  padding: 24px;
}

.content-grid {
  max-width: 1200px;
  margin: 0 auto;
  display: grid;
  gap: 24px;
}

.info-section,
.conversations-section,
.actions-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.info-section h2,
.conversations-section h2,
.actions-section h2 {
  margin: 0 0 16px 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.info-card {
  background: var(--bg-color-light);
  border-radius: 6px;
  padding: 16px;
}

.info-item {
  margin-bottom: 12px;
}

.info-item:last-child {
  margin-bottom: 0;
}

.info-item label {
  font-weight: 600;
  color: var(--color-text-primary);
  margin-right: 8px;
}

.info-item p {
  margin: 4px 0 0 0;
  color: var(--color-text-regular);
  line-height: 1.5;
}

.requirement-text {
  line-height: 1.6;
  color: var(--color-text-regular);
  margin: 0;
}


.conversations-list {
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.conversation-card {
  border: 1px solid var(--border-color-lighter);
  border-radius: 6px;
  padding: 16px;
  transition: border-color 0.3s ease;
}

.conversation-card:hover {
  border-color: var(--color-primary);
}

.conversation-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 8px;
}

.conversation-info h3 {
  margin: 0 0 4px 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.message-count {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

.conversation-actions {
  display: flex;
  align-items: center;
  gap: 12px;
}

.conversation-preview p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
  line-height: 1.4;
}

.no-messages {
  color: var(--color-text-placeholder);
  font-style: italic;
}

.no-conversations {
  text-align: center;
  padding: 40px 20px;
}

.actions-grid {
  display: flex;
  flex-wrap: wrap;
  gap: 16px;
}

.actions-grid .el-button {
  min-width: 160px;
}
</style>