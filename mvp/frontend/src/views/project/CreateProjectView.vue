<template>
  <div class="create-project-container">
    <div class="create-project-header">
      <div class="header-content">
        <el-button text @click="$router.back()">
          <el-icon><ArrowLeft /></el-icon>
          返回
        </el-button>
        <h1>创建新项目</h1>
        <div></div>
      </div>
    </div>

    <div class="create-project-main">
      <div class="main-content">
        <div class="create-steps">
          <el-steps :active="currentStep" align-center>
            <el-step title="项目描述" description="描述你的项目想法" />
            <el-step title="项目命名" description="为项目起个好名字" />
            <el-step title="完成创建" description="开始你的项目之旅" />
          </el-steps>
        </div>

        <div class="step-content">
          <!-- 步骤1: 项目描述 -->
          <div v-if="currentStep === 0" class="step-panel">
            <div class="step-header">
              <h2>请描述一下你的项目想法</h2>
              <p>详细描述你想要实现的功能和目标，AI将帮助你更好地规划项目</p>
            </div>
            
            <el-form ref="descriptionFormRef" :model="projectForm" :rules="descriptionRules">
              <el-form-item prop="description">
                <el-input
                  v-model="projectForm.description"
                  type="textarea"
                  :rows="8"
                  placeholder="例如：我想做一个在线教育平台，主要功能包括课程管理、学员注册、视频播放、作业提交、考试评测等。平台需要支持多种课程格式，包括视频课程、直播课程和图文课程..."
                  maxlength="1000"
                  show-word-limit
                  clearable
                />
              </el-form-item>
            </el-form>

            <div class="step-actions">
              <el-button 
                type="primary" 
                size="large"
                :disabled="!projectForm.description.trim()"
                @click="nextStep"
              >
                下一步
              </el-button>
            </div>
          </div>

          <!-- 步骤2: 项目命名 -->
          <div v-if="currentStep === 1" class="step-panel">
            <div class="step-header">
              <h2>为你的项目选择一个名字</h2>
              <p>你可以手动输入，或者让AI为你生成几个建议</p>
            </div>

            <div class="naming-options">
              <el-radio-group v-model="namingMode" size="large" class="naming-mode">
                <el-radio-button value="manual">手动输入</el-radio-button>
                <el-radio-button value="ai">AI生成建议</el-radio-button>
              </el-radio-group>

              <!-- 手动输入模式 -->
              <div v-if="namingMode === 'manual'" class="manual-naming">
                <el-form ref="nameFormRef" :model="projectForm" :rules="nameRules">
                  <el-form-item prop="name">
                    <el-input
                      v-model="projectForm.name"
                      placeholder="请输入项目名称"
                      size="large"
                      maxlength="50"
                      show-word-limit
                      clearable
                    />
                  </el-form-item>
                </el-form>
              </div>

              <!-- AI生成模式 -->
              <div v-else class="ai-naming">
                <div class="ai-suggestions">
                  <div v-if="generateingNames" class="generating-status">
                    <el-icon class="spinning"><Loading /></el-icon>
                    <span>AI正在为你生成项目名称...</span>
                  </div>
                  <div v-else-if="suggestedNames.length > 0" class="suggestions-list">
                    <div 
                      v-for="suggestion in suggestedNames" 
                      :key="suggestion.name"
                      class="suggestion-item"
                      :class="{ active: projectForm.name === suggestion.name }"
                      @click="selectName(suggestion.name)"
                    >
                      <div class="suggestion-name">{{ suggestion.name }}</div>
                      <div class="suggestion-reason">{{ suggestion.reason }}</div>
                    </div>
                    <el-button 
                      text 
                      type="primary" 
                      @click="generateNames"
                      :loading="generateingNames"
                    >
                      换一批
                    </el-button>
                  </div>
                  <div v-else class="generate-trigger">
                    <el-button 
                      type="primary" 
                      size="large"
                      @click="generateNames"
                      :loading="generateingNames"
                    >
                      生成项目名称建议
                    </el-button>
                  </div>
                </div>
              </div>
            </div>

            <div class="step-actions">
              <el-button size="large" @click="prevStep">上一步</el-button>
              <el-button 
                type="primary" 
                size="large"
                :disabled="!projectForm.name.trim()"
                @click="nextStep"
              >
                下一步
              </el-button>
            </div>
          </div>

          <!-- 步骤3: 完成创建 -->
          <div v-if="currentStep === 2" class="step-panel">
            <div class="step-header">
              <h2>项目创建完成！</h2>
              <p>你的项目已经准备就绪，接下来你可以选择：</p>
            </div>

            <div class="project-summary">
              <div class="summary-card">
                <h3>{{ projectForm.name }}</h3>
                <p>{{ projectForm.description }}</p>
              </div>
            </div>

            <div class="completion-options">
              <el-button 
                type="primary" 
                size="large"
                :loading="projectStore.loading"
                @click="createAndStartClarification"
              >
                立即开始需求澄清
              </el-button>
              <el-button 
                size="large"
                :loading="projectStore.loading"
                @click="createAndGoHome"
              >
                稍后进行，返回首页
              </el-button>
            </div>

            <div class="step-actions">
              <el-button size="large" @click="prevStep">上一步</el-button>
            </div>
          </div>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import type { FormInstance, FormRules } from 'element-plus'
