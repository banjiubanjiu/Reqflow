<template>
  <div class="tech-stack-editor">
    <div class="editor-header">
      <h3>技术选型配置</h3>
      <p>请填写您的技术选型方案，可以添加或删除行项</p>
    </div>

    <div class="tech-table">
      <!-- 表格头部 -->
      <div class="table-header">
        <div class="header-cell category">分类</div>
        <div class="header-cell technology">技术选择</div>
        <div class="header-cell reason">选择理由</div>
        <div class="header-cell actions">操作</div>
      </div>

      <!-- 表格内容 -->
      <div class="table-body">
        <div 
          v-for="(choice, index) in techChoices" 
          :key="index"
          class="table-row"
        >
          <div class="table-cell category">
            <el-select
              v-model="choice.category"
              placeholder="选择分类"
              filterable
              allow-create
              @change="handleChoiceChange"
            >
              <el-option
                v-for="cat in predefinedCategories"
                :key="cat"
                :label="cat"
                :value="cat"
              />
            </el-select>
          </div>
          
          <div class="table-cell technology">
            <el-input
              v-model="choice.technology"
              placeholder="如：Vue 3 + TypeScript"
              @input="handleChoiceChange"
            />
          </div>
          
          <div class="table-cell reason">
            <el-input
              v-model="choice.reason"
              type="textarea"
              :rows="2"
              placeholder="请简述选择理由"
              @input="handleChoiceChange"
            />
          </div>
          
          <div class="table-cell actions">
            <el-button
              type="danger"
              text
              :disabled="techChoices.length <= 1"
              @click="removeChoice(index)"
            >
              <el-icon><Delete /></el-icon>
            </el-button>
          </div>
        </div>
      </div>

      <!-- 添加行按钮 -->
      <div class="table-footer">
        <el-button type="primary" text @click="addChoice">
          <el-icon><Plus /></el-icon>
          添加技术选型
        </el-button>
      </div>
    </div>

    <!-- 额外说明 -->
    <div class="additional-info">
      <el-input
        v-model="additionalNotes"
        type="textarea"
        :rows="3"
        placeholder="其他说明或补充信息（可选）"
        @input="handleNotesChange"
      />
    </div>

    <!-- 预览区域 -->
    <div v-if="showPreview" class="preview-section">
      <h4>数据预览</h4>
      <pre class="json-preview">{{ JSON.stringify(currentData, null, 2) }}</pre>
    </div>
  </div>
</template>

<script setup lang="ts">
import { ref, computed, onMounted } from 'vue'
import type { TechStackData, TechChoice } from '@/types'

interface Props {
  modelValue: TechStackData
  showPreview?: boolean
}

interface Emits {
  (e: 'update:modelValue', value: TechStackData): void
}

const props = withDefaults(defineProps<Props>(), {
  showPreview: false
})

const emit = defineEmits<Emits>()

// 预定义的技术分类
const predefinedCategories = [
  '前端框架',
  '后端框架', 
  '数据库',
  'UI组件库',
  'API文档管理',
  '身份验证',
  '消息队列',
  '实时通信',
  '部署方案',
  '版本控制',
  '测试工具',
  '日志管理',
  '缓存系统',
  '文件存储',
  '监控系统'
]

// 技术选型列表
const techChoices = ref<TechChoice[]>([])
// 附加说明
const additionalNotes = ref('')

// 计算属性 - 当前数据
const currentData = computed((): TechStackData => ({
  tech_choices: techChoices.value.filter(choice => 
    choice.category.trim() && choice.technology.trim()
  ),
  ai_suggestions: additionalNotes.value.trim() || undefined
}))

// 初始化数据
const initializeData = () => {
  if (props.modelValue.tech_choices?.length > 0) {
    techChoices.value = [...props.modelValue.tech_choices]
  } else {
    // 默认添加几个常用分类
    techChoices.value = [
      { category: '前端框架', technology: '', reason: '' },
      { category: '后端框架', technology: '', reason: '' },
      { category: '数据库', technology: '', reason: '' },
      { category: 'UI组件库', technology: '', reason: '' }
    ]
  }
  
  additionalNotes.value = props.modelValue.ai_suggestions || ''
}

// 添加新的技术选型
const addChoice = () => {
  techChoices.value.push({
    category: '',
    technology: '',
    reason: ''
  })
  handleChoiceChange()
}

// 删除技术选型
const removeChoice = (index: number) => {
  if (techChoices.value.length > 1) {
    techChoices.value.splice(index, 1)
    handleChoiceChange()
  }
}

// 处理选型变化
const handleChoiceChange = () => {
  emit('update:modelValue', currentData.value)
}

// 处理说明变化
const handleNotesChange = () => {
  emit('update:modelValue', currentData.value)
}

// 组件挂载时初始化
onMounted(() => {
  initializeData()
})
</script>

<style scoped>
.tech-stack-editor {
  border: 1px solid var(--border-color-lighter);
  border-radius: 8px;
  padding: 20px;
  background: white;
}

.editor-header {
  margin-bottom: 20px;
}

.editor-header h3 {
  margin: 0 0 8px 0;
  color: var(--color-text-primary);
  font-size: 16px;
}

.editor-header p {
  margin: 0;
  color: var(--color-text-secondary);
  font-size: 14px;
}

.tech-table {
  margin-bottom: 20px;
}

.table-header {
  display: grid;
  grid-template-columns: 140px 1fr 2fr 60px;
  gap: 12px;
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
  grid-template-columns: 140px 1fr 2fr 60px;
  gap: 12px;
  align-items: start;
  padding: 12px 0;
  border-bottom: 1px solid var(--border-color-lighter);
}

.table-cell {
  display: flex;
  align-items: center;
}

.table-cell.actions {
  justify-content: center;
}

.table-footer {
  padding-top: 16px;
  border-top: 1px solid var(--border-color-lighter);
  margin-top: 12px;
}

.additional-info {
  margin-bottom: 20px;
}

.preview-section {
  border-top: 1px solid var(--border-color-lighter);
  padding-top: 20px;
}

.preview-section h4 {
  margin: 0 0 12px 0;
  color: var(--color-text-primary);
  font-size: 14px;
}

.json-preview {
  background: var(--bg-color-light);
  border: 1px solid var(--border-color-lighter);
  border-radius: 6px;
  padding: 12px;
  font-family: 'Monaco', 'Menlo', 'Consolas', monospace;
  font-size: 12px;
  color: var(--color-text-secondary);
  overflow-x: auto;
  white-space: pre;
  max-height: 200px;
  overflow-y: auto;
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
    position: relative;
  }
  
  .table-cell::before {
    content: attr(data-label);
    position: absolute;
    left: 0;
    top: -20px;
    font-size: 12px;
    font-weight: 600;
    color: var(--color-text-secondary);
  }
  
  .table-cell.category::before {
    content: '分类';
  }
  
  .table-cell.technology::before {
    content: '技术选择';
  }
  
  .table-cell.reason::before {
    content: '选择理由';
  }
  
  .table-cell.actions::before {
    content: '';
  }
}
</style>