<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    title="确认Epic选择"
    width="600px"
    :close-on-click-modal="false"
  >
    <div class="dialog-content">
      <div class="confirmation-message">
        <p>您已选择了 <strong>{{ epics.length }}</strong> 个Epic，确认后将为这些Epic生成具体的Story。</p>
      </div>
      
      <div class="selected-epics">
        <h4>已选择的Epic:</h4>
        <div class="epic-list">
          <div 
            v-for="(epic, index) in epics" 
            :key="index"
            class="epic-item"
          >
            <div class="epic-header">
              <h5>{{ epic.name }}</h5>
              <el-tag size="small" type="info">{{ epic.business_domain }}</el-tag>
            </div>
            <p class="epic-description">{{ epic.description }}</p>
            <div class="epic-meta">
              <span class="complexity">复杂度: {{ epic.complexity }}</span>
              <span class="priority">优先级: {{ epic.priority }}</span>
              <span class="hours" v-if="epic.estimated_hours">
                预估: {{ epic.estimated_hours }}h
              </span>
            </div>
          </div>
        </div>
      </div>
      
      <div class="summary-stats">
        <div class="stat-item">
          <span class="stat-label">总Epic数</span>
          <span class="stat-value">{{ epics.length }}</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">总预估工时</span>
          <span class="stat-value">{{ totalHours }}h</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">平均复杂度</span>
          <span class="stat-value">{{ averageComplexity }}</span>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">
          取消
        </el-button>
        <el-button 
          type="primary" 
          @click="handleConfirm"
          :disabled="epics.length === 0"
        >
          确认选择
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import type { Epic } from '@/types'

interface Props {
  modelValue: boolean
  epics: Epic[]
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
  (e: 'confirm', epics: Epic[]): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const totalHours = computed(() => {
  return props.epics.reduce((total, epic) => {
    return total + (epic.estimated_hours || 0)
  }, 0)
})

const averageComplexity = computed(() => {
  if (props.epics.length === 0) return 'N/A'
  
  const complexityMap: Record<string, number> = {
    '低': 1,
    '中': 2,
    '高': 3,
    'low': 1,
    'medium': 2,
    'high': 3
  }
  
  const totalComplexity = props.epics.reduce((total, epic) => {
    return total + (complexityMap[epic.complexity?.toLowerCase()] || 2)
  }, 0)
  
  const average = totalComplexity / props.epics.length
  
  if (average <= 1.5) return '低'
  if (average <= 2.5) return '中'
  return '高'
})

const handleConfirm = () => {
  emit('confirm', props.epics)
}
</script>

<style scoped>
.dialog-content {
  padding: 8px 0;
}

.confirmation-message {
  margin-bottom: 20px;
  padding: 16px;
  background: var(--color-info-light-9);
  border-radius: 8px;
  border-left: 4px solid var(--color-info);
}

.confirmation-message p {
  margin: 0;
  color: var(--color-text-regular);
  line-height: 1.5;
}

.selected-epics h4 {
  margin: 0 0 12px 0;
  font-size: 16px;
  color: var(--color-text-primary);
}

.epic-list {
  max-height: 300px;
  overflow-y: auto;
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
}

.epic-item {
  padding: 16px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.epic-item:last-child {
  border-bottom: none;
}

.epic-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 8px;
}

.epic-header h5 {
  margin: 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.epic-description {
  margin: 0 0 8px 0;
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.4;
}

.epic-meta {
  display: flex;
  gap: 16px;
  font-size: 12px;
  color: var(--color-text-secondary);
}

.summary-stats {
  display: flex;
  justify-content: space-around;
  margin-top: 20px;
  padding: 16px;
  background: var(--color-fill-lighter);
  border-radius: 8px;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 4px;
}

.stat-label {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 滚动条样式 */
.epic-list::-webkit-scrollbar {
  width: 6px;
}

.epic-list::-webkit-scrollbar-track {
  background: var(--color-fill-lighter);
  border-radius: 3px;
}

.epic-list::-webkit-scrollbar-thumb {
  background: var(--color-text-placeholder);
  border-radius: 3px;
}

.epic-list::-webkit-scrollbar-thumb:hover {
  background: var(--color-text-secondary);
}
</style>