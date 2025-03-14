import { defineStore } from 'pinia'
import { ref, watch } from 'vue'
import { ElMessage } from 'element-plus'

// 定义任务类型
export interface Task {
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
export interface TaskList {
  title: string
  tasks: Task[]
}

// 默认示例数据
const defaultTaskLists: TaskList[] = [
  {
    title: '待办事项',
    tasks: [
      {
        id: 1,
        title: '完成项目设计',
        description: '设计看板应用的UI和交互',
        image: 'https://jelzzunj1rsba6li.public.blob.vercel-storage.com/trenote-0-xcNMtIByXuKgIOQkuHfmURORNtzkz1',
        tags: ['设计', 'UI'],
        priority: 'high',
        height: 280,
      },
      {
        id: 2,
        title: '研究瀑布流布局',
        description: '学习如何实现小红书风格的瀑布流',
        image: 'https://picsum.photos/300/350?random=2',
        tags: ['研究', '布局'],
        priority: 'medium',
        height: 380,
      },
      {
        id: 3,
        title: '准备周会演示',
        description: '准备下周的项目进度演示',
        image: 'https://jelzzunj1rsba6li.public.blob.vercel-storage.com/trenote-0-xcNMtIByXuKgIOQkuHfmURORNtzkz1',
        tags: ['会议', '演示'],
        priority: 'low',
        height: 320,
      },
      {
        id: 11,
        title: '学习Vue 3组合式API',
        description: '深入理解Vue 3的组合式API和响应式系统',
        image: 'https://picsum.photos/300/220?random=11',
        tags: ['学习', 'Vue3'],
        priority: 'medium',
        height: 300,
      },
      {
        id: 12,
        title: '阅读Tailwind CSS文档',
        description: '学习Tailwind CSS的使用技巧和最佳实践',
        image: 'https://picsum.photos/300/280?random=12',
        tags: ['CSS', '文档'],
        priority: 'low',
        height: 340,
      },
      {
        id: 13,
        title: '探索Element Plus组件库',
        description: '了解Element Plus提供的各种组件和功能',
        image: 'https://picsum.photos/300/260?random=13',
        tags: ['UI库', '组件'],
        priority: 'medium',
        height: 320,
      },
    ],
  },
  {
    title: '进行中',
    tasks: [
      {
        id: 4,
        title: '实现拖拽功能',
        description: '使用Vue Draggable实现任务拖拽排序',
        image: 'https://picsum.photos/300/280?random=4',
        tags: ['开发', '功能'],
        priority: 'high',
        height: 340,
      },
      {
        id: 5,
        title: '集成Element Plus',
        description: '将Element Plus组件库集成到项目中',
        image: 'https://picsum.photos/300/220?random=5',
        tags: ['UI', '集成'],
        priority: 'medium',
        height: 290,
      },
      {
        id: 14,
        title: '优化移动端适配',
        description: '确保应用在移动设备上有良好的体验',
        image: 'https://picsum.photos/300/240?random=14',
        tags: ['移动端', '适配'],
        priority: 'high',
        height: 310,
      },
      {
        id: 15,
        title: '添加主题切换功能',
        description: '实现明暗主题切换功能',
        image: 'https://picsum.photos/300/260?random=15',
        tags: ['主题', '功能'],
        priority: 'low',
        height: 320,
      },
    ],
  },
  {
    title: '已完成',
    tasks: [
      {
        id: 6,
        title: '项目初始化',
        description: '使用Vite创建Vue 3项目',
        image: 'https://picsum.photos/300/260?random=6',
        tags: ['初始化', 'Vite'],
        priority: 'high',
        height: 330,
      },
      {
        id: 7,
        title: '配置路由',
        description: '使用Vue Router配置应用路由',
        image: 'https://picsum.photos/300/240?random=7',
        tags: ['路由', '配置'],
        priority: 'medium',
        height: 310,
      },
      {
        id: 8,
        title: '设置Tailwind CSS',
        description: '集成并配置Tailwind CSS',
        image: 'https://picsum.photos/300/220?random=8',
        tags: ['CSS', '配置'],
        priority: 'medium',
        height: 290,
      },
      {
        id: 16,
        title: '创建基础组件',
        description: '开发应用所需的基础UI组件',
        image: 'https://picsum.photos/300/250?random=16',
        tags: ['组件', '开发'],
        priority: 'high',
        height: 320,
      },
      {
        id: 17,
        title: '编写单元测试',
        description: '为核心功能编写单元测试',
        image: 'https://picsum.photos/300/230?random=17',
        tags: ['测试', '质量'],
        priority: 'medium',
        height: 300,
      },
    ],
  },
  {
    title: '待评审',
    tasks: [
      {
        id: 9,
        title: '看板视图实现',
        description: '实现看板的基本视图和布局',
        image: 'https://picsum.photos/300/270?random=9',
        tags: ['视图', '布局'],
        priority: 'high',
        height: 340,
      },
      {
        id: 10,
        title: '任务卡片组件',
        description: '设计并实现任务卡片组件',
        image: 'https://picsum.photos/300/230?random=10',
        tags: ['组件', '设计'],
        priority: 'medium',
        height: 300,
      },
      {
        id: 18,
        title: '数据持久化',
        description: '实现数据的本地存储和加载',
        image: 'https://picsum.photos/300/240?random=18',
        tags: ['存储', '数据'],
        priority: 'high',
        height: 310,
      },
      {
        id: 19,
        title: '性能优化',
        description: '优化应用性能和加载速度',
        image: 'https://picsum.photos/300/260?random=19',
        tags: ['优化', '性能'],
        priority: 'medium',
        height: 330,
      },
      {
        id: 20,
        title: '代码重构',
        description: '重构部分代码以提高可维护性',
        image: 'https://picsum.photos/300/250?random=20',
        tags: ['重构', '代码'],
        priority: 'low',
        height: 320,
      },
    ],
  },
  {
    title: '规划中',
    tasks: [
      {
        id: 21,
        title: '需求分析',
        description: '分析项目需求和用户故事',
        image: 'https://picsum.photos/300/250?random=21',
        tags: ['需求', '分析'],
        priority: 'high',
        height: 320,
      },
      {
        id: 22,
        title: '技术选型',
        description: '评估并选择适合项目的技术栈',
        image: 'https://picsum.photos/300/230?random=22',
        tags: ['技术', '决策'],
        priority: 'high',
        height: 300,
      },
      {
        id: 23,
        title: '原型设计',
        description: '设计应用的交互原型',
        image: 'https://picsum.photos/300/270?random=23',
        tags: ['设计', '原型'],
        priority: 'medium',
        height: 330,
      },
      {
        id: 24,
        title: '项目计划',
        description: '制定项目开发计划和时间表',
        image: 'https://picsum.photos/300/240?random=24',
        tags: ['计划', '管理'],
        priority: 'medium',
        height: 310,
      },
    ],
  },
]

export const useKanbanStore = defineStore('kanban', () => {
  // 状态
  const taskLists = ref<TaskList[]>(loadTaskListsFromStorage())

  // 从localStorage加载数据或使用默认数据
  function loadTaskListsFromStorage(): TaskList[] {
    try {
      const savedData = localStorage.getItem('kanban-task-lists')
      if (savedData) {
        return JSON.parse(savedData)
      }
    } catch (error) {
      console.error('从本地存储加载数据失败:', error)
      ElMessage.error('加载保存的数据失败，将使用默认数据')
    }
    return defaultTaskLists
  }

  // 保存数据到localStorage
  function saveTaskListsToStorage() {
    try {
      localStorage.setItem('kanban-task-lists', JSON.stringify(taskLists.value))
    } catch (error) {
      console.error('保存数据到本地存储失败:', error)
      ElMessage.error('保存数据失败')
    }
  }

  // 监听任务列表变化，保存到localStorage
  watch(
    taskLists,
    () => {
      saveTaskListsToStorage()
    },
    { deep: true },
  )

  // 添加新列表
  function addList(title: string) {
    taskLists.value.push({
      title,
      tasks: [],
    })
    saveTaskListsToStorage()
    return taskLists.value.length - 1 // 返回新列表的索引
  }

  // 添加新任务
  function addTask(listIndex: number, task: Task) {
    if (listIndex >= 0 && listIndex < taskLists.value.length) {
      taskLists.value[listIndex].tasks.push(task)
      saveTaskListsToStorage()
      return true
    }
    return false
  }

  // 更新任务
  function updateTask(listIndex: number, taskIndex: number, updatedTask: Task) {
    if (
      listIndex >= 0 &&
      listIndex < taskLists.value.length &&
      taskIndex >= 0 &&
      taskIndex < taskLists.value[listIndex].tasks.length
    ) {
      taskLists.value[listIndex].tasks[taskIndex] = updatedTask
      saveTaskListsToStorage()
      return true
    }
    return false
  }

  // 删除任务
  function deleteTask(listIndex: number, taskIndex: number) {
    if (
      listIndex >= 0 &&
      listIndex < taskLists.value.length &&
      taskIndex >= 0 &&
      taskIndex < taskLists.value[listIndex].tasks.length
    ) {
      taskLists.value[listIndex].tasks.splice(taskIndex, 1)
      saveTaskListsToStorage()
      return true
    }
    return false
  }

  return {
    taskLists,
    addList,
    addTask,
    updateTask,
    deleteTask,
    saveTaskListsToStorage,
  }
})
