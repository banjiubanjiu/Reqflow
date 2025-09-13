<template>
  <div class="chat-message" :class="message.role">
    <!-- AI消息 -->
    <div v-if="message.role === 'ai' || message.role === 'assistant'" class="message-item ai-message">
      <div class="message-avatar">
        <el-icon><ChatDotRound /></el-icon>
      </div>
      <div class="message-content">
        <!-- 技术选型消息特殊显示 -->
        <div v-if="isTechStackMessage && parsedTechStack" class="tech-stack-display">
          <div class="tech-stack-header">
            <el-icon class="header-icon"><Tools /></el-icon>
            <h4>AI推荐的技术选型方案</h4>
          </div>
          
          <div class="tech-choices-grid">
            <div 
              v-for="(choice, index) in parsedTechStack.techChoices" 
              :key="index"
              class="tech-choice-card"
            >
              <div class="tech-header">
                <div class="tech-icon" :style="{ backgroundColor: getTechColor(choice.category) }">
                  <el-icon><component :is="getTechIcon(choice.category)" /></el-icon>
                </div>
                <div class="tech-info">
                  <div class="tech-category">{{ choice.category }}</div>
                  <div class="tech-name">{{ choice.technology }}</div>
                </div>
              </div>
              <div class="tech-reason">{{ choice.reason }}</div>
            </div>
          </div>
          
          <div v-if="parsedTechStack.aiSuggestions" class="ai-suggestions">
            <div class="suggestions-header">
              <el-icon><ChatDotRound /></el-icon>
              <span>AI建议</span>
            </div>
            <div class="suggestions-content">{{ parsedTechStack.aiSuggestions }}</div>
          </div>
          
          <div class="tech-actions">
            <el-button type="primary" size="small">
              <el-icon><Check /></el-icon>
              采纳此方案
            </el-button>
            <el-button size="small">
              <el-icon><Refresh /></el-icon>
              重新生成
            </el-button>
          </div>
        </div>
        
        <!-- 普通消息显示 -->
        <div v-else class="message-text" v-html="formattedContent"></div>
        
        <div class="message-time">{{ formattedTime }}</div>
      </div>
    </div>

    <!-- 用户消息 -->
    <div v-else class="message-item user-message">
      <div class="message-content">
        <!-- 用户技术选型消息特殊显示 -->
        <div v-if="isUserTechStackMessage && userTechStack" class="user-tech-stack-display">
          <div class="user-tech-header">
            <el-icon><Tools /></el-icon>
            <span>我的技术选型方案</span>
          </div>
          <div class="user-tech-list">
            <div 
              v-for="(choice, index) in userTechStack.tech_choices" 
              :key="index"
              class="user-tech-item"
            >
              <strong>{{ choice.category }}:</strong> {{ choice.technology }}
              <div v-if="choice.reason" class="user-tech-reason">{{ choice.reason }}</div>
            </div>
          </div>
        </div>
        
        <!-- 普通用户消息 -->
        <div v-else class="message-text">{{ message.content }}</div>
        
        <div class="message-time">{{ formattedTime }}</div>
      </div>
      <div class="message-avatar">
        <el-icon><User /></el-icon>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { 
  ChatDotRound, 
  User, 
  Tools, 
  Monitor, 
  Server, 
  Coin, 
  CloudUpload, 
  Document, 
  Lock,
  Check,
  Refresh
} from '@element-plus/icons-vue'
import type { Message } from '@/types'

interface Props {
  message: Message
}

const props = defineProps<Props>()

