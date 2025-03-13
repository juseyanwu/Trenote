<template>
  <div class="kanban-container">
    <!-- 全局加载状态 -->
    <div v-if="isLoading" class="global-loading-overlay">
      <div class="loading-content">
        <el-icon class="loading-icon"><Loading /></el-icon>
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
      <div 
        v-for="(list, listIndex) in lists" 
        :key="listIndex" 
        class="kanban-list bg-gray-100 rounded-lg shadow-md flex-shrink-0"
      >
        <!-- 列表标题 -->
        <div class="list-header p-4 border-b border-gray-200 flex justify-between items-center">
          <h3 class="font-semibold text-gray-700 text-lg">{{ list.title }} <span class="text-sm text-gray-500">({{ list.tasks.length }})</span></h3>
          <el-button type="primary" size="small" circle @click="addTask(listIndex)">
            <el-icon><Plus /></el-icon>
          </el-button>
        </div>
        
        <!-- 瀑布流任务卡片容器 -->
        <div class="waterfall-container p-4 max-h-[calc(100vh-180px)] overflow-y-auto">
          <div class="waterfall-wrapper" :id="`waterfall-${listIndex}`">
            <draggable
              :list="list.tasks" 
              :group="{ name: 'tasks', pull: true, put: true }"
              item-key="id"
              ghost-class="ghost-card"
              chosen-class="chosen-card"
              animation="300"
              @end="onDragEnd"
              :class="['min-h-[calc(100vh-250px)]', {'empty-list': list.tasks.length === 0}]"
            >
              <template #item="{ element, index }">
                <TaskCard 
                  :task="element"
                  @edit="editTask(listIndex, index)"
                  @delete="deleteTask(listIndex, index)"
                  class="waterfall-item"
                  @image-loaded="onTaskImageLoaded"
                />
              </template>
            </draggable>
          </div>
        </div>
      </div>
      
      <!-- 添加新列表按钮 -->
      <div class="add-list-btn flex-shrink-0" style="width: 380px;">
        <el-button type="primary" plain class="w-full" @click="addList">
          <el-icon class="mr-2"><Plus /></el-icon>添加新列表
        </el-button>
      </div>
    </div>
  </div>
  
  <!-- 任务详情对话框 -->
  <TaskDetailDialog
    v-model:visible="detailDialogVisible"
    :task="currentTask"
    :is-new-task="isNewTask"
    @save="saveTask"
  />
</template>

<script setup lang="ts">
import { ref, onMounted, nextTick, watch, computed } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Document, Loading } from '@element-plus/icons-vue'
import TaskCard from '../components/TaskCard.vue'
import TaskDetailDialog from '../components/TaskDetailDialog.vue'
import draggable from 'vuedraggable'
import { useKanbanStore } from '../stores/kanban'
import { storeToRefs } from 'pinia'
import type { List } from '../api/kanbanApi'

// 定义本地任务类型，与TaskDetailDialog组件兼容
interface Task {
  id: number
  list_id?: number
  title: string
  description?: string
  image?: string
  tags?: string[]
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  height?: number
  position?: number
}

// 使用Pinia存储
const kanbanStore = useKanbanStore()
const { lists, loading, error, initialized } = storeToRefs(kanbanStore)

// 加载状态
const isLoading = ref(true)
const totalImages = ref(0)
const loadedImages = ref(0)
const initializingDb = ref(false)

// 计算加载进度百分比
const loadingProgress = computed(() => {
  if (totalImages.value === 0) return 100
  return Math.min(Math.round((loadedImages.value / totalImages.value) * 100), 100)
})

