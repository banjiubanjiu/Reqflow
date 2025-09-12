<template>
  <div class="chat-message" :class="message.role">
    <!-- AI消息 -->
    <div v-if="message.role === 'ai' || message.role === 'assistant'" class="message-item ai-message">
      <div class="message-avatar">
        <el-icon><Robot /></el-icon>
      </div>
      <div class="message-content">
        <div class="message-text" v-html="formattedContent"></div>
        <div class="message-time">{{ formattedTime }}</div>
      </div>
    </div>

    <!-- 用户消息 -->
    <div v-else class="message-item user-message">
      <div class="message-content">
        <div class="message-text">{{ message.content }}</div>
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

// 格式化AI消息内容，支持简单的Markdown
const formattedContent = computed(() => {
  if (props.message.role !== 'ai' && props.message.role !== 'assistant') {
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
}
</style>