import { useProjectStore } from '@/stores/project'
import { useConversationStore } from '@/stores/conversation'
import { projectApi } from '@/api/project'
import type { CreateProjectForm } from '@/types'
import type { ProjectNameSuggestion } from '@/api/project'

const router = useRouter()
const projectStore = useProjectStore()
const conversationStore = useConversationStore()

// 表单引用
const descriptionFormRef = ref<FormInstance>()
const nameFormRef = ref<FormInstance>()

// 当前步骤
const currentStep = ref(0)

// 命名模式
const namingMode = ref<'manual' | 'ai'>('manual')

// 生成名称状态
const generateingNames = ref(false)
const suggestedNames = ref<ProjectNameSuggestion[]>([])

// 项目表单数据
const projectForm = reactive<CreateProjectForm>({
  name: '',
  description: ''
})

// 表单验证规则
const descriptionRules: FormRules<CreateProjectForm> = {
  description: [
    { required: true, message: '请描述你的项目想法', trigger: 'blur' },
    { min: 10, message: '项目描述至少10个字符', trigger: 'blur' }
  ]
}

const nameRules: FormRules<CreateProjectForm> = {
  name: [
    { required: true, message: '请输入项目名称', trigger: 'blur' },
    { min: 2, max: 50, message: '项目名称长度为2-50个字符', trigger: 'blur' }
  ]
}

// 步骤控制
const nextStep = async () => {
  if (currentStep.value === 0) {
    if (!descriptionFormRef.value) return
    try {
      await descriptionFormRef.value.validate()
      currentStep.value++
    } catch (error) {
      console.error('Validation failed:', error)
    }
  } else if (currentStep.value === 1) {
    if (namingMode.value === 'manual') {
      if (!nameFormRef.value) return
      try {
        await nameFormRef.value.validate()
        currentStep.value++
      } catch (error) {
        console.error('Validation failed:', error)
      }
    } else {
      if (!projectForm.name.trim()) {
        ElMessage.warning('请选择一个项目名称')
        return
      }
      currentStep.value++
    }
  }
}

const prevStep = () => {
  if (currentStep.value > 0) {
    currentStep.value--
  }
}

// AI生成项目名称
const generateNames = async () => {
  generateingNames.value = true
  
  try {
    const response = await projectApi.generateProjectNames({
      description: projectForm.description
    })
    
    suggestedNames.value = response.suggestions
    
    if (response.suggestions.length === 0) {
      ElMessage.warning('AI未能生成合适的名称建议，请尝试更详细地描述您的项目')
    }
  } catch (error: any) {
    console.error('Generate names error:', error)
    ElMessage.error(error.response?.data?.error || '生成名称失败，请重试')
  } finally {
    generateingNames.value = false
  }
}

// 选择AI生成的名称
const selectName = (name: string) => {
  projectForm.name = name
}

