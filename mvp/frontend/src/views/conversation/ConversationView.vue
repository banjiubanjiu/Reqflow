<template>
  <div class="conversation-container">
    <!-- 顶部导航 -->
    <div class="conversation-header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="conversation-info">
            <h1>{{ conversationTitle }}</h1>
            <span class="project-name">{{ projectName }}</span>
          </div>
        </div>
        <div class="header-right">
          <el-button 
            v-if="!isCompleted"
            type="warning"
            @click="handleCompleteConversation"
            :loading="conversationStore.loading"
          >
            结束对话
          </el-button>
          <el-tag 
            v-else
            type="success"
            size="large"
          >
            对话已完成
          </el-tag>
        </div>
      </div>
    </div>

    <!-- 对话主体 -->
    <div class="conversation-main">
      <div class="conversation-content">
        <!-- 加载状态 -->
        <div v-if="conversationStore.loading && !conversation" class="loading-container">
          <el-skeleton :rows="5" animated />
        </div>

        <!-- 对话消息 -->
        <div v-else-if="conversation" class="messages-container">
          <div 
            v-for="(message, index) in conversation.messages" 
            :key="index"
            class="message-wrapper"
            :class="message.role"
          >
            <ChatMessage :message="message" />
          </div>

          <!-- 正在发送消息的加载状态 -->
          <div v-if="conversationStore.sendingMessage" class="message-wrapper ai">
            <div class="message-item ai-message">
              <div class="message-avatar">
                <el-icon><Robot /></el-icon>
              </div>
              <div class="message-content">
                <div class="typing-indicator">
                  <span></span>
                  <span></span>
                  <span></span>
                </div>
              </div>
            </div>
          </div>
        </div>

        <!-- 错误状态 -->
        <div v-else class="error-container">
          <el-result 
            icon="warning" 
            title="加载失败" 
            sub-title="无法获取对话内容，请刷新页面重试"
          >
            <template #extra>
              <el-button type="primary" @click="loadConversation">重新加载</el-button>
            </template>
          </el-result>
        </div>
      </div>
    </div>

    <!-- 消息输入框 -->
    <div class="message-input-container" v-if="conversation && !isCompleted">
      <div class="input-content">
        <el-input
          v-model="messageInput"
          type="textarea"
          :rows="3"
          placeholder="请输入您的回答或问题..."
          :disabled="conversationStore.sendingMessage"
          @keydown.enter.ctrl="handleSendMessage"
          @keydown.enter.meta="handleSendMessage"
        />
        <div class="input-actions">
          <div class="input-hint">
            <span>Ctrl + Enter 发送</span>
          </div>
          <el-button 
            type="primary"
            :disabled="!messageInput.trim()"
            :loading="conversationStore.sendingMessage"
            @click="handleSendMessage"
          >
            发送
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, watch } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { useProjectStore } from '@/stores/project'
import { useConversationStore } from '@/stores/conversation'
import ChatMessage from '@/components/business/ChatMessage.vue'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const conversationStore = useConversationStore()

// 路由参数
const projectId = computed(() => route.params.projectId as string)
const conversationId = computed(() => route.params.conversationId as string)

// 消息输入
const messageInput = ref('')

// 计算属性
const conversation = computed(() => conversationStore.currentConversation)

const isCompleted = computed(() => conversation.value?.is_completed || false)

const conversationTitle = computed(() => {
  if (!conversation.value) return '对话'
  
  return conversation.value.conversation_type === 'requirement_clarification' 
    ? '需求澄清对话' 
    : '技术选型对话'
})

const projectName = computed(() => {
  return projectStore.currentProject?.name || '项目'
})

// 方法
const loadConversation = async () => {
  if (conversationId.value) {
    const result = await conversationStore.fetchConversation(conversationId.value)
    if (!result.success) {
      ElMessage.error(result.message || '加载对话失败')
    }
  } else {
    // 没有对话ID，创建新的需求澄清对话
    const result = await conversationStore.createConversation(
      projectId.value,
      'requirement_clarification'
    )
    
    if (result.success && result.conversation) {
      router.replace(`/project/${projectId.value}/conversation/${result.conversation.id}`)
    } else {
      ElMessage.error(result.message || '创建对话失败')
    }
  }
}

