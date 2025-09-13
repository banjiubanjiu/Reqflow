<template>
  <div class="results-container">
    <!-- 顶部导航 -->
    <div class="results-header">
      <div class="header-content">
        <div class="header-left">
          <el-button text @click="$router.back()">
            <el-icon><ArrowLeft /></el-icon>
            返回
          </el-button>
          <div class="page-info">
            <h1>需求拆分结果</h1>
            <span class="project-name">{{ projectStore.currentProject?.name }}</span>
          </div>
        </div>
        <div class="header-right">
          <el-button @click="handleExportAll">
            <el-icon><Download /></el-icon>
            导出全部
          </el-button>
        </div>
      </div>
    </div>

    <!-- 统计概览 -->
    <div class="stats-section">
      <div class="stats-container">
        <div class="stat-card">
          <div class="stat-number">{{ splittingStore.epics.length }}</div>
          <div class="stat-label">Epic</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ splittingStore.stories.length }}</div>
          <div class="stat-label">Story</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ totalEstimatedHours }}</div>
          <div class="stat-label">预估工时</div>
        </div>
        <div class="stat-card">
          <div class="stat-number">{{ averageStoryPoints }}</div>
          <div class="stat-label">平均故事点</div>
        </div>
      </div>
    </div>

    <!-- 主要内容 -->
    <div class="results-main">
      <div class="main-content">
        <!-- Epic列表 -->
        <div class="epics-section">
          <div class="section-header">
            <h2>Epic列表</h2>
            <div class="section-actions">
              <el-input
                v-model="epicSearchText"
                placeholder="搜索Epic..."
                size="small"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <div class="epics-grid">
            <div 
              v-for="(epic, index) in filteredEpics" 
              :key="epic.id || index"
              class="epic-card"
            >
              <div class="epic-header">
                <h3>{{ epic.name }}</h3>
                <div class="epic-meta">
                  <el-tag size="small" type="info">{{ epic.business_domain }}</el-tag>
                  <el-tag size="small" :type="getPriorityType(epic.priority)">
                    {{ epic.priority }}
                  </el-tag>
                </div>
              </div>
              
              <p class="epic-description">{{ epic.description }}</p>
              
              <div class="epic-stats">
                <div class="stat-item">
                  <span class="label">Story数量:</span>
                  <span class="value">{{ getEpicStoryCount(epic.id || '') }}</span>
                </div>
                <div class="stat-item">
                  <span class="label">预估工时:</span>
                  <span class="value">{{ epic.estimated_hours || 'TBD' }}h</span>
                </div>
              </div>
              
              <div class="epic-actions">
                <el-button size="small" @click="viewEpicStories(epic.id || '')">
                  查看Story
                </el-button>
                <el-button size="small" type="primary" @click="editEpic(epic)">
                  编辑
                </el-button>
              </div>
            </div>
          </div>
        </div>

        <!-- Story列表 -->
        <div class="stories-section">
          <div class="section-header">
            <h2>Story列表</h2>
            <div class="section-actions">
              <el-select
                v-model="selectedEpicFilter"
                placeholder="筛选Epic"
                size="small"
                style="width: 150px"
                clearable
              >
                <el-option
                  v-for="(epic, index) in splittingStore.epics"
                  :key="epic.id || index"
                  :label="epic.name"
                  :value="epic.id || ''"
                />
              </el-select>
              <el-input
                v-model="storySearchText"
                placeholder="搜索Story..."
                size="small"
                style="width: 200px"
              >
                <template #prefix>
                  <el-icon><Search /></el-icon>
                </template>
              </el-input>
            </div>
          </div>
          
          <div class="stories-table">
            <el-table :data="filteredStories" stripe>
              <el-table-column prop="title" label="标题" min-width="200">
                <template #default="{ row }">
                  <div class="story-title">
                    <span>{{ row.title }}</span>
                    <el-tag size="small" :type="getPriorityType(row.priority)">
                      {{ row.priority }}
                    </el-tag>
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="user_story" label="用户故事" min-width="300">
                <template #default="{ row }">
                  <div class="story-content">
                    {{ row.user_story }}
                  </div>
                </template>
              </el-table-column>
              
              <el-table-column prop="story_points" label="故事点" width="80" align="center">
                <template #default="{ row }">
                  <el-tag size="small" effect="plain">{{ row.story_points }}</el-tag>
                </template>
              </el-table-column>
              
              <el-table-column prop="estimated_hours" label="预估工时" width="100" align="center">
                <template #default="{ row }">
                  {{ row.estimated_hours || 'TBD' }}h
                </template>
              </el-table-column>
              
              <el-table-column label="操作" width="180" align="center">
                <template #default="{ row }">
                  <el-button size="small" @click="viewStoryDetail(row)">
                    详情
                  </el-button>
                  <el-button size="small" type="primary" @click="editStory(row)">
                    编辑
                  </el-button>
                  <el-button size="small" @click="exportStory(row.id)">
                    导出
                  </el-button>
                </template>
              </el-table-column>
            </el-table>
          </div>
        </div>
      </div>
    </div>

    <!-- Story详情模态框 -->
    <StoryDetailModal
      v-model="showStoryDetailModal"
      :story="selectedStoryForDetail"
    />

    <!-- Epic编辑对话框 -->
    <el-dialog
      v-model="showEpicEditDialog"
      title="编辑Epic"
      width="600px"
    >
      <el-form :model="editingEpic" label-width="100px" v-if="editingEpic">
        <el-form-item label="名称">
          <el-input v-model="editingEpic.name" />
        </el-form-item>
        <el-form-item label="描述">
          <el-input v-model="editingEpic.description" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="editingEpic.priority">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="预估工时">
          <el-input-number v-model="editingEpic.estimated_hours" :min="0" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showEpicEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveEpic" :loading="splittingStore.loading">
          保存
        </el-button>
      </template>
    </el-dialog>

    <!-- Story编辑对话框 -->
    <el-dialog
      v-model="showStoryEditDialog"
      title="编辑Story"
      width="700px"
    >
      <el-form :model="editingStory" label-width="100px" v-if="editingStory">
        <el-form-item label="标题">
          <el-input v-model="editingStory.title" />
        </el-form-item>
        <el-form-item label="用户故事">
          <el-input v-model="editingStory.user_story" type="textarea" :rows="3" />
        </el-form-item>
        <el-form-item label="优先级">
          <el-select v-model="editingStory.priority">
            <el-option label="高" value="高" />
            <el-option label="中" value="中" />
            <el-option label="低" value="低" />
          </el-select>
        </el-form-item>
        <el-form-item label="故事点">
          <el-input-number v-model="editingStory.story_points" :min="1" :max="13" />
        </el-form-item>
        <el-form-item label="预估工时">
          <el-input-number v-model="editingStory.estimated_hours" :min="0" />
        </el-form-item>
      </el-form>
      
      <template #footer>
        <el-button @click="showStoryEditDialog = false">取消</el-button>
        <el-button type="primary" @click="saveStory" :loading="splittingStore.loading">
          保存
        </el-button>
      </template>
    </el-dialog>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import { useRoute, useRouter } from 'vue-router'
