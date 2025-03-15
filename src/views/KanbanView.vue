<template>
  <div class="kanban-container">
    <!-- 全局加载状态 -->
    <div v-if="isLoading" class="global-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon">
          <Loading />
        </el-icon>
        <div class="loading-text">正在加载任务列表...</div>

        <!-- 加载进度条 -->
        <div class="progress-container">
          <div class="progress-bar" :style="{ width: `${loadingProgress}%` }"></div>
        </div>

        <!-- 加载进度百分比 -->
        <div class="progress-text">{{ loadingProgress }}%</div>
      </div>
    </div>

    <div class="flex overflow-x-auto pb-4 pt-2 px-2 gap-8">
      <!-- 任务列表容器 -->
      <div v-for="(list, listIndex) in taskLists" :key="listIndex"
        class="kanban-list bg-gray-100 dark:bg-gray-800 rounded-lg shadow-md flex-shrink-0">
        <!-- 列表标题 -->

        <div class="list-header p-4 border-b border-gray-200 dark:border-gray-700 flex justify-between items-center">
          <h3 class="font-semibold text-gray-700 dark:text-gray-200 text-lg">
            {{ list.title }} <span class="text-sm text-gray-500 dark:text-gray-400">({{ list.tasks.length }})</span>
          </h3>
          <el-button type="primary" size="small" circle @click="addTask(listIndex)">
            <el-icon>
              <Plus />
            </el-icon>
          </el-button>
        </div>

        <!-- 瀑布流任务卡片容器 -->
        <div class="waterfall-container p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          <div class="waterfall-wrapper" :id="`waterfall-${listIndex}`">
            <DraggableContainer v-model="list.tasks" :group="{ name: 'tasks', pull: true, put: true }"
              :data-list-id="listIndex.toString()" @end="onDragEnd"
              :class="['min-h-[calc(100vh-250px)]', { 'empty-list': list.tasks.length === 0 }]">
              <DraggableTaskCard v-for="(task, index) in list.tasks" :key="task.id" :task="task" :list-index="listIndex"
                :task-index="index" @edit="editTask(listIndex, index)" @delete="deleteTask(listIndex, index)"
                @image-loaded="onTaskImageLoaded" draggable="true" @drag-start="(event, listIndex, taskIndex) => onTaskDragStart(event, listIndex, taskIndex)
      " @drag-end="onTaskDragEnd" class="waterfall-item" />
            </DraggableContainer>
          </div>
        </div>
      </div>

      <!-- 添加新列表按钮 -->
      <div class="add-list-btn flex-shrink-0" style="width: 380px">
        <el-button type="primary" plain class="w-full" @click="addList">
          <el-icon class="mr-2">
            <Plus />
          </el-icon>添加新列表
        </el-button>
      </div>
    </div>
  </div>

  <!-- 任务详情对话框 -->
  <TaskDetailDialog v-model:visible="detailDialogVisible" :task="currentTask" :is-new-task="isNewTask"
    @save="saveTask" />
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Loading } from '@element-plus/icons-vue'
import TaskDetailDialog from '../components/TaskDetailDialog.vue'
import DraggableTaskCard from '../components/DraggableTaskCard.vue'
import DraggableContainer from '../components/DraggableContainer.vue'

import { useKanbanStore } from '../stores/kanban'
import type { Task } from '../stores/kanban'
const kanbanStore = useKanbanStore()
// 加载状态
const isLoading = ref(true)
const totalImages = ref(0)
const loadedImages = ref(0)

// 计算加载进度百分比
const loadingProgress = computed(() => {
  if (totalImages.value === 0) return 100
  return Math.min(Math.round((loadedImages.value / totalImages.value) * 100), 100)
})

// 计算需要加载的图片总数
const calculateTotalImages = () => {
  let count = 0
  taskLists.value.forEach((list) => {
    list.tasks.forEach((task) => {
      if (task.image) count++
    })
  })
  return count
}

// 任务图片加载完成事件
const onTaskImageLoaded = () => {
  loadedImages.value++
  if (loadedImages.value >= totalImages.value) {
    // 所有图片加载完成，关闭加载状态
    setTimeout(() => {
      isLoading.value = false
    }, 500) // 添加短暂延迟，确保布局已完成
  }
}

// 使用Pinia store中的任务列表数据
const taskLists = computed(() => kanbanStore.taskLists)

// 监听任务列表变化，重新布局瀑布流
watch(
  taskLists,
  () => {
    nextTick(() => {
      taskLists.value.forEach((_, listIndex) => {
        arrangeWaterfall(listIndex)
      })
    })
  },
  { deep: true },
)

