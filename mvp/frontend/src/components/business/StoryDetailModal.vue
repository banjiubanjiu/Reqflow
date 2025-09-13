<template>
  <el-dialog
    :model-value="modelValue"
    @update:model-value="$emit('update:modelValue', $event)"
    :title="story?.title || 'Story详情'"
    width="800px"
    :close-on-click-modal="false"
  >
    <div class="story-detail" v-if="story">
      <div class="story-header">
        <div class="story-meta">
          <el-tag :type="getPriorityType(story.priority)" size="small">
            {{ story.priority }}
          </el-tag>
          <span class="story-points">{{ story.story_points }}点</span>
          <span class="estimated-hours">{{ story.estimated_hours || 'TBD' }}小时</span>
        </div>
      </div>
      
      <div class="story-content">
        <div class="section">
          <h4>用户故事</h4>
          <div class="user-story-content">
            {{ story.user_story }}
          </div>
        </div>
        
        <div class="section" v-if="story.acceptance_criteria?.length">
          <h4>验收标准</h4>
          <ul class="criteria-list">
            <li v-for="(criteria, index) in story.acceptance_criteria" :key="index">
              {{ criteria }}
            </li>
          </ul>
        </div>
        
        <div class="section" v-if="story.technical_specifications?.length">
          <h4>技术规格</h4>
          <div class="tech-specs">
            <el-tag 
              v-for="spec in story.technical_specifications" 
              :key="spec"
              size="small"
              effect="plain"
              class="spec-tag"
            >
              {{ spec }}
            </el-tag>
          </div>
        </div>
        
        <div class="section" v-if="story.implementation_notes">
          <h4>实现说明</h4>
          <div class="implementation-notes">
            {{ story.implementation_notes }}
          </div>
        </div>
        
        <div class="section" v-if="story.dependencies?.length">
          <h4>依赖关系</h4>
          <ul class="dependencies-list">
            <li v-for="dep in story.dependencies" :key="dep">
              {{ dep }}
            </li>
          </ul>
        </div>
        
        <div class="section" v-if="story.test_scenarios?.length">
          <h4>测试场景</h4>
          <ul class="test-scenarios-list">
            <li v-for="scenario in story.test_scenarios" :key="scenario">
              {{ scenario }}
            </li>
          </ul>
        </div>
      </div>
    </div>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="$emit('update:modelValue', false)">
          关闭
        </el-button>
        <el-button type="primary" @click="handleExport" v-if="story">
          <el-icon><Download /></el-icon>
          导出文档
        </el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { Download } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { Story } from '@/types'
import { useRequirementSplittingStore } from '@/stores/requirementSplitting'

interface Props {
  modelValue: boolean
  story: Story | null
}

interface Emits {
  (e: 'update:modelValue', value: boolean): void
}

const props = defineProps<Props>()
const emit = defineEmits<Emits>()

const splittingStore = useRequirementSplittingStore()

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

const handleExport = async () => {
  if (!props.story?.id) return
  
  const result = await splittingStore.exportStory(props.story.id)
  
  if (result.success) {
    ElMessage.success('Story文档导出成功')
  } else {
    ElMessage.error(result.message || '导出失败')
  }
}
</script>

<style scoped>
.story-detail {
  padding: 8px 0;
}

.story-header {
  margin-bottom: 20px;
  padding-bottom: 16px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.story-meta {
  display: flex;
  align-items: center;
  gap: 12px;
  flex-wrap: wrap;
}

.story-points,
.estimated-hours {
  font-size: 12px;
  color: var(--color-text-secondary);
  background: var(--color-fill-lighter);
  padding: 4px 8px;
  border-radius: 4px;
}

.story-content {
  display: flex;
  flex-direction: column;
  gap: 20px;
}

.section h4 {
  margin: 0 0 8px 0;
  font-size: 14px;
  font-weight: 600;
  color: var(--color-text-primary);
  border-left: 3px solid var(--color-primary);
  padding-left: 8px;
}

.user-story-content,
.implementation-notes {
  padding: 12px;
  background: var(--color-fill-lighter);
  border-radius: 6px;
  color: var(--color-text-regular);
  line-height: 1.5;
  font-size: 14px;
}

.criteria-list,
.dependencies-list,
.test-scenarios-list {
  margin: 0;
  padding-left: 20px;
  list-style-type: disc;
}

.criteria-list li,
.dependencies-list li,
.test-scenarios-list li {
  margin-bottom: 6px;
  color: var(--color-text-regular);
  line-height: 1.4;
  font-size: 14px;
}

.tech-specs {
  display: flex;
  flex-wrap: wrap;
  gap: 8px;
}

.spec-tag {
  margin: 0;
}

.dialog-footer {
  display: flex;
  justify-content: flex-end;
  gap: 12px;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .story-meta {
    flex-direction: column;
    align-items: flex-start;
    gap: 8px;
  }
  
  .tech-specs {
    gap: 6px;
  }
  
  .dialog-footer {
    flex-direction: column-reverse;
    gap: 8px;
  }
}
</style>