// 格式化时间
const formattedTime = computed(() => {
  const date = new Date(props.message.timestamp)
  return date.toLocaleTimeString('zh-CN', {
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 检测是否是技术选型消息
const isTechStackMessage = computed(() => {
  const content = props.message.content
  return content.includes('| 分类 | 技术选择 | 选择理由 |') || 
         content.includes('|------|----------|----------|') ||
         (content.includes('前端框架') && content.includes('后端框架'))
})

// 解析技术选型表格
const parsedTechStack = computed(() => {
  if (!isTechStackMessage.value) return null
  
  const content = props.message.content
  const lines = content.split('\n')
  const techChoices: Array<{category: string, technology: string, reason: string}> = []
  let aiSuggestions = ''
  let isInSuggestions = false
  
  for (const line of lines) {
    const trimmedLine = line.trim()
    
    // 检测优化建议部分
    if (trimmedLine.includes('## 优化建议') || 
        trimmedLine.includes('优化建议') ||
        trimmedLine.includes('## 建议')) {
      isInSuggestions = true
      continue
    }
    
    // 收集优化建议
    if (isInSuggestions && trimmedLine) {
      aiSuggestions += trimmedLine + '\n'
      continue
    }
    
    // 解析表格行
    if (trimmedLine.includes('|') && !trimmedLine.includes('---')) {
      const parts = trimmedLine.split('|').map(part => part.trim()).filter(part => part)
      
      // 跳过表头
      if (parts.length >= 3 && 
          !parts[0].includes('分类') && 
          !parts[1].includes('技术选择') &&
          parts[0] && parts[1] && parts[2]) {
        
        techChoices.push({
          category: parts[0],
          technology: parts[1], 
          reason: parts[2]
        })
      }
    }
  }
  
  return {
    techChoices,
    aiSuggestions: aiSuggestions.trim()
  }
})

// 获取技术分类图标
const getTechIcon = (category: string) => {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('前端') || categoryLower.includes('ui')) return 'Monitor'
  if (categoryLower.includes('后端') || categoryLower.includes('服务')) return 'Server'
  if (categoryLower.includes('数据库')) return 'Coin'
  if (categoryLower.includes('部署') || categoryLower.includes('云')) return 'CloudUpload'
  if (categoryLower.includes('api') || categoryLower.includes('文档')) return 'Document'
  if (categoryLower.includes('认证') || categoryLower.includes('权限')) return 'Lock'
  return 'Tools'
}

// 获取技术分类颜色
const getTechColor = (category: string) => {
  const categoryLower = category.toLowerCase()
  if (categoryLower.includes('前端') || categoryLower.includes('ui')) return '#409EFF'
  if (categoryLower.includes('后端') || categoryLower.includes('服务')) return '#67C23A'
  if (categoryLower.includes('数据库')) return '#E6A23C'
  if (categoryLower.includes('部署') || categoryLower.includes('云')) return '#F56C6C'
  if (categoryLower.includes('api') || categoryLower.includes('文档')) return '#909399'
  if (categoryLower.includes('认证') || categoryLower.includes('权限')) return '#9C27B0'
  return '#606266'
}

// 检测用户技术选型消息
const isUserTechStackMessage = computed(() => {
  if (props.message.role !== 'user') return false
  
  try {
    const parsed = JSON.parse(props.message.content)
    return parsed.tech_choices && Array.isArray(parsed.tech_choices)
  } catch {
    return false
  }
})

// 解析用户技术选型
const userTechStack = computed(() => {
  if (!isUserTechStackMessage.value) return null
  
  try {
    return JSON.parse(props.message.content)
  } catch {
    return null
  }
})

// 格式化AI消息内容，支持简单的Markdown
const formattedContent = computed(() => {
  if (props.message.role !== 'ai' && props.message.role !== 'assistant') {
    return props.message.content
  }

  // 如果是技术选型消息，不进行格式化，使用特殊组件显示
  if (isTechStackMessage.value) {
    return props.message.content
  }

  let content = props.message.content
  
  // 处理换行
  content = content.replace(/\n/g, '<br>')
  
  // 处理粗体
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 处理数字列表
  content = content.replace(/^(\d+)\.\s/gm, '<strong>$1.</strong> ')
  
  // 处理简单的代码块
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  return content
})
</script>

<style scoped>
.chat-message {
  width: 100%;
}

.message-item {
  display: flex;
  gap: 12px;
  align-items: flex-start;
  max-width: 80%;
}

.ai-message {
  margin-right: auto;
}

.user-message {
  margin-left: auto;
  flex-direction: row-reverse;
}

.message-avatar {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  flex-shrink: 0;
}

.ai-message .message-avatar {
  background: var(--color-primary);
  color: white;
}

.user-message .message-avatar {
  background: var(--color-success);
  color: white;
}

.message-content {
  flex: 1;
  min-width: 0;
}

.ai-message .message-content {
  background: white;
  border-radius: 12px 12px 12px 4px;
  padding: 12px 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.1);
  border: 1px solid var(--border-color-lighter);
}

.user-message .message-content {
  background: var(--color-primary);
  color: white;
  border-radius: 12px 12px 4px 12px;
  padding: 12px 16px;
  text-align: right;
}

.message-text {
  font-size: 14px;
  line-height: 1.5;
  margin-bottom: 4px;
  word-wrap: break-word;
}

.ai-message .message-text {
  color: var(--color-text-primary);
}

.ai-message .message-text :deep(strong) {
  font-weight: 600;
  color: var(--color-text-primary);
}

.ai-message .message-text :deep(code) {
  background: var(--bg-color-light);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
}

.message-time {
  font-size: 12px;
  opacity: 0.7;
  margin-top: 4px;
}

.ai-message .message-time {
  color: var(--color-text-placeholder);
}

.user-message .message-time {
  color: rgba(255, 255, 255, 0.8);
}

/* 技术选型显示样式 */
.tech-stack-display {
  max-width: none;
  width: 100%;
}

.tech-stack-header {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 16px;
  padding-bottom: 12px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.tech-stack-header .header-icon {
  color: var(--color-primary);
  font-size: 18px;
}

.tech-stack-header h4 {
  margin: 0;
  color: var(--color-text-primary);
  font-size: 16px;
  font-weight: 600;
}

.tech-choices-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(300px, 1fr));
  gap: 12px;
  margin-bottom: 16px;
}

.tech-choice-card {
  background: var(--bg-color-light);
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  padding: 12px;
  transition: all 0.2s;
}

.tech-choice-card:hover {
  border-color: var(--color-primary-light-3);
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.1);
}

