<template>
  <div class="task-card bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300">
    <!-- 卡片图片 -->
    <div v-if="task.image" :class="`card-image card-image-${task.id}`">
      <img :src="task.image" :alt="task.title" class="w-full object-cover">
    </div>
    
    <!-- 卡片内容 -->
    <div class="card-content p-3">
      <!-- 标题 -->
      <h4 class="text-base font-medium text-gray-800 mb-2 line-clamp-2">{{ task.title }}</h4>
      
      <!-- 描述 -->
      <p v-if="task.description" class="text-sm text-gray-600 mb-3 line-clamp-3">
        {{ task.description }}
      </p>
      
      <!-- 标签 -->
      <div v-if="task.tags && task.tags.length" class="tags-container flex flex-wrap gap-1 mb-3">
        <el-tag 
          v-for="(tag, index) in task.tags" 
          :key="index" 
          size="small" 
          effect="plain"
          class="text-xs"
        >
          {{ tag }}
        </el-tag>
      </div>
      
      <!-- 底部操作栏 -->
      <div class="card-footer flex justify-between items-center mt-2">
        <!-- 优先级标识 -->
        <div class="priority-indicator">
          <el-tag 
            :type="priorityType" 
            size="small" 
            effect="plain"
            class="text-xs"
          >
            {{ priorityText }}
          </el-tag>
        </div>
        
        <!-- 操作按钮 -->
        <div class="action-buttons flex gap-1">
          <el-button 
            type="primary" 
            size="small" 
            circle 
            plain
            @click="$emit('edit')"
          >
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button 
            type="danger" 
            size="small" 
            circle 
            plain
            @click="$emit('delete')"
          >
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'

// 定义任务类型
interface Task {
  id: number
  title: string
  description?: string
  image?: string
  tags?: string[]
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  height?: number
}

// 定义props
const props = defineProps<{
  task: Task
}>()

// 定义事件
defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
}>()

// 图片加载状态
const imageLoaded = ref(false)

// 计算优先级对应的类型
const priorityType = computed(() => {
  switch (props.task.priority) {
    case 'high':
      return 'danger'
    case 'medium':
      return 'warning'
    case 'low':
      return 'info'
    default:
      return 'info'
  }
})

// 计算优先级对应的文本
const priorityText = computed(() => {
  switch (props.task.priority) {
    case 'high':
      return '高优先级'
    case 'medium':
      return '中优先级'
    case 'low':
      return '低优先级'
    default:
      return '普通'
  }
})

// 组件挂载后设置图片高度
onMounted(() => {
  if (props.task.image) {
    const img = new Image()
    img.onload = () => {
      imageLoaded.value = true
      const imgElement = document.querySelector(`.card-image-${props.task.id} img`) as HTMLImageElement
      if (imgElement && props.task.height) {
        // 根据任务的height属性设置图片高度
        imgElement.style.height = `${props.task.height / 2}px`
      }
    }
    img.src = props.task.image
  }
})
</script>

<style scoped>
.task-card {
  transition: all 0.3s ease;
  display: inline-block;
  width: 100%;
  border-radius: 12px;
  overflow: hidden;
  margin-bottom: 12px;
  background-color: #fff;
  box-shadow: 0 2px 8px rgba(0, 0, 0, 0.05);
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow: 0 10px 15px -3px rgba(0, 0, 0, 0.1), 0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-image img {
  width: 100%;
  object-fit: cover;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
}

/* 文本截断 */
.line-clamp-2 {
  display: -webkit-box;
  -webkit-line-clamp: 2;
  -webkit-box-orient: vertical;
  overflow: hidden;
}

.line-clamp-3 {
  display: -webkit-box;
  -webkit-line-clamp: 3;
  -webkit-box-orient: vertical;
  overflow: hidden;
}
</style> 