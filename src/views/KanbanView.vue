<template>
  <div class="kanban-container">
    <div class="flex overflow-x-auto pb-4 pt-2 px-2 gap-8">
      <!-- 任务列表容器 -->
      <div 
        v-for="(list, listIndex) in taskLists" 
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
          <div class="waterfall-wrapper">
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
import { ref } from 'vue'
import { ElMessageBox, ElMessage } from 'element-plus'
import { Plus, Document } from '@element-plus/icons-vue'
import TaskCard from '../components/TaskCard.vue'
import TaskDetailDialog from '../components/TaskDetailDialog.vue'
import draggable from 'vuedraggable'

// 定义任务类型
interface Task {
  id: number
  title: string
  description?: string
  image?: string
  tags?: string[]
  dueDate?: Date
  priority?: 'low' | 'medium' | 'high'
  height?: number // 用于瀑布流布局
}

// 定义任务列表类型
interface TaskList {
  title: string
  tasks: Task[]
}

// 示例数据
const taskLists = ref<TaskList[]>([
  {
    title: '待办事项',
    tasks: [
      {
        id: 1,
        title: '完成项目设计',
        description: '设计看板应用的UI和交互',
        image: 'https://picsum.photos/300/200?random=1',
        tags: ['设计', 'UI'],
        priority: 'high',
        height: 280
      },
      {
        id: 2,
        title: '研究瀑布流布局',
        description: '学习如何实现小红书风格的瀑布流',
        image: 'https://picsum.photos/300/350?random=2',
        tags: ['研究', '布局'],
        priority: 'medium',
        height: 380
      },
      {
        id: 3,
        title: '准备周会演示',
        description: '准备下周的项目进度演示',
        image: 'https://picsum.photos/300/250?random=3',
        tags: ['会议', '演示'],
        priority: 'low',
        height: 320
      },
      {
        id: 11,
        title: '学习Vue 3组合式API',
        description: '深入理解Vue 3的组合式API和响应式系统',
        image: 'https://picsum.photos/300/220?random=11',
        tags: ['学习', 'Vue3'],
        priority: 'medium',
        height: 300
      },
      {
        id: 12,
        title: '阅读Tailwind CSS文档',
        description: '学习Tailwind CSS的使用技巧和最佳实践',
        image: 'https://picsum.photos/300/280?random=12',
        tags: ['CSS', '文档'],
        priority: 'low',
        height: 340
      },
      {
        id: 13,
        title: '探索Element Plus组件库',
        description: '了解Element Plus提供的各种组件和功能',
        image: 'https://picsum.photos/300/260?random=13',
        tags: ['UI库', '组件'],
        priority: 'medium',
        height: 320
      }
    ]
  },
  {
    title: '进行中',
    tasks: [
      {
        id: 4,
        title: '实现拖拽功能',
        description: '添加任务卡片的拖拽功能',
        image: 'https://picsum.photos/300/280?random=4',
        tags: ['功能', '交互'],
        priority: 'medium',
        height: 340
      },
      {
        id: 5,
        title: '优化移动端体验',
        description: '确保在移动设备上有良好的用户体验',
        image: 'https://picsum.photos/300/220?random=5',
        tags: ['移动端', '优化'],
        priority: 'high',
        height: 300
      },
      {
        id: 14,
        title: '编写单元测试',
        description: '为关键组件编写单元测试，确保代码质量',
        image: 'https://picsum.photos/300/240?random=14',
        tags: ['测试', '质量'],
        priority: 'high',
        height: 310
      },
      {
        id: 15,
        title: '实现数据持久化',
        description: '使用localStorage或IndexedDB存储任务数据',
        image: 'https://picsum.photos/300/260?random=15',
        tags: ['存储', '功能'],
        priority: 'medium',
        height: 330
      },
      {
        id: 16,
        title: '添加主题切换功能',
        description: '实现明暗主题切换，提升用户体验',
        image: 'https://picsum.photos/300/230?random=16',
        tags: ['主题', 'UI'],
        priority: 'low',
        height: 290
      }
    ]
  },
  {
    title: '已完成',
    tasks: [
      {
        id: 6,
        title: '项目初始化',
        description: '设置Vue 3项目和安装依赖',
        image: 'https://picsum.photos/300/240?random=6',
        tags: ['初始化', '配置'],
        priority: 'high',
        height: 310
      },
      {
        id: 7,
        title: '设计数据结构',
        description: '规划应用的数据模型和状态管理',
        image: 'https://picsum.photos/300/260?random=7',
        tags: ['设计', '数据'],
        priority: 'medium',
        height: 320
      },
      {
        id: 8,
        title: '创建基础组件',
        description: '开发应用所需的基础UI组件',
        image: 'https://picsum.photos/300/230?random=8',
        tags: ['组件', '开发'],
        priority: 'medium',
        height: 300
      },
      {
        id: 9,
        title: '配置路由系统',
        description: '使用Vue Router设置应用路由',
        image: 'https://picsum.photos/300/250?random=9',
        tags: ['路由', '配置'],
        priority: 'low',
        height: 310
      },
      {
        id: 10,
        title: '集成Element Plus',
        description: '引入Element Plus组件库并配置主题',
        image: 'https://picsum.photos/300/270?random=10',
        tags: ['UI库', '集成'],
        priority: 'high',
        height: 330
      }
    ]
  },
  {
    title: '待评审',
    tasks: [
      {
        id: 17,
        title: '优化性能',
        description: '分析并优化应用性能，减少不必要的渲染',
        image: 'https://picsum.photos/300/240?random=17',
        tags: ['性能', '优化'],
        priority: 'high',
        height: 310
      },
      {
        id: 18,
        title: '重构代码',
        description: '重构部分组件代码，提高可维护性',
        image: 'https://picsum.photos/300/220?random=18',
        tags: ['重构', '代码质量'],
        priority: 'medium',
        height: 290
      },
      {
        id: 19,
        title: '添加动画效果',
        description: '为用户交互添加平滑的过渡动画',
        image: 'https://picsum.photos/300/260?random=19',
        tags: ['动画', 'UI'],
        priority: 'low',
        height: 320
      },
      {
        id: 20,
        title: '编写文档',
        description: '编写项目文档和使用说明',
        image: 'https://picsum.photos/300/230?random=20',
        tags: ['文档', '说明'],
        priority: 'medium',
        height: 300
      }
    ]
  },
  {
    title: '已归档',
    tasks: [
      {
        id: 21,
        title: '需求分析',
        description: '分析项目需求并确定功能范围',
        image: 'https://picsum.photos/300/250?random=21',
        tags: ['需求', '分析'],
        priority: 'high',
        height: 320
      },
      {
        id: 22,
        title: '技术选型',
        description: '评估并选择适合项目的技术栈',
        image: 'https://picsum.photos/300/230?random=22',
        tags: ['技术', '决策'],
        priority: 'high',
        height: 300
      },
      {
        id: 23,
        title: '原型设计',
        description: '设计应用的交互原型',
        image: 'https://picsum.photos/300/270?random=23',
        tags: ['设计', '原型'],
        priority: 'medium',
        height: 330
      },
      {
        id: 24,
        title: '项目计划',
        description: '制定项目开发计划和时间表',
        image: 'https://picsum.photos/300/240?random=24',
        tags: ['计划', '管理'],
        priority: 'medium',
        height: 310
      }
    ]
  }
])