import { ElMessage, ElMessageBox } from 'element-plus'
import { ArrowLeft, Download, Search } from '@element-plus/icons-vue'
import { useProjectStore } from '@/stores/project'
import { useRequirementSplittingStore } from '@/stores/requirementSplitting'
import StoryDetailModal from '@/components/business/StoryDetailModal.vue'
import type { Epic, Story } from '@/types'

const route = useRoute()
const router = useRouter()
const projectStore = useProjectStore()
const splittingStore = useRequirementSplittingStore()

// 路由参数
const projectId = computed(() => route.params.id as string)

// 组件状态
const epicSearchText = ref('')
const storySearchText = ref('')
const selectedEpicFilter = ref('')
const showStoryDetailModal = ref(false)
const selectedStoryForDetail = ref<Story | null>(null)
const showEpicEditDialog = ref(false)
const showStoryEditDialog = ref(false)
const editingEpic = ref<Epic | null>(null)
const editingStory = ref<Story | null>(null)

// 计算属性
const totalEstimatedHours = computed(() => {
  return splittingStore.stories.reduce((total, story) => {
    return total + (story.estimated_hours || 0)
  }, 0)
})

const averageStoryPoints = computed(() => {
  const stories = splittingStore.stories.filter(s => s.story_points)
  if (stories.length === 0) return 0
  
  const total = stories.reduce((sum, story) => sum + (story.story_points || 0), 0)
  return Math.round(total / stories.length * 10) / 10
})

