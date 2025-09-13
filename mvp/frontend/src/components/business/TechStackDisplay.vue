<template>
  <div class="tech-stack-display">
    <!-- 技术选型表格 -->
    <div v-if="techStack?.tech_choices?.length > 0" class="tech-choices">
      <div class="display-table">
        <!-- 表格头部 -->
        <div class="table-header">
          <div class="header-cell category">分类</div>
          <div class="header-cell technology">技术选择</div>
          <div class="header-cell reason">选择理由</div>
        </div>
        
        <!-- 表格内容 -->
        <div class="table-body">
          <div 
            v-for="(choice, index) in techStack.tech_choices" 
            :key="index"
            class="table-row"
          >
            <div class="table-cell category">
              <el-tag type="info" size="small">{{ choice.category }}</el-tag>
            </div>
            <div class="table-cell technology">
              <strong>{{ choice.technology }}</strong>
            </div>
            <div class="table-cell reason">
              {{ choice.reason }}
            </div>
          </div>
        </div>
      </div>
    </div>

    <!-- 选型模式标识 -->
    <div class="tech-meta">
      <div class="meta-row">
        <label>选型方式：</label>
        <el-tag :type="modeConfig.type" size="small">
          {{ modeConfig.label }}
        </el-tag>
      </div>
      
      <div class="meta-row">
        <label>创建时间：</label>
        <span>{{ formattedDate }}</span>
      </div>
    </div>

    <!-- AI建议 -->
    <div v-if="techStack?.ai_suggestions" class="ai-suggestions">
      <h4>
        <el-icon><ChatDotRound /></el-icon>
        {{ techStack.selection_mode === 'user_defined' ? 'AI优化建议' : 'AI生成说明' }}
      </h4>
      <div class="suggestions-content" v-html="formattedSuggestions"></div>
    </div>

    <!-- 解析错误提示 -->
    <div v-if="techStack?.parsing_error" class="parsing-error">
      <el-alert
        title="技术选型解析异常"
        type="warning"
        description="AI返回的技术选型格式异常，显示默认配置。您可以手动编辑或重新生成。"
        show-icon
        :closable="false"
      />
    </div>

    <!-- 空状态 -->
    <div v-if="!techStack || !techStack.tech_choices?.length" class="empty-state">
      <el-empty 
        description="暂无技术选型数据" 
        :image-size="60"
      />
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { TechStack } from '@/types'

interface Props {
  techStack?: TechStack | null
}

const props = defineProps<Props>()

// 模式配置
const modeConfigs = {
  user_defined: { label: '朕说了算', type: 'success' },
  ai_generated: { label: 'Vibe一下', type: 'primary' }
} as const

const modeConfig = computed(() => {
  if (!props.techStack?.selection_mode) {
    return { label: '未知', type: 'info' }
  }
  return modeConfigs[props.techStack.selection_mode] || { label: '未知', type: 'info' }
})

// 格式化创建时间
const formattedDate = computed(() => {
  if (!props.techStack?.created_at) return '未知时间'
  
  const date = new Date(props.techStack.created_at)
  return date.toLocaleString('zh-CN', {
    year: 'numeric',
    month: '2-digit',
    day: '2-digit',
    hour: '2-digit',
    minute: '2-digit'
  })
})