// 组件挂载后初始化瀑布流布局
onMounted(() => {
  // 计算需要加载的图片总数
  totalImages.value = calculateTotalImages()

  // 重置已加载图片计数
  loadedImages.value = 0

  // 如果没有图片需要加载，直接关闭加载状态
  if (totalImages.value === 0) {
    isLoading.value = false
  }

  nextTick(() => {
    taskLists.value.forEach((_, listIndex) => {
      arrangeWaterfall(listIndex)
    })
  })
})

// 瀑布流布局函数
const arrangeWaterfall = (listIndex: number) => {
  const container = document.getElementById(`waterfall-${listIndex}`)
  if (!container) return

  const items = container.querySelectorAll('.waterfall-item')
  if (items.length === 0) return

  // 重置所有卡片的位置
  items.forEach((item) => {
    const cardElement = item as HTMLElement
    cardElement.style.position = 'absolute'
    cardElement.style.transition = 'transform 0.5s ease, top 0.5s ease, left 0.5s ease'
  })

  const containerWidth = container.clientWidth
  const columnCount = 2 // 两列
  const columnWidth = containerWidth / columnCount
  const columnGap = 12 // 列间距

  // 检查所有图片是否加载完成
  const checkImagesLoaded = () => {
    const images = container.querySelectorAll('img')
    let allLoaded = true

    // 如果没有图片，直接返回true
    if (images.length === 0) return true

    images.forEach((img) => {
      if (!img.complete) {
        allLoaded = false
      }
    })

    return allLoaded
  }

  // 如果图片未加载完成，等待所有图片加载后再布局
  if (!checkImagesLoaded()) {
    const images = container.querySelectorAll('img')
    let loadedCount = 0

    const onImageLoad = () => {
      loadedCount++
      if (loadedCount === images.length) {
        // 所有图片加载完成，执行布局
        performLayout()
      }
    }

    images.forEach((img) => {
      if (img.complete) {
        loadedCount++
      } else {
        img.addEventListener('load', onImageLoad)
        // 添加错误处理，防止图片加载失败导致布局无法完成
        img.addEventListener('error', onImageLoad)
      }
    })

    // 如果所有图片已经加载完成，直接执行布局
    if (loadedCount === images.length) {
      performLayout()
    }
  } else {
    // 没有图片或所有图片已加载完成，直接执行布局
    performLayout()
  }

  // 执行瀑布流布局
  function performLayout() {
    // 初始化每列的高度
    const columnHeights = Array(columnCount).fill(0)

    // 为每个卡片分配位置
    items.forEach((item) => {
      const cardElement = item as HTMLElement
      // 找出最短的列
      const minHeightIndex = columnHeights.indexOf(Math.min(...columnHeights))

      // 计算位置
      const left = minHeightIndex * columnWidth + (minHeightIndex * columnGap) / 2
      const top = columnHeights[minHeightIndex]

      // 设置卡片位置
      cardElement.style.left = `${left}px`
      cardElement.style.top = `${top}px`
      cardElement.style.width = `${columnWidth - columnGap}px`

      // 更新列高度
      columnHeights[minHeightIndex] += cardElement.clientHeight + 12 // 12px是卡片间的垂直间距
    })
    // 设置容器高度为最高列的高度
    if (container) {
      container.style.height = `${Math.max(...columnHeights)}px`
    }
  }
}

// 拖拽开始事件处理
const onTaskDragStart = (event: DragEvent, listIndex: number, taskIndex: number) => {
  // 可以在这里添加额外的拖拽开始逻辑
  console.log('Drag started:', listIndex, taskIndex)
}

// 拖拽结束事件处理
const onTaskDragEnd = () => {
  // 可以在这里添加额外的拖拽结束逻辑
  console.log('Drag ended')
}

// 拖拽结束事件处理（从一个列表到另一个列表）
const onDragEnd = (event: never) => {
  const { from, to, oldIndex, newIndex } = event

  // 将数字字符串转换为数字
  const fromListIndex = parseInt(from)
  const toListIndex = parseInt(to)

  if (!isNaN(fromListIndex) && !isNaN(toListIndex)) {
    // 获取要移动的任务
    const task = taskLists.value[fromListIndex].tasks[oldIndex]

    // 从源列表中移除任务
    kanbanStore.deleteTask(fromListIndex, oldIndex)

    // 添加到目标列表
    kanbanStore.addTaskAtIndex(toListIndex, task, newIndex)

    ElMessage({
      type: 'success',
      message: '任务已移动',
    })

    // 重新布局瀑布流
    nextTick(() => {
      taskLists.value.forEach((_, listIndex) => {
        arrangeWaterfall(listIndex)
      })
    })
  }
}

// 添加新列表
const addList = () => {
  ElMessageBox.prompt('请输入列表名称', '添加新列表', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  })
    .then(({ value }) => {
      if (value) {
        kanbanStore.addList(value)
        ElMessage({
          type: 'success',
          message: `成功创建列表: ${value}`,
        })
      }
    })
    .catch(() => { })
}