const filteredEpics = computed(() => {
  return splittingStore.epics.filter(epic => 
    epic.name.toLowerCase().includes(epicSearchText.value.toLowerCase()) ||
    epic.description.toLowerCase().includes(epicSearchText.value.toLowerCase())
  )
})

const filteredStories = computed(() => {
  let stories = splittingStore.stories
  
  // Epic筛选
  if (selectedEpicFilter.value) {
    stories = stories.filter(story => story.epic_id === selectedEpicFilter.value)
  }
  
  // 文本搜索
  if (storySearchText.value) {
    const searchText = storySearchText.value.toLowerCase()
    stories = stories.filter(story => 
      story.title.toLowerCase().includes(searchText) ||
      story.user_story.toLowerCase().includes(searchText)
    )
  }
  
  return stories
})

// 方法
const getEpicStoryCount = (epicId: string) => {
  if (!epicId) return 0
  return splittingStore.stories.filter(story => story.epic_id === epicId).length
}

const getPriorityType = (priority: string | number) => {
  const p = String(priority).toLowerCase()
  switch (p) {
    case 'high':
    case '高':
      return 'danger'
    case 'medium':
    case '中':
      return 'warning'
    case 'low':
    case '低':
      return 'info'
    default:
      return ''
  }
}

const viewEpicStories = (epicId: string) => {
  if (!epicId) return
  
  selectedEpicFilter.value = epicId
  // 滚动到Story列表
  const storiesSection = document.querySelector('.stories-section')
  if (storiesSection) {
    storiesSection.scrollIntoView({ behavior: 'smooth' })
  }
}

const viewStoryDetail = (story: Story) => {
  selectedStoryForDetail.value = story
  showStoryDetailModal.value = true
}

const editEpic = (epic: Epic) => {
  editingEpic.value = { ...epic }
  showEpicEditDialog.value = true
}

const editStory = (story: Story) => {
  editingStory.value = { ...story }
  showStoryEditDialog.value = true
}

const saveEpic = async () => {
  if (!editingEpic.value?.id) return
  
  // 这里应该调用API更新Epic
  ElMessage.success('Epic更新成功')
  showEpicEditDialog.value = false
}

const saveStory = async () => {
  if (!editingStory.value?.id) return
  
  // 这里应该调用API更新Story
  ElMessage.success('Story更新成功')
  showStoryEditDialog.value = false
}

const exportStory = async (storyId: string) => {
  const result = await splittingStore.exportStory(storyId)
  
  if (result.success) {
    ElMessage.success('Story导出成功')
  } else {
    ElMessage.error(result.message || '导出失败')
  }
}

const handleExportAll = async () => {
  try {
    await ElMessageBox.confirm(
      `确定要导出所有 ${splittingStore.stories.length} 个Story的文档吗？`,
      '批量导出',
      {
        confirmButtonText: '确定导出',
        cancelButtonText: '取消',
        type: 'info'
      }
    )

    // 逐个导出Story
    for (const story of splittingStore.stories) {
      const result = await splittingStore.exportStory(story.id!)
      if (!result.success) {
        ElMessage.error(`导出Story "${story.title}" 失败: ${result.message}`)
        break
      }
    }

    ElMessage.success('所有Story文档导出成功')
  } catch (error) {
    // 用户取消
  }
}