// 格式化AI建议，支持简单的Markdown
const formattedSuggestions = computed(() => {
  if (!props.techStack?.ai_suggestions) return ''
  
  let content = props.techStack.ai_suggestions
  
  // 处理换行
  content = content.replace(/\n/g, '<br>')
  
  // 处理粗体 **text**
  content = content.replace(/\*\*(.*?)\*\*/g, '<strong>$1</strong>')
  
  // 处理标题 ## 标题
  content = content.replace(/^##\s(.+)$/gm, '<h5>$1</h5>')
  
  // 处理列表项 - 项目
  content = content.replace(/^-\s(.+)$/gm, '<div class="list-item">• $1</div>')
  
  // 处理数字列表 1. 项目
  content = content.replace(/^(\d+)\.\s(.+)$/gm, '<div class="list-item"><strong>$1.</strong> $2</div>')
  
  // 处理内联代码 `code`
  content = content.replace(/`([^`]+)`/g, '<code>$1</code>')
  
  // 处理表格（简单版本）
  if (content.includes('|')) {
    // 检测是否包含表格格式
    const lines = content.split('<br>')
    let inTable = false
    const processedLines = []
    
    for (const line of lines) {
      if (line.trim().includes('|') && line.trim().split('|').length >= 3) {
        if (!inTable) {
          processedLines.push('<div class="markdown-table">')
          inTable = true
        }
        
        const cells = line.trim().split('|').map(cell => cell.trim()).filter(cell => cell)
        if (cells.length >= 3) {
          processedLines.push(
            '<div class="table-row">' + 
            cells.map(cell => `<div class="table-cell">${cell}</div>`).join('') + 
            '</div>'
          )
        }
      } else {
        if (inTable) {
          processedLines.push('</div>')
          inTable = false
        }
        processedLines.push(line)
      }
    }
    
    if (inTable) {
      processedLines.push('</div>')
    }
    
    content = processedLines.join('<br>')
  }
  
  return content
})
</script>

<style scoped>
.tech-stack-display {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.tech-choices {
  background: var(--bg-color-light);
  border-radius: 8px;
  padding: 16px;
  border: 1px solid var(--border-color-lighter);
}

.display-table {
  width: 100%;
}

.table-header {
  display: grid;
  grid-template-columns: 120px 200px 1fr;
  gap: 16px;
  padding: 12px 0;
  border-bottom: 2px solid var(--border-color-light);
  margin-bottom: 12px;
}

.header-cell {
  font-weight: 600;
  color: var(--color-text-primary);
  font-size: 14px;
}

.table-body {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.table-row {
  display: grid;
  grid-template-columns: 120px 200px 1fr;
  gap: 16px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}

.table-row:last-child {
  border-bottom: none;
}

.table-cell {
  font-size: 14px;
  line-height: 1.5;
}

.table-cell.technology strong {
  color: var(--color-primary);
  font-weight: 600;
}

.table-cell.reason {
  color: var(--color-text-secondary);
}

.tech-meta {
  display: flex;
  flex-direction: column;
  gap: 8px;
  padding: 12px 16px;
  background: var(--bg-color-light);
  border-radius: 6px;
  border: 1px solid var(--border-color-lighter);
}

.meta-row {
  display: flex;
  align-items: center;
  gap: 8px;
  font-size: 14px;
}

.meta-row label {
  color: var(--color-text-secondary);
  font-weight: 500;
  min-width: 80px;
}

.ai-suggestions {
  padding: 16px;
  background: var(--bg-color-light);
  border-radius: 8px;
  border: 1px solid var(--color-primary-light-8);
}

.ai-suggestions h4 {
  margin: 0 0 12px 0;
  color: var(--color-primary);
  font-size: 16px;
  display: flex;
  align-items: center;
  gap: 8px;
}

.suggestions-content {
  color: var(--color-text-primary);
  font-size: 14px;
  line-height: 1.6;
}

.suggestions-content :deep(strong) {
  color: var(--color-text-primary);
  font-weight: 600;
}

.suggestions-content :deep(h5) {
  margin: 16px 0 8px 0;
  color: var(--color-primary);
  font-size: 15px;
  font-weight: 600;
}

.suggestions-content :deep(.list-item) {
  margin: 6px 0;
  padding-left: 8px;
  color: var(--color-text-regular);
}

.suggestions-content :deep(code) {
  background: white;
  border: 1px solid var(--border-color-lighter);
  padding: 2px 6px;
  border-radius: 4px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 13px;
  color: var(--color-primary);
}

.suggestions-content :deep(.markdown-table) {
  margin: 12px 0;
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  overflow: hidden;
}

.suggestions-content :deep(.markdown-table .table-row) {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(120px, 1fr));
  border-bottom: 1px solid var(--border-color-lighter);
}

.suggestions-content :deep(.markdown-table .table-row:last-child) {
  border-bottom: none;
}

.suggestions-content :deep(.markdown-table .table-cell) {
  padding: 8px 12px;
  background: white;
  border-right: 1px solid var(--border-color-lighter);
  font-size: 13px;
}

.suggestions-content :deep(.markdown-table .table-cell:last-child) {
  border-right: none;
}

.empty-state {
  text-align: center;
  padding: 40px 20px;
  color: var(--color-text-placeholder);
}

.parsing-error {
  margin-bottom: 20px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .table-header,
  .table-row {
    grid-template-columns: 1fr;
    gap: 8px;
  }
  
  .header-cell {
    display: none;
  }
  
  .table-cell {
    padding: 8px 0;
    border-bottom: 1px solid var(--border-color-lighter);
  }
  
  .table-cell:last-child {
    border-bottom: none;
    margin-bottom: 12px;
  }
  
  .table-cell::before {
    content: attr(data-label);
    display: block;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
    margin-bottom: 4px;
  }
  
  .table-cell.category::before {
    content: '分类：';
  }
  
  .table-cell.technology::before {
    content: '技术选择：';
  }
  
  .table-cell.reason::before {
    content: '选择理由：';
  }
  
  .meta-row {
    flex-direction: column;
    align-items: flex-start;
    gap: 4px;
  }
}
</style>