// 计算需要加载的图片总数
const calculateTotalImages = () => {
  let count = 0
  lists.value.forEach(list => {
    list.tasks.forEach(task => {
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

// 任务详情对话框
const detailDialogVisible = ref(false)
const currentTask = ref<Task | undefined>(undefined)
const isNewTask = ref(false)
const currentListIndex = ref(0)
const currentTaskIndex = ref(0)

// 监听任务列表变化，重新布局瀑布流
watch(lists, () => {
  nextTick(() => {
    lists.value.forEach((_, listIndex) => {
      arrangeWaterfall(listIndex)
    })
  })
}, { deep: true })

// 组件挂载后初始化数据库和瀑布流布局
onMounted(async () => {
  // 初始化数据库
  if (!initialized.value) {
    initializingDb.value = true
    await kanbanStore.initDatabase()
    initializingDb.value = false
  }
  
  // 加载任务列表
  if (lists.value.length === 0) {
    await kanbanStore.fetchLists()
  }
  
  // 计算需要加载的图片总数
  totalImages.value = calculateTotalImages()
  
  // 如果没有图片需要加载，直接关闭加载状态
  if (totalImages.value === 0) {
    isLoading.value = false
  }
  
  nextTick(() => {
    lists.value.forEach((_, listIndex) => {
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

  const containerWidth = container.offsetWidth
  const columnWidth = 340 // 卡片宽度
  const columnGap = 12 // 列间距
  
  // 计算可以放置的列数
  const columnCount = 1 // 固定为1列，因为我们的列表宽度只适合一列卡片
  
  // 初始化列高度数组
  const columnHeights = Array(columnCount).fill(0)
  
  // 遍历所有卡片，放置到最短的列中
  items.forEach((item, index) => {
    const element = item as HTMLElement
    
    // 找到最短的列
    const minHeight = Math.min(...columnHeights)
    const minIndex = columnHeights.indexOf(minHeight)
    
    // 计算卡片位置
    const left = minIndex * (columnWidth + columnGap)
    const top = minHeight
    
    // 设置卡片位置
    element.style.left = `${left}px`
    element.style.top = `${top}px`
    
    // 更新列高度
    const itemHeight = element.offsetHeight + 12 // 卡片高度 + 底部间距
    columnHeights[minIndex] += itemHeight
  })
  
  // 设置容器高度为最高列的高度
  const maxHeight = Math.max(...columnHeights)
  container.style.height = `${maxHeight}px`
}

// 拖拽结束事件
const onDragEnd = (event: any) => {
  // 获取拖拽的任务和目标列表
  const { newIndex, oldIndex, from, to } = event
  
  // 如果是在同一列表内拖动，只需要更新任务顺序
  if (from === to) {
    const listIndex = parseInt(from.parentElement.id.split('-')[1])
    const list = lists.value[listIndex]
    
    // 更新任务位置
    const taskPositions = list.tasks.map((task, index) => ({
      id: task.id,
      position: index
    }))
    
    // 调用store方法更新任务顺序
    kanbanStore.updateTaskPositions(list.id, taskPositions)
  } else {
    // 如果是跨列表拖动，需要更新任务所属列表
    const sourceListIndex = parseInt(from.parentElement.id.split('-')[1])
    const targetListIndex = parseInt(to.parentElement.id.split('-')[1])
    
    const sourceList = lists.value[sourceListIndex]
    const targetList = lists.value[targetListIndex]
    const task = targetList.tasks[newIndex]
    
    // 调用store方法移动任务
    kanbanStore.moveTask(task.id, sourceList.id, targetList.id, newIndex)
  }
  
  // 重新布局瀑布流
  nextTick(() => {
    lists.value.forEach((_, listIndex) => {
      arrangeWaterfall(listIndex)
    })
  })
}

// 添加新列表
const addList = async () => {
  ElMessageBox.prompt('请输入列表标题', '添加新列表', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    inputPattern: /\S+/,
    inputErrorMessage: '标题不能为空'
  }).then(async ({ value }) => {
    const newList = await kanbanStore.createList(value)
    if (newList) {
      ElMessage({
        type: 'success',
        message: `成功添加列表: ${value}`
      })
      
      // 重新布局瀑布流
      nextTick(() => {
        const listIndex = lists.value.length - 1
        arrangeWaterfall(listIndex)
      })
    }
  }).catch(() => {})
}

// 添加新任务
const addTask = (listIndex: number) => {
  const list = lists.value[listIndex]
  currentListIndex.value = listIndex
  currentTask.value = {
    id: 0, // 后端会生成实际ID
    list_id: list.id,
    title: '',
    description: '',
    tags: [],
    priority: 'medium',
    position: 0, // 后端会计算正确的位置
    height: 300
  }
  isNewTask.value = true
  detailDialogVisible.value = true
}

// 编辑任务
const editTask = (listIndex: number, taskIndex: number) => {
  currentListIndex.value = listIndex
  currentTaskIndex.value = taskIndex
  currentTask.value = { ...lists.value[listIndex].tasks[taskIndex] }
  isNewTask.value = false
  detailDialogVisible.value = true
}

// 保存任务
const saveTask = (task: Task) => {
  if (isNewTask.value) {
    // 添加新任务
    if (task.list_id) {
      kanbanStore.createTask({
        list_id: task.list_id,
        title: task.title,
        description: task.description,
        image: task.image,
        tags: task.tags,
        priority: task.priority as string,
        height: task.height
      }).then(newTask => {
        if (newTask) {
          ElMessage({
            type: 'success',
            message: `成功添加任务: ${task.title}`
          })
          
          // 重新布局瀑布流
          nextTick(() => {
            arrangeWaterfall(currentListIndex.value)
          })
        }
      })
    }
  } else {
    // 更新现有任务
    kanbanStore.updateTask(task.id, {
      title: task.title,
      description: task.description,
      image: task.image,
      tags: task.tags,
      priority: task.priority as string,
      height: task.height
    }).then(updatedTask => {
      if (updatedTask) {
        ElMessage({
          type: 'success',
          message: '任务已更新'
        })
        
        // 重新布局瀑布流
        nextTick(() => {
          arrangeWaterfall(currentListIndex.value)
        })
      }
    })
  }
}

// 删除任务
const deleteTask = (listIndex: number, taskIndex: number) => {
  const task = lists.value[listIndex].tasks[taskIndex]
  
  ElMessageBox.confirm('确定要删除这个任务吗?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(async () => {
    const success = await kanbanStore.deleteTask(task.id)
    if (success) {
      ElMessage({
        type: 'success',
        message: '任务已删除'
      })
      
      // 重新布局瀑布流
      nextTick(() => {
        arrangeWaterfall(listIndex)
      })
    }
  }).catch(() => {})
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

.loading-content {
  display: flex;
  flex-direction: column;
  align-items: center;
  background-color: white;
  padding: 30px;
  border-radius: 12px;
  box-shadow: 0 4px 12px rgba(0, 0, 0, 0.1);
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
  color: #606266;
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

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
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
  transition: transform 0.3s ease, top 0.3s ease, left 0.3s ease;
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