.tech-header {
  display: flex;
  align-items: center;
  gap: 12px;
  margin-bottom: 8px;
}

.tech-icon {
  width: 32px;
  height: 32px;
  border-radius: 6px;
  display: flex;
  align-items: center;
  justify-content: center;
  color: white;
  flex-shrink: 0;
}

.tech-info {
  flex: 1;
  min-width: 0;
}

.tech-category {
  font-size: 12px;
  color: var(--color-text-secondary);
  margin-bottom: 2px;
}

.tech-name {
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  word-break: break-word;
}

.tech-reason {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.4;
}

.ai-suggestions {
  background: var(--color-info-light-9);
  border: 1px solid var(--color-info-light-3);
  border-radius: 6px;
  padding: 12px;
  margin-bottom: 16px;
}

.suggestions-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 8px;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-info);
}

.suggestions-content {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.4;
  white-space: pre-wrap;
}

.tech-actions {
  display: flex;
  gap: 8px;
  justify-content: flex-end;
  padding-top: 12px;
  border-top: 1px solid var(--border-color-lighter);
}

/* 用户技术选型显示样式 */
.user-tech-stack-display {
  text-align: left;
}

.user-tech-header {
  display: flex;
  align-items: center;
  gap: 6px;
  margin-bottom: 12px;
  font-size: 14px;
  font-weight: 600;
  color: rgba(255, 255, 255, 0.9);
}

.user-tech-list {
  display: flex;
  flex-direction: column;
  gap: 8px;
}

.user-tech-item {
  background: rgba(255, 255, 255, 0.1);
  border-radius: 6px;
  padding: 8px 12px;
  font-size: 13px;
  line-height: 1.4;
}

.user-tech-item strong {
  color: rgba(255, 255, 255, 0.95);
}

.user-tech-reason {
  margin-top: 4px;
  font-size: 12px;
  color: rgba(255, 255, 255, 0.8);
  font-style: italic;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .message-item {
    max-width: 90%;
  }
  
  .message-avatar {
    width: 28px;
    height: 28px;
  }
  
  .message-content {
    padding: 10px 12px;
  }
  
  .tech-choices-grid {
    grid-template-columns: 1fr;
  }
  
  .tech-actions {
    flex-direction: column;
  }
}
</style>