const handleSendMessage = async () => {
  if (!messageInput.value.trim() || !conversationId.value) return
  
  const content = messageInput.value.trim()
  messageInput.value = ''
  
  const result = await conversationStore.sendMessage(conversationId.value, content)
  
  if (!result.success) {
    ElMessage.error(result.message || '发送消息失败')
    // 恢复输入内容
    messageInput.value = content
  } else {
    // 滚动到底部
    nextTick(() => {
      scrollToBottom()
    })
  }
}

const handleCompleteConversation = async () => {
  if (!conversationId.value) return
  
  try {
    await ElMessageBox.confirm(
      '确定要结束当前对话吗？结束后将无法继续添加消息。',
      '结束对话',
      {
        confirmButtonText: '确定结束',
        cancelButtonText: '取消',
        type: 'warning'
      }
    )
    
    const result = await conversationStore.completeConversation(conversationId.value)
    
    if (result.success) {
      ElMessage.success('对话已结束')
    } else {
      ElMessage.error(result.message || '结束对话失败')
    }
  } catch (error) {
    // 用户取消
  }
}

const scrollToBottom = () => {
  const container = document.querySelector('.messages-container')
  if (container) {
    container.scrollTop = container.scrollHeight
  }
}

// 页面初始化
onMounted(async () => {
  // 先加载项目信息
  if (projectId.value) {
    const result = await projectStore.fetchProject(projectId.value)
    if (!result.success) {
      ElMessage.error(result.message || '加载项目信息失败')
      return
    }
  }
  
  // 再加载对话
  await loadConversation()
  
  // 滚动到底部
  nextTick(() => {
    scrollToBottom()
  })
})

// 监听对话变化，自动滚动到底部
watch(
  () => conversation.value?.messages,
  () => {
    nextTick(() => {
      scrollToBottom()
    })
  },
  { deep: true }
)

// 页面卸载时清理状态
onUnmounted(() => {
  conversationStore.clearConversation()
})
</script>

<style scoped>
.conversation-container {
  height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color-page);
}

.conversation-header {
  background: white;
  border-bottom: 1px solid var(--border-color-lighter);
  padding: 16px 24px;
  flex-shrink: 0;
}

.header-content {
  max-width: 1000px;
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

.conversation-info h1 {
  margin: 0 0 4px 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.project-name {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.conversation-main {
  flex: 1;
  overflow: hidden;
  display: flex;
  justify-content: center;
}

.conversation-content {
  width: 100%;
  max-width: 1000px;
  display: flex;
  flex-direction: column;
}

.loading-container,
.error-container {
  flex: 1;
  display: flex;
  align-items: center;
  justify-content: center;
  padding: 40px 24px;
}

.messages-container {
  flex: 1;
  overflow-y: auto;
  padding: 24px;
  display: flex;
  flex-direction: column;
  gap: 16px;
}

.message-wrapper {
  display: flex;
}

.message-wrapper.user {
  justify-content: flex-end;
}

.message-wrapper.ai,
.message-wrapper.assistant {
  justify-content: flex-start;
}

.message-input-container {
  background: white;
  border-top: 1px solid var(--border-color-lighter);
  padding: 16px 24px;
  flex-shrink: 0;
}

.input-content {
  max-width: 1000px;
  margin: 0 auto;
}

.input-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-top: 12px;
}

.input-hint {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

/* AI消息加载动画 */
.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
}

.ai-message .message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-message .message-content {
  background: white;
  border-radius: 12px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
}

.typing-indicator {
  display: flex;
  gap: 4px;
  align-items: center;
}

.typing-indicator span {
  width: 6px;
  height: 6px;
  border-radius: 50%;
  background: var(--color-text-placeholder);
  animation: typing 1.4s infinite;
}

.typing-indicator span:nth-child(2) {
  animation-delay: 0.2s;
}

.typing-indicator span:nth-child(3) {
  animation-delay: 0.4s;
}

@keyframes typing {
  0%, 60%, 100% {
    transform: translateY(0);
    opacity: 0.4;
  }
  30% {
    transform: translateY(-10px);
    opacity: 1;
  }
}
</style>