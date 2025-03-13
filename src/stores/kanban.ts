import { defineStore } from 'pinia'
import { ref, computed } from 'vue'
import { listApi, taskApi, type List, type Task } from '../api/kanbanApi'
import { ElMessage } from 'element-plus'

export const useKanbanStore = defineStore('kanban', () => {
  // 状态
  const lists = ref<List[]>([])
  const loading = ref(false)
  const error = ref<string | null>(null)
  const initialized = ref(false)

  // 计算属性
  const getLists = computed(() => lists.value)
  const getListById = computed(() => (id: number) => {
    return lists.value.find(list => list.id === id)
  })
  const getTaskById = computed(() => (id: number) => {
    for (const list of lists.value) {
      const task = list.tasks.find(task => task.id === id)
      if (task) return task
    }
    return null
  })

  // 初始化数据库
  const initDatabase = async () => {
    try {
      loading.value = true
      error.value = null
      
      const response = await fetch('/api/init-db')
      if (!response.ok) {
        throw new Error('初始化数据库失败')
      }
      
      const result = await response.json()
      if (!result.success) {
        throw new Error(result.error || '初始化数据库失败')
      }
      
      ElMessage.success('数据库初始化成功')
      initialized.value = true
      
      // 初始化成功后加载列表
      await fetchLists()
    } catch (err) {
      error.value = err instanceof Error ? err.message : '初始化数据库失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // 获取所有列表及其任务
  const fetchLists = async () => {
    try {
      loading.value = true
      error.value = null
      
      const fetchedLists = await listApi.getAllLists()
      lists.value = fetchedLists
    } catch (err) {
      error.value = err instanceof Error ? err.message : '获取列表失败'
      ElMessage.error(error.value)
    } finally {
      loading.value = false
    }
  }

  // 创建新列表
  const createList = async (title: string) => {
    try {
      loading.value = true
      error.value = null
      
      const newList = await listApi.createList(title)
      // 确保新列表有一个空的任务数组
      newList.tasks = []
      lists.value.push(newList)
      
      ElMessage.success('创建列表成功')
      return newList
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建列表失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新列表
  const updateList = async (id: number, title: string) => {
    try {
      loading.value = true
      error.value = null
      
      const updatedList = await listApi.updateList(id, title)
      
      // 更新本地状态
      const index = lists.value.findIndex(list => list.id === id)
      if (index !== -1) {
        // 保留原有的任务
        const tasks = lists.value[index].tasks
        lists.value[index] = { ...updatedList, tasks }
      }
      
      ElMessage.success('更新列表成功')
      return updatedList
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新列表失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除列表
  const deleteList = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      
      await listApi.deleteList(id)
      
      // 更新本地状态
      lists.value = lists.value.filter(list => list.id !== id)
      
      ElMessage.success('删除列表成功')
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除列表失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  // 更新列表顺序
  const updateListPositions = async (listPositions: { id: number; position: number }[]) => {
    try {
      error.value = null
      
      // 先更新本地状态，使UI立即响应
      for (const { id, position } of listPositions) {
        const list = lists.value.find(l => l.id === id)
        if (list) {
          list.position = position
        }
      }
      
      // 重新排序列表
      lists.value.sort((a, b) => a.position - b.position)
      
      // 然后发送请求到服务器
      await listApi.updateListPositions(listPositions)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新列表顺序失败'
      ElMessage.error(error.value)
      
      // 如果失败，重新获取列表以恢复正确的顺序
      await fetchLists()
      return false
    }
  }

  // 创建新任务
  const createTask = async (task: {
    list_id: number;
    title: string;
    description?: string;
    image?: string;
    tags?: string[];
    priority?: string;
    height?: number;
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const newTask = await taskApi.createTask(task)
      
      // 更新本地状态
      const listIndex = lists.value.findIndex(list => list.id === task.list_id)
      if (listIndex !== -1) {
        lists.value[listIndex].tasks.push(newTask)
      }
      
      ElMessage.success('创建任务成功')
      return newTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : '创建任务失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 更新任务
  const updateTask = async (id: number, task: {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    priority?: string;
    height?: number;
  }) => {
    try {
      loading.value = true
      error.value = null
      
      const updatedTask = await taskApi.updateTask(id, task)
      
      // 更新本地状态
      for (const list of lists.value) {
        const taskIndex = list.tasks.findIndex(t => t.id === id)
        if (taskIndex !== -1) {
          list.tasks[taskIndex] = updatedTask
          break
        }
      }
      
      ElMessage.success('更新任务成功')
      return updatedTask
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新任务失败'
      ElMessage.error(error.value)
      return null
    } finally {
      loading.value = false
    }
  }

  // 删除任务
  const deleteTask = async (id: number) => {
    try {
      loading.value = true
      error.value = null
      
      await taskApi.deleteTask(id)
      
      // 更新本地状态
      for (const list of lists.value) {
        const taskIndex = list.tasks.findIndex(task => task.id === id)
        if (taskIndex !== -1) {
          list.tasks.splice(taskIndex, 1)
          break
        }
      }
      
      ElMessage.success('删除任务成功')
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '删除任务失败'
      ElMessage.error(error.value)
      return false
    } finally {
      loading.value = false
    }
  }

  // 移动任务到另一个列表
  const moveTask = async (taskId: number, sourceListId: number, targetListId: number, position: number) => {
    try {
      error.value = null
      
      // 先更新本地状态，使UI立即响应
      const sourceList = lists.value.find(list => list.id === sourceListId)
      const targetList = lists.value.find(list => list.id === targetListId)
      
      if (!sourceList || !targetList) {
        throw new Error('列表不存在')
      }
      
      // 找到要移动的任务
      const taskIndex = sourceList.tasks.findIndex(task => task.id === taskId)
      if (taskIndex === -1) {
        throw new Error('任务不存在')
      }
      
      // 从源列表中移除任务
      const [task] = sourceList.tasks.splice(taskIndex, 1)
      
      // 更新任务的列表ID
      task.list_id = targetListId
      task.position = position
      
      // 添加到目标列表
      targetList.tasks.splice(position, 0, task)
      
      // 更新目标列表中的任务位置
      targetList.tasks.forEach((t, index) => {
        t.position = index
      })
      
      // 然后发送请求到服务器
      await taskApi.moveTask(taskId, targetListId, position)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '移动任务失败'
      ElMessage.error(error.value)
      
      // 如果失败，重新获取列表以恢复正确的状态
      await fetchLists()
      return false
    }
  }

  // 更新任务顺序
  const updateTaskPositions = async (listId: number, taskPositions: { id: number; position: number }[]) => {
    try {
      error.value = null
      
      // 先更新本地状态，使UI立即响应
      const list = lists.value.find(l => l.id === listId)
      if (!list) {
        throw new Error('列表不存在')
      }
      
      // 更新任务位置
      for (const { id, position } of taskPositions) {
        const task = list.tasks.find(t => t.id === id)
        if (task) {
          task.position = position
        }
      }
      
      // 重新排序任务
      list.tasks.sort((a, b) => a.position - b.position)
      
      // 然后发送请求到服务器
      await taskApi.updateTaskPositions(taskPositions)
      
      return true
    } catch (err) {
      error.value = err instanceof Error ? err.message : '更新任务顺序失败'
      ElMessage.error(error.value)
      
      // 如果失败，重新获取列表以恢复正确的顺序
      await fetchLists()
      return false
    }
  }

  return {
    // 状态
    lists,
    loading,
    error,
    initialized,
    
    // 计算属性
    getLists,
    getListById,
    getTaskById,
    
    // 方法
    initDatabase,
    fetchLists,
    createList,
    updateList,
    deleteList,
    updateListPositions,
    createTask,
    updateTask,
    deleteTask,
    moveTask,
    updateTaskPositions,
  }
}) 