// 创建项目并开始需求澄清
const createAndStartClarification = async () => {
  const result = await projectStore.createProject(projectForm)
  
  if (result.success && result.project) {
    ElMessage.success('项目创建成功')
    
    // 创建需求澄清对话
    const conversationResult = await conversationStore.createConversation(
      result.project.id, 
      'requirement_clarification'
    )
    
    if (conversationResult.success && conversationResult.conversation) {
      router.push(`/project/${result.project.id}/conversation/${conversationResult.conversation.id}`)
    } else {
      router.push(`/project/${result.project.id}`)
    }
  } else {
    ElMessage.error(result.message || '创建项目失败')
  }
}

// 创建项目并返回首页
const createAndGoHome = async () => {
  const result = await projectStore.createProject(projectForm)
  
  if (result.success) {
    ElMessage.success('项目创建成功')
    router.push('/home')
  } else {
    ElMessage.error(result.message || '创建项目失败')
  }
}
</script>

<style scoped>
.create-project-container {
  min-height: 100vh;
  background-color: var(--bg-color-page);
}

.create-project-header {
  background: white;
  border-bottom: 1px solid var(--border-color-lighter);
  padding: 16px 24px;
}

.header-content {
  max-width: 800px;
  margin: 0 auto;
  display: grid;
  grid-template-columns: auto 1fr auto;
  align-items: center;
  gap: 20px;
}

.header-content h1 {
  margin: 0;
  text-align: center;
  font-size: 20px;
  color: var(--color-text-primary);
}

.create-project-main {
  padding: 40px 24px;
}

.main-content {
  max-width: 800px;
  margin: 0 auto;
}

.create-steps {
  margin-bottom: 40px;
}

.step-content {
  background: white;
  border-radius: 8px;
  padding: 40px;
  box-shadow: 0 2px 4px rgba(0, 0, 0, 0.04);
}

.step-panel {
  max-width: 600px;
  margin: 0 auto;
}

.step-header {
  text-align: center;
  margin-bottom: 32px;
}

.step-header h2 {
  font-size: 24px;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.step-header p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.step-actions {
  display: flex;
  justify-content: center;
  gap: 16px;
  margin-top: 32px;
}

.naming-options {
  margin-bottom: 32px;
}

.naming-mode {
  display: flex;
  justify-content: center;
  margin-bottom: 24px;
}

.manual-naming,
.ai-naming {
  background: var(--bg-color-light);
  border-radius: 8px;
  padding: 24px;
}

.ai-suggestions {
  min-height: 200px;
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
}

.generating-status {
  display: flex;
  align-items: center;
  gap: 8px;
  color: var(--color-text-secondary);
}

.spinning {
  animation: spin 1s linear infinite;
}

@keyframes spin {
  from { transform: rotate(0deg); }
  to { transform: rotate(360deg); }
}

.suggestions-list {
  width: 100%;
  display: flex;
  flex-direction: column;
  gap: 12px;
}

.suggestion-item {
  border: 1px solid var(--border-color-light);
  border-radius: 6px;
  padding: 16px;
  cursor: pointer;
  transition: all 0.3s ease;
}

.suggestion-item:hover,
.suggestion-item.active {
  border-color: var(--color-primary);
  background: rgba(64, 158, 255, 0.05);
}

.suggestion-name {
  font-size: 16px;
  font-weight: 600;
  color: var(--color-text-primary);
  margin-bottom: 4px;
}

.suggestion-reason {
  font-size: 14px;
  color: var(--color-text-secondary);
  line-height: 1.4;
}

.project-summary {
  margin-bottom: 32px;
}

.summary-card {
  background: var(--bg-color-light);
  border-radius: 8px;
  padding: 24px;
  text-align: center;
}

.summary-card h3 {
  font-size: 20px;
  color: var(--color-text-primary);
  margin: 0 0 12px 0;
}

.summary-card p {
  color: var(--color-text-secondary);
  margin: 0;
  line-height: 1.5;
}

.completion-options {
  display: flex;
  flex-direction: column;
  gap: 12px;
  margin-bottom: 32px;
}
</style>