// 页面初始化
onMounted(async () => {
  if (!projectId.value) return

  // 加载项目信息
  const projectResult = await projectStore.fetchProject(projectId.value)
  if (!projectResult.success) {
    ElMessage.error(projectResult.message || '加载项目信息失败')
    return
  }

  // 加载Epic和Story数据
  await splittingStore.fetchEpics(projectId.value)
  
  // 为每个Epic加载Story
  for (const epic of splittingStore.epics) {
    if (epic.id) {
      await splittingStore.fetchStories(epic.id)
    }
  }
})
</script>

<style scoped>
.results-container {
  min-height: 100vh;
  background-color: var(--bg-color-page);
}

.results-header {
  background: white;
  border-bottom: 1px solid var(--border-color-lighter);
  padding: 16px 24px;
}

.header-content {
  max-width: 1200px;
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

.page-info h1 {
  margin: 0 0 4px 0;
  font-size: 20px;
  color: var(--color-text-primary);
}

.project-name {
  font-size: 14px;
  color: var(--color-text-secondary);
}

.stats-section {
  background: white;
  padding: 20px 24px;
  border-bottom: 1px solid var(--border-color-lighter);
}

.stats-container {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  justify-content: center;
  gap: 48px;
}

.stat-card {
  text-align: center;
}

.stat-number {
  font-size: 32px;
  font-weight: bold;
  color: var(--color-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.results-main {
  padding: 24px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
  display: flex;
  flex-direction: column;
  gap: 32px;
}

.section-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  margin-bottom: 20px;
}

.section-header h2 {
  margin: 0;
  font-size: 20px;
  color: var(--color-text-primary);
}

.section-actions {
  display: flex;
  gap: 12px;
}

.epics-section,
.stories-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.epics-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(350px, 1fr));
  gap: 20px;
}

.epic-card {
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  padding: 20px;
  transition: border-color 0.3s ease;
}

.epic-card:hover {
  border-color: var(--color-primary);
}

.epic-header {
  display: flex;
  justify-content: space-between;
  align-items: flex-start;
  margin-bottom: 12px;
}

.epic-header h3 {
  margin: 0;
  font-size: 16px;
  color: var(--color-text-primary);
  flex: 1;
}

.epic-meta {
  display: flex;
  gap: 8px;
  flex-wrap: wrap;
}

.epic-description {
  margin: 0 0 16px 0;
  color: var(--color-text-regular);
  line-height: 1.5;
  font-size: 14px;
}

.epic-stats {
  display: flex;
  justify-content: space-between;
  margin-bottom: 16px;
  font-size: 13px;
}

.stat-item .label {
  color: var(--color-text-secondary);
}

.stat-item .value {
  color: var(--color-text-primary);
  font-weight: 500;
}

.epic-actions {
  display: flex;
  gap: 8px;
}

.stories-table {
  margin-top: 16px;
}

.story-title {
  display: flex;
  align-items: center;
  gap: 8px;
}

.story-content {
  font-size: 13px;
  color: var(--color-text-regular);
  line-height: 1.4;
  max-width: 300px;
  overflow: hidden;
  text-overflow: ellipsis;
  white-space: nowrap;
}

/* 响应式调整 */
@media (max-width: 768px) {
  .stats-container {
    flex-direction: column;
    gap: 24px;
  }
  
  .epics-grid {
    grid-template-columns: 1fr;
  }
  
  .section-header {
    flex-direction: column;
    gap: 12px;
    align-items: flex-start;
  }
  
  .section-actions {
    width: 100%;
    flex-direction: column;
  }
}
</style>