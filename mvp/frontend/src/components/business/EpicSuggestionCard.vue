<template>
  <div 
    class="epic-suggestion-card"
    :class="{ 'selected': selected }"
    @click="handleToggle"
  >
    <div class="card-header">
      <div class="epic-info">
        <h3 class="epic-name">{{ epic.name }}</h3>
        <div class="epic-meta">
          <el-tag size="small" type="info">{{ epic.business_domain }}</el-tag>
          <span class="complexity">复杂度: {{ epic.complexity }}</span>
        </div>
      </div>
      <div class="selection-indicator">
        <el-checkbox :model-value="selected" @change="handleToggle" />
      </div>
    </div>
    
    <div class="card-body">
      <p class="epic-description">{{ epic.description }}</p>
      
      <div class="epic-details">
        <div class="detail-section">
          <h4>核心功能</h4>
          <ul class="feature-list">
            <li v-for="feature in epic.core_features" :key="feature">
              {{ feature }}
            </li>
          </ul>
        </div>
        
        <div class="detail-section" v-if="epic.technical_requirements?.length">
          <h4>技术要求</h4>
          <div class="tech-tags">
            <el-tag 
              v-for="tech in epic.technical_requirements" 
              :key="tech"
              size="small"
              effect="plain"
            >
              {{ tech }}
            </el-tag>
          </div>
        </div>
        
        <div class="detail-section" v-if="epic.dependencies?.length">
          <h4>依赖关系</h4>
          <ul class="dependency-list">
            <li v-for="dep in epic.dependencies" :key="dep">
              {{ dep }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="epic-stats">
        <div class="stat-item">
          <span class="stat-label">预估工时</span>
          <span class="stat-value">{{ epic.estimated_hours || 'TBD' }}h</span>
        </div>
        <div class="stat-item">
          <span class="stat-label">优先级</span>
          <el-tag 
            :type="getPriorityType(epic.priority)" 
            size="small"
          >
            {{ epic.priority }}
          </el-tag>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { Epic } from '@/types'

interface Props {
  epic: Epic
  selected: boolean
}

interface Emits {
  (e: 'toggle', epic: Epic): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleToggle = () => {
  emit('toggle', props.epic)
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
</script>

<style scoped>
.epic-suggestion-card {
  background: white;
  border: 2px solid var(--border-color-lighter);
  border-radius: 12px;
  padding: 20px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.epic-suggestion-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.epic-suggestion-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light-9);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 16px;
}

.epic-info {
  flex: 1;
}

.epic-name {
  margin: 0 0 8px 0;
  font-size: 18px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.epic-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.complexity {
  font-size: 12px;
  color: var(--color-text-secondary);
}

.selection-indicator {
  margin-left: 16px;
}

.card-body {
  margin-bottom: 16px;
}

.epic-description {
  margin: 0 0 16px 0;
  color: var(--color-text-regular);
  line-height: 1.5;
  font-size: 14px;
}

.epic-details {
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.detail-section h4 {
  margin: 0 0 6px 0;
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.feature-list,
.dependency-list {
  margin: 0;
  padding-left: 16px;
  list-style-type: disc;
}

.feature-list li,
.dependency-list li {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.4;
  margin-bottom: 2px;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 6px;
}

.card-footer {
  border-top: 1px solid var(--border-color-lighter);
  padding-top: 16px;
}

.epic-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
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
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .epic-suggestion-card {
    padding: 16px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 12px;
  }
  
  .selection-indicator {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .epic-stats {
    flex-direction: column;
    gap: 12px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}
</style>