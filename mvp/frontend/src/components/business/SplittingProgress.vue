<template>
  <div class="splitting-progress">
    <div class="progress-container">
      <div 
        v-for="(step, index) in steps" 
        :key="step.key"
        class="progress-step"
        :class="{
          'active': step.key === currentStep,
          'completed': step.completed
        }"
      >
        <div class="step-indicator">
          <div class="step-number">
            <el-icon v-if="step.completed" class="check-icon">
              <Check />
            </el-icon>
            <span v-else>{{ index + 1 }}</span>
          </div>
          <div class="step-connector" v-if="index < steps.length - 1"></div>
        </div>
        <div class="step-label">{{ step.label }}</div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { Check } from '@element-plus/icons-vue'

interface ProgressStep {
  key: string
  label: string
  completed: boolean
}

defineProps<{
  steps: ProgressStep[]
  currentStep: string
}>()
</script>

<style scoped>
.splitting-progress {
  max-width: 800px;
  margin: 0 auto;
}

.progress-container {
  display: flex;
  align-items: flex-start;
  justify-content: space-between;
  position: relative;
}

.progress-step {
  flex: 1;
  display: flex;
  flex-direction: column;
  align-items: center;
  position: relative;
}

.step-indicator {
  display: flex;
  align-items: center;
  position: relative;
  width: 100%;
  justify-content: center;
}

.step-number {
  width: 32px;
  height: 32px;
  border-radius: 50%;
  display: flex;
  align-items: center;
  justify-content: center;
  font-size: 14px;
  font-weight: 500;
  background: var(--color-fill-lighter);
  color: var(--color-text-secondary);
  border: 2px solid var(--border-color-lighter);
  transition: all 0.3s ease;
  z-index: 2;
  position: relative;
}

.progress-step.active .step-number {
  background: var(--color-primary);
  color: white;
  border-color: var(--color-primary);
}

.progress-step.completed .step-number {
  background: var(--color-success);
  color: white;
  border-color: var(--color-success);
}

.check-icon {
  font-size: 16px;
}

.step-connector {
  position: absolute;
  top: 50%;
  left: calc(50% + 16px);
  right: calc(-50% + 16px);
  height: 2px;
  background: var(--border-color-lighter);
  transform: translateY(-50%);
  z-index: 1;
}

.progress-step.completed .step-connector {
  background: var(--color-success);
}

.step-label {
  margin-top: 8px;
  font-size: 14px;
  color: var(--color-text-secondary);
  text-align: center;
  white-space: nowrap;
}

.progress-step.active .step-label {
  color: var(--color-primary);
  font-weight: 500;
}

.progress-step.completed .step-label {
  color: var(--color-success);
}

/* 响应式调整 */
@media (max-width: 768px) {
  .progress-container {
    flex-direction: column;
    gap: 16px;
  }
  
  .step-connector {
    display: none;
  }
  
  .progress-step {
    flex-direction: row;
    align-items: center;
    justify-content: flex-start;
    width: 100%;
  }
  
  .step-indicator {
    width: auto;
    margin-right: 12px;
  }
  
  .step-label {
    margin-top: 0;
    text-align: left;
  }
}
</style>