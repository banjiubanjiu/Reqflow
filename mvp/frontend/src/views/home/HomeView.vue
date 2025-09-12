<template>
  <div class="home-container">
    <!-- 顶部导航 -->
    <div class="home-header">
      <div class="header-content">
        <div class="header-left">
          <h1 class="app-title">ReqFlow</h1>
          <span class="welcome-text">欢迎回来，{{ authStore.user?.name || authStore.user?.email }}</span>
        </div>
        <div class="header-right">
          <el-button type="primary" @click="$router.push('/project/create')">
            <el-icon><Plus /></el-icon>
            创建项目
          </el-button>
          <el-dropdown @command="handleUserAction">
            <el-avatar :size="32" :src="authStore.user?.avatar_url">
              <el-icon><User /></el-icon>
            </el-avatar>
            <template #dropdown>
              <el-dropdown-menu>
                <el-dropdown-item command="profile">个人设置</el-dropdown-item>
                <el-dropdown-item command="logout" divided>退出登录</el-dropdown-item>
              </el-dropdown-menu>
            </template>
          </el-dropdown>
        </div>
      </div>
    </div>

    <!-- 主体内容 -->
    <div class="home-main">
      <div class="main-content">
        <!-- 统计数据 -->
        <div class="stats-section">
          <div class="stats-grid">
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon size="24"><Folder /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ projectStore.projects.length }}</div>
                <div class="stat-label">项目总数</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon size="24"><Loading /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ inProgressCount }}</div>
                <div class="stat-label">进行中</div>
              </div>
            </div>
            <div class="stat-card">
              <div class="stat-icon">
                <el-icon size="24"><Check /></el-icon>
              </div>
              <div class="stat-content">
                <div class="stat-number">{{ completedCount }}</div>
                <div class="stat-label">已完成</div>
              </div>
            </div>
          </div>
        </div>

        <!-- 项目列表 -->
        <div class="projects-section">
          <div class="section-header">
            <h2>我的项目</h2>
            <el-input
              v-model="searchKeyword"
              placeholder="搜索项目..."
              prefix-icon="Search"
              style="width: 300px"
              clearable
            />
          </div>

          <!-- 加载状态 -->
          <div v-if="projectStore.loading" class="loading-container">
            <el-skeleton :rows="3" animated />
          </div>

          <!-- 空状态 -->
          <div v-else-if="filteredProjects.length === 0" class="empty-state">
            <el-empty 
              description="还没有项目，快去创建第一个吧！"
              :image-size="120"
            >
              <el-button type="primary" @click="$router.push('/project/create')">
                创建项目
              </el-button>
            </el-empty>
          </div>

          <!-- 项目卡片列表 -->
          <div v-else class="projects-grid">
            <ProjectCard
              v-for="project in filteredProjects"
              :key="project.id"
              :project="project"
              @view="handleViewProject"
              @edit="handleEditProject"
              @delete="handleDeleteProject"
            />
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed } from 'vue'
import { useAuthStore } from '@/stores/auth'
import { useProjectStore } from '@/stores/project'
import ProjectCard from '@/components/business/ProjectCard.vue'
import type { Project } from '@/types'

const router = useRouter()
const authStore = useAuthStore()
const projectStore = useProjectStore()

// 搜索关键词
const searchKeyword = ref('')

// 计算属性
const inProgressCount = computed(() => 
  projectStore.projects.filter(p => 
    ['clarifying', 'tech_selecting', 'requirement_splitting'].includes(p.current_stage)
  ).length
)

const completedCount = computed(() => 
  projectStore.projects.filter(p => p.current_stage === 'completed').length
)

const filteredProjects = computed(() => {
  if (!searchKeyword.value.trim()) {
    return projectStore.projects
  }
  
  const keyword = searchKeyword.value.toLowerCase()
  return projectStore.projects.filter(project => 
    project.name.toLowerCase().includes(keyword) ||
    project.description?.toLowerCase().includes(keyword)
  )
})

// 处理用户操作
const handleUserAction = (command: string) => {
  switch (command) {
    case 'profile':
      ElMessage.info('个人设置功能开发中...')
      break
    case 'logout':
      ElMessageBox.confirm('确定要退出登录吗？', '提示', {
        confirmButtonText: '确定',
        cancelButtonText: '取消',
        type: 'warning'
      }).then(() => {
        authStore.logout()
        router.push('/login')
        ElMessage.success('已退出登录')
      })
      break
  }
}

// 项目操作
const handleViewProject = (project: Project) => {
  router.push(`/project/${project.id}`)
}

const handleEditProject = (project: Project) => {
  ElMessage.info('编辑功能开发中...')
}

const handleDeleteProject = async (project: Project) => {
  try {
    await ElMessageBox.confirm(
      `确定要删除项目"${project.name}"吗？此操作不可恢复。`,
      '删除项目',
      {
        confirmButtonText: '删除',
        cancelButtonText: '取消',
        type: 'warning',
        confirmButtonClass: 'el-button--danger'
      }
    )
    
    const result = await projectStore.deleteProject(project.id)
    if (result.success) {
      ElMessage.success('项目删除成功')
    } else {
      ElMessage.error(result.message || '删除失败')
    }
  } catch (error) {
    // 用户取消删除
  }
}

// 页面初始化
onMounted(async () => {
  const result = await projectStore.fetchProjects()
  if (!result.success) {
    ElMessage.error(result.message || '获取项目列表失败')
  }
})

// 页面卸载时清理状态
onUnmounted(() => {
  projectStore.clearProjects()
})
</script>

<style scoped>
.home-container {
  min-height: 100vh;
  background-color: var(--bg-color-page);
}

.home-header {
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

.app-title {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-primary);
  margin: 0;
}

.welcome-text {
  color: var(--color-text-secondary);
  font-size: 14px;
}

.header-right {
  display: flex;
  align-items: center;
  gap: 16px;
}

.home-main {
  padding: 24px;
}

.main-content {
  max-width: 1200px;
  margin: 0 auto;
}

.stats-section {
  margin-bottom: 32px;
}

.stats-grid {
  display: grid;
  grid-template-columns: repeat(auto-fit, minmax(200px, 1fr));
  gap: 20px;
}

.stat-card {
  background: white;
  border-radius: 8px;
  padding: 20px;
  display: flex;
  align-items: center;
  gap: 16px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.stat-icon {
  width: 48px;
  height: 48px;
  border-radius: 50%;
  background: var(--color-primary);
  color: white;
  display: flex;
  align-items: center;
  justify-content: center;
}

.stat-number {
  font-size: 24px;
  font-weight: bold;
  color: var(--color-text-primary);
  line-height: 1;
}

.stat-label {
  font-size: 14px;
  color: var(--color-text-secondary);
  margin-top: 4px;
}

.projects-section {
  background: white;
  border-radius: 8px;
  padding: 24px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.section-header {
  display: flex;
  align-items: center;
  justify-content: space-between;
  margin-bottom: 24px;
}

.section-header h2 {
  margin: 0;
  font-size: 18px;
  color: var(--color-text-primary);
}

.loading-container {
  padding: 20px;
}

.empty-state {
  padding: 40px 20px;
  text-align: center;
}

.projects-grid {
  display: grid;
  grid-template-columns: repeat(auto-fill, minmax(320px, 1fr));
  gap: 20px;
}
</style>