// 任务详情对话框相关
const detailDialogVisible = ref(false)
const currentTask = ref<Task | undefined>(undefined)
const currentListIndex = ref<number>(-1)
const currentTaskIndex = ref<number>(-1)
const isNewTask = ref(false)

// 添加新任务
const addTask = (listIndex: number) => {
  currentListIndex.value = listIndex
  currentTask.value = {
    id: Date.now(),
    title: '',
    description: '',
    tags: [],
    priority: 'medium',
    height: 0,
  }
  isNewTask.value = true
  detailDialogVisible.value = true
}

// 编辑任务
const editTask = (listIndex: number, taskIndex: number) => {
  currentListIndex.value = listIndex
  currentTaskIndex.value = taskIndex
  currentTask.value = { ...taskLists.value[listIndex].tasks[taskIndex] }
  isNewTask.value = false
  detailDialogVisible.value = true
}

// 保存任务
const saveTask = (task: Task) => {
  if (isNewTask.value) {
    // 添加新任务
    kanbanStore.addTask(currentListIndex.value, task)
    ElMessage({
      type: 'success',
      message: `成功添加任务: ${task.title}`,
    })
  } else {
    // 更新现有任务
    kanbanStore.updateTask(currentListIndex.value, currentTaskIndex.value, task)
    ElMessage({
      type: 'success',
      message: '任务已更新',
    })
  }
  // Pinia store已经处理了数据持久化，不需要再调用saveTaskListsToStorage
}

// 删除任务
const deleteTask = (listIndex: number, taskIndex: number) => {
  ElMessageBox.confirm('确定要删除这个任务吗?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning',
  })
    .then(() => {
      kanbanStore.deleteTask(listIndex, taskIndex)
      ElMessage({
        type: 'success',
        message: '任务已删除',
      })
      // Pinia store已经处理了数据持久化，不需要再调用saveTaskListsToStorage
    })
    .catch(() => { })
}
</script>

<style scoped>
.kanban-container {
  height: calc(100vh - 120px);
  padding: 0 10px;
  position: relative;
}

.global-loading-overlay {
  position: absolute;
  top: 0;
  left: 0;
  right: 0;
  bottom: 0;
  background-color: rgba(255, 255, 255, 0.8);
  display: flex;
  justify-content: center;
  align-items: center;
  z-index: 100;
  backdrop-filter: blur(3px);
}

.dark .global-loading-overlay {
  background-color: rgba(0, 0, 0, 0.7);
}

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: var(--card-bg);
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px var(--shadow-color);
  min-width: 300px;
}

.loading-icon {
  font-size: 40px;
  color: #409eff;
  animation: spin 1.5s linear infinite;
  margin-bottom: 16px;
}

.loading-text {
  font-size: 16px;
  color: var(--text-color);
  margin-bottom: 20px;
}

.progress-container {
  width: 100%;
  height: 8px;
  background-color: #f0f0f0;
  border-radius: 4px;
  overflow: hidden;
  margin-bottom: 8px;
}

.dark .progress-container {
  background-color: #3a3a3a;
}

.progress-bar {
  height: 100%;
  background-color: #409eff;
  border-radius: 4px;
  transition: width 0.3s ease;
}

.progress-text {
  font-size: 14px;
  color: #909399;
  font-weight: 500;
}

.dark .progress-text {
  color: #a0a0a0;
}

@keyframes spin {
  0% {
    transform: rotate(0deg);
  }

  100% {
    transform: rotate(360deg);
  }
}

.kanban-list {
  display: flex;
  flex-direction: column;
  width: 380px;
  min-width: 380px;
  max-width: 380px;
  border-radius: 10px;
}

.waterfall-container {
  height: calc(100vh - 180px);
  overflow-y: auto;
}

.waterfall-wrapper {
  position: relative;
  width: 100%;
  min-height: 100px;
  padding: 5px;
}

/* 瀑布流卡片样式 */
:deep(.waterfall-item) {
  position: absolute;
  transition:
    transform 0.3s ease,
    top 0.3s ease,
    left 0.3s ease;
}

/* 空列表样式 */
:deep(.empty-list) {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 250px);
  width: 100%;
  border-radius: 8px;
}

/* 拖拽样式 */
.ghost-card {
  opacity: 0.5;
  background: #c8ebfb;
  border: 1px dashed #409eff;
}

.dark .ghost-card {
  background: #2a4b5f;
  border: 1px dashed #409eff;
}

.chosen-card {
  transform: scale(1.02) !important;
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
  z-index: 10;
}

/* 媒体查询，在小屏幕上显示单列 */
@media (max-width: 640px) {
  .kanban-list {
    width: 320px;
    min-width: 320px;
    max-width: 320px;
  }
}
</style>