// 拖拽结束事件处理
const onDragEnd = () => {
  ElMessage({
    type: 'success',
    message: '任务已移动'
  })
}

// 添加新列表
const addList = () => {
  ElMessageBox.prompt('请输入列表名称', '添加新列表', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
  }).then(({ value }) => {
    if (value) {
      taskLists.value.push({
        title: value,
        tasks: []
      })
      ElMessage({
        type: 'success',
        message: `成功创建列表: ${value}`
      })
    }
  }).catch(() => {})
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
    height: 0
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
    taskLists.value[currentListIndex.value].tasks.push(task)
    ElMessage({
      type: 'success',
      message: `成功添加任务: ${task.title}`
    })
  } else {
    // 更新现有任务
    taskLists.value[currentListIndex.value].tasks[currentTaskIndex.value] = task
    ElMessage({
      type: 'success',
      message: '任务已更新'
    })
  }
}

// 删除任务
const deleteTask = (listIndex: number, taskIndex: number) => {
  ElMessageBox.confirm('确定要删除这个任务吗?', '警告', {
    confirmButtonText: '确认',
    cancelButtonText: '取消',
    type: 'warning'
  }).then(() => {
    taskLists.value[listIndex].tasks.splice(taskIndex, 1)
    ElMessage({
      type: 'success',
      message: '任务已删除'
    })
  }).catch(() => {})
}
</script>

<style scoped>
.kanban-container {
  height: calc(100vh - 120px);
  padding: 0 10px;
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
  column-count: 2;
  column-gap: 12px;
  padding: 5px;
}

/* 确保卡片不会被分割到多列 */
:deep(.task-card) {
  break-inside: avoid;
  margin-bottom: 12px;
  width: 100%;
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
  transform: scale(1.02);
  box-shadow: 0 0 10px rgba(0, 0, 0, 0.2);
}

/* 媒体查询，在小屏幕上显示单列 */
@media (max-width: 640px) {
  .waterfall-wrapper {
    column-count: 1;
  }
  
  .kanban-list {
    width: 320px;
    min-width: 320px;
    max-width: 320px;
  }
}
</style> 