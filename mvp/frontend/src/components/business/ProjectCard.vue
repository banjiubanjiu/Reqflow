<template>
  <div class="project-card" @click="$emit('view', project)">
    <div class="card-header">
      <div class="project-info">
        <h3 class="project-name">{{ project.name }}</h3>
        <p class="project-description" v-if="project.description">
          {{ project.description }}
        </p>
      </div>
      <el-dropdown @command="handleCommand" @click.stop>
        <el-button text>
          <el-icon><MoreFilled /></el-icon>
        </el-button>
        <template #dropdown>
          <el-dropdown-menu>
            <el-dropdown-item command="view">
              <el-icon><View /></el-icon>
              查看详情
            </el-dropdown-item>
            <el-dropdown-item command="edit">
              <el-icon><Edit /></el-icon>
              编辑项目
            </el-dropdown-item>
            <el-dropdown-item command="delete" divided>
              <el-icon><Delete /></el-icon>
              删除项目
            </el-dropdown-item>
          </el-dropdown-menu>
        </template>
      </el-dropdown>
    </div>

    <div class="card-content">
      <div class="stage-info">
        <el-tag :type="stageConfig.type" size="small">
          {{ stageConfig.label }}
        </el-tag>
        <span class="update-time">{{ formattedUpdateTime }}</span>
      </div>

      <div class="project-progress">
        <el-progress 
          :percentage="progressPercentage" 
          :stroke-width="6"
          :show-text="false"
        />
        <span class="progress-text">{{ progressText }}</span>
      </div>

      <div class="project-meta" v-if="project.tech_stack || project.requirement_summary">
        <div class="meta-item" v-if="project.tech_stack">
          <el-icon><Monitor /></el-icon>
          <span>{{ getTechStackText() }}</span>
        </div>
        <div class="meta-item" v-if="project.requirement_summary">
          <el-icon><Document /></el-icon>
          <span>需求已澄清</span>
        </div>
      </div>
    </div>

    <div class="card-actions">
      <el-button 
        v-if="canContinue"
        type="primary" 
        size="small"
        @click.stop="handleContinue"
      >
        {{ continueButtonText }}
      </el-button>
      <el-button 
        v-if="project.current_stage === 'completed'"
        type="success" 
        size="small"
        @click.stop="handleExport"
      >
        导出文档
      </el-button>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useRouter } from 'vue-router'
import { ElMessage } from 'element-plus'
import { MoreFilled, View, Edit, Delete, Monitor, Document } from '@element-plus/icons-vue'
import type { Project } from '@/types'

interface Props {
  project: Project
}

interface Emits {
  (e: 'view', project: Project): void
  (e: 'edit', project: Project): void
  (e: 'delete', project: Project): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()
const router = useRouter()

// 阶段配置
const stageConfigs = {
  created: { label: '已创建', type: 'info', progress: 0 },
  clarifying: { label: '需求澄清中', type: 'warning', progress: 25 },
  tech_selecting: { label: '技术选型中', type: 'warning', progress: 50 },
  tech_selected: { label: '技术选型完成', type: 'success', progress: 60 },
  requirement_splitting: { label: '需求拆分中', type: 'warning', progress: 75 },
  completed: { label: '已完成', type: 'success', progress: 100 }
} as const

// 计算属性
const stageConfig = computed(() => {
  const stage = props.project.current_stage as keyof typeof stageConfigs
  return stageConfigs[stage] || stageConfigs.created
})

const progressPercentage = computed(() => stageConfig.value.progress)

const progressText = computed(() => `${progressPercentage.value}%`)

const formattedUpdateTime = computed(() => {
  const date = new Date(props.project.updated_at)
  const now = new Date()
  const diffTime = now.getTime() - date.getTime()
  const diffDays = Math.floor(diffTime / (1000 * 60 * 60 * 24))
  
  if (diffDays === 0) {
    return '今天更新'
  } else if (diffDays === 1) {
    return '昨天更新'
  } else if (diffDays < 7) {
    return `${diffDays}天前更新`
  } else {
    return date.toLocaleDateString('zh-CN')
  }
})

const canContinue = computed(() => props.project.current_stage !== 'completed')

const continueButtonText = computed(() => {
  switch (props.project.current_stage) {
    case 'created':
      return '开始需求澄清'
    case 'clarifying':
      return '继续需求澄清'
    case 'tech_selecting':
      return '继续技术选型'
    case 'tech_selected':
      return '开始需求拆分'
    case 'requirement_splitting':
      return '继续需求拆分'
    default:
      return '继续完善'
  }
})

// 方法
const getTechStackText = () => {
  if (!props.project.tech_stack) return ''
  
  const stack = props.project.tech_stack
  const parts = []
  
  if (stack.frontend) parts.push(stack.frontend)
  if (stack.backend) parts.push(stack.backend)
  if (stack.database) parts.push(stack.database)
  
  return parts.join(' + ') || '技术栈已选择'
}

const handleCommand = (command: string) => {
  switch (command) {
    case 'view':
      emit('view', props.project)
      break
    case 'edit':
      emit('edit', props.project)
      break
    case 'delete':
      emit('delete', props.project)
      break
  }
}

const handleContinue = () => {
  const stage = props.project.current_stage
  
  if (stage === 'created' || stage === 'clarifying') {
    // 跳转到需求澄清
    router.push(`/project/${props.project.id}/conversation`)
  } else if (stage === 'tech_selecting') {
    // 跳转到技术选型
    router.push(`/project/${props.project.id}/conversation`)
  } else if (stage === 'tech_selected') {
    // 跳转到需求拆分
    router.push(`/project/${props.project.id}/requirement-splitting`)
  } else if (stage === 'requirement_splitting') {
    // 跳转到需求拆分
    router.push(`/project/${props.project.id}/requirement-splitting`)
  } else {
    // 跳转到项目详情
    router.push(`/project/${props.project.id}`)
  }
}

const handleExport = () => {
  ElMessage.info('导出功能开发中...')
}
</script>

<style scoped>
.project-card {
  background: white;
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.project-card:hover {
  border-color: var(--color-primary);
  box-shadow: 0 4px 12px rgba(64, 158, 255, 0.15);
  transform: translateY(-2px);
}

.card-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 16px;
}

.project-info {
  flex: 1;
  min-width: 0;
}

.project-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin: 0 0 8px 0;
  white-space: nowrap;
  overflow: hidden;
  text-overflow: ellipsis;
}

.project-description {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.4;
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.card-content {
  margin-bottom: 16px;
}

.stage-info {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 12px;
}

.update-time {
  font-size: 12px;
  color: var(--color-text-placeholder);
}

.project-progress {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-bottom: 12px;
}

.project-progress :deep(.el-progress) {
  flex: 1;
}

.progress-text {
  font-size: 12px;
  color: var(--color-text-secondary);
  min-width: 30px;
  text-align: right;
}

.project-meta {
  display: flex;
  flex-direction: column;
  gap: 4px;
}

.meta-item {
  display: flex;
  align-items: center;
  gap: 4px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.meta-item .el-icon {
  font-size: 14px;
}

.card-actions {
  display: flex;
  gap: 8px;
}

.card-actions .el-button {
  flex: 1;
}
</style>