<template>
  <div
    class="task-card bg-white rounded-lg shadow-sm overflow-hidden hover:shadow-md transition-all duration-300 waterfall-item"
    draggable="true"
    @dragstart="onDragStart"
    @dragend="onDragEnd"
  >
    <!-- 卡片图片 -->
    <div v-if="task.image" :class="`card-image card-image-${task.id}`" :style="imageContainerStyle">
      <div
        v-if="!imageLoaded"
        class="image-placeholder bg-gray-200 flex items-center justify-center"
      >
        <el-icon class="text-gray-400 text-xl"><Picture /></el-icon>
      </div>
      <img
        :src="task.image"
        :alt="task.title"
        class="w-full object-cover"
        @load="onImageLoad"
        @error="onImageError"
        :style="imageLoaded ? '' : 'display: none;'"
      />
    </div>

    <!-- 卡片内容 -->
    <div class="card-content p-4">
      <!-- 标题 -->
      <h4 class="text-base font-medium text-gray-800 mb-3 line-clamp-2">{{ task.title }}</h4>

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
      <div class="card-footer flex justify-between items-center mt-3">
        <!-- 优先级标识 -->
        <div class="priority-indicator">
          <el-tag :type="priorityType" size="small" effect="plain" class="text-xs">
            {{ priorityText }}
          </el-tag>
        </div>

        <!-- 操作按钮 -->
        <div class="action-buttons flex">
          <el-button type="primary" size="small" circle plain @click.stop="$emit('edit')">
            <el-icon><Edit /></el-icon>
          </el-button>
          <el-button type="danger" size="small" circle plain @click.stop="$emit('delete')">
            <el-icon><Delete /></el-icon>
          </el-button>
        </div>
      </div>
    </div>
  </div>
</template>

<script setup lang="ts">
import { computed, onMounted, ref } from 'vue'
import { Picture, Edit, Delete } from '@element-plus/icons-vue'

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
  listIndex: number
  taskIndex: number
}>()

// 定义事件
const emit = defineEmits<{
  (e: 'edit'): void
  (e: 'delete'): void
  (e: 'image-loaded'): void
  (e: 'drag-start', event: DragEvent, listIndex: number, taskIndex: number): void
  (e: 'drag-end'): void
}>()

// 图片加载状态
const imageLoaded = ref(false)
const imageError = ref(false)

// 计算图片容器样式
const imageContainerStyle = computed(() => {
  if (props.task.height) {
    return {
      height: `${props.task.height / 2}px`,
    }
  }
  return {
    height: '150px', // 默认高度
  }
})

// 图片加载完成事件
const onImageLoad = () => {
  imageLoaded.value = true
  emit('image-loaded')
}

// 图片加载失败事件
const onImageError = () => {
  imageError.value = true
  imageLoaded.value = true // 即使加载失败也标记为已加载，以便移除占位符
  emit('image-loaded') // 即使加载失败也触发加载完成事件
}

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

// 拖拽开始事件
const onDragStart = (event: DragEvent) => {
  if (!event.dataTransfer) return

  // 设置拖拽数据
  event.dataTransfer.setData(
    'text/plain',
    JSON.stringify({
      listIndex: props.listIndex,
      taskIndex: props.taskIndex,
      taskId: props.task.id,
    }),
  )

  // 设置拖拽效果
  event.dataTransfer.effectAllowed = 'move'

  // 添加拖拽样式
  const element = event.target as HTMLElement
  setTimeout(() => {
    element.classList.add('chosen-card')
  }, 0)

  // 触发拖拽开始事件
  emit('drag-start', event, props.listIndex, props.taskIndex)
}

// 拖拽结束事件
const onDragEnd = () => {
  const element = event?.target as HTMLElement
  if (element) {
    element.classList.remove('chosen-card')
  }

  // 触发拖拽结束事件
  emit('drag-end')
}

// 组件挂载后预加载图片
onMounted(() => {
  if (props.task.image) {
    const img = new Image()
    img.onload = onImageLoad
    img.onerror = onImageError
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
  cursor: grab;
}

.task-card:hover {
  transform: translateY(-3px);
  box-shadow:
    0 10px 15px -3px rgba(0, 0, 0, 0.1),
    0 4px 6px -2px rgba(0, 0, 0, 0.05);
}

.card-image {
  position: relative;
  overflow: hidden;
}

.card-image img {
  width: 100%;
  object-fit: cover;
  border-top-left-radius: 12px;
  border-top-right-radius: 12px;
  pointer-events: none; /* 禁用图片的鼠标事件，确保拖拽事件由父元素处理 */
  user-select: none; /* 防止图片被选中 */
}

.image-placeholder {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
}

.task-card.chosen-card {
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
  opacity: 0.8;
}
</style>
