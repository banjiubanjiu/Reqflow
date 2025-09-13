<template>
  <div 
    class="story-suggestion-card"
    :class="{ 'selected': selected }"
    @click="handleToggle"
  >
    <div class="card-header">
      <div class="story-info">
        <h3 class="story-title">{{ story.title }}</h3>
        <div class="story-meta">
          <el-tag size="small" :type="getPriorityType(story.priority)">
            {{ story.priority }}
          </el-tag>
          <span class="story-points">{{ story.story_points }}点</span>
        </div>
      </div>
      <div class="card-actions">
        <el-button 
          text 
          size="small"
          @click.stop="handleViewDetail"
        >
          <el-icon><View /></el-icon>
        </el-button>
        <el-checkbox 
          :model-value="selected" 
          @change="handleToggle"
          @click.stop
        />
      </div>
    </div>
    
    <div class="card-body">
      <div class="user-story">
        <strong>用户故事:</strong> {{ story.user_story }}
      </div>
      
      <div class="acceptance-criteria" v-if="story.acceptance_criteria?.length">
        <h4>验收标准</h4>
        <ul class="criteria-list">
          <li 
            v-for="(criteria, index) in story.acceptance_criteria.slice(0, 3)" 
            :key="index"
          >
            {{ criteria }}
          </li>
          <li v-if="story.acceptance_criteria.length > 3" class="more-indicator">
            还有 {{ story.acceptance_criteria.length - 3 }} 项...
          </li>
        </ul>
      </div>
      
      <div class="technical-specs" v-if="story.technical_specifications?.length">
        <h4>技术规格</h4>
        <div class="tech-tags">
          <el-tag 
            v-for="spec in story.technical_specifications.slice(0, 4)" 
            :key="spec"
            size="small"
            effect="plain"
          >
            {{ spec }}
          </el-tag>
          <el-tag 
            v-if="story.technical_specifications.length > 4"
            size="small"
            effect="plain"
            type="info"
          >
            +{{ story.technical_specifications.length - 4 }}
          </el-tag>
        </div>
      </div>
    </div>
    
    <div class="card-footer">
      <div class="story-stats">
        <div class="stat-item">
          <span class="stat-label">预估工时</span>
          <span class="stat-value">{{ story.estimated_hours || 'TBD' }}h</span>
        </div>
        <div class="stat-item" v-if="story.dependencies?.length">
          <span class="stat-label">依赖</span>
          <span class="stat-value">{{ story.dependencies.length }}</span>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { View } from '@element-plus/icons-vue'
import type { Story } from '@/types'

interface Props {
  story: Story
  selected: boolean
}

interface Emits {
  (e: 'toggle', story: Story): void
  (e: 'view-detail', story: Story): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const handleToggle = () => {
  emit('toggle', props.story)
}

const handleViewDetail = () => {
  emit('view-detail', props.story)
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
.story-suggestion-card {
  background: white;
  border: 2px solid var(--border-color-lighter);
  border-radius: 12px;
  padding: 18px;
  cursor: pointer;
  transition: all 0.3s ease;
  position: relative;
}

.story-suggestion-card:hover {
  border-color: var(--color-primary-light);
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
}

.story-suggestion-card.selected {
  border-color: var(--color-primary);
  background: var(--color-primary-light-9);
}

.card-header {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  margin-bottom: 14px;
}

.story-info {
  flex: 1;
}

.story-title {
  margin: 0 0 6px 0;
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  line-height: 1.3;
}

.story-meta {
  display: flex;
  align-items: center;
  gap: 10px;
  flex-wrap: wrap;
}

.story-points {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-fill-lighter);
  padding: 2px 6px;
  border-radius: 4px;
}

.card-actions {
  display: flex;
  align-items: center;
  gap: 8px;
  margin-left: 12px;
}

.card-body {
  margin-bottom: 14px;
}

.user-story {
  margin-bottom: 12px;
  font-size: 14px;
  color: var(--color-text-regular);
  line-height: 1.4;
}

.acceptance-criteria,
.technical-specs {
  margin-bottom: 12px;
}

.acceptance-criteria h4,
.technical-specs h4 {
  margin: 0 0 6px 0;
  font-size: 12px;
  font-weight: 600;
  color: var(--color-text-secondary);
  text-transform: uppercase;
  letter-spacing: 0.5px;
}

.criteria-list {
  margin: 0;
  padding-left: 14px;
  list-style-type: disc;
}

.criteria-list li {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.3;
  margin-bottom: 2px;
}

.more-indicator {
  color: var(--color-text-secondary);
  font-style: italic;
}

.tech-tags {
  display: flex;
  flex-wrap: wrap;
  gap: 4px;
}

.card-footer {
  border-top: 1px solid var(--border-color-lighter);
  padding-top: 12px;
}

.story-stats {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.stat-item {
  display: flex;
  flex-direction: column;
  align-items: center;
  gap: 2px;
}

.stat-label {
  font-size: 11px;
  color: var(--color-text-secondary);
}

.stat-value {
  font-size: 13px;
  font-weight: 600;
  color: var(--color-text-primary);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .story-suggestion-card {
    padding: 14px;
  }
  
  .card-header {
    flex-direction: column;
    gap: 10px;
  }
  
  .card-actions {
    margin-left: 0;
    align-self: flex-start;
  }
  
  .story-stats {
    flex-direction: column;
    gap: 8px;
  }
  
  .stat-item {
    flex-direction: row;
    justify-content: space-between;
    width: 100%;
  }
}
</style>