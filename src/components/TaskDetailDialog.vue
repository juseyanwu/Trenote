<template>
  <el-dialog
    v-model="dialogVisible"
    :title="isNewTask ? '创建新任务' : '编辑任务'"
    width="500px"
    :before-close="handleClose"
  >
    <el-form :model="taskForm" label-position="top">
      <!-- 标题 -->
      <el-form-item label="标题" required>
        <el-input v-model="taskForm.title" placeholder="请输入任务标题" />
      </el-form-item>
      
      <!-- 描述 -->
      <el-form-item label="描述">
        <el-input
          v-model="taskForm.description"
          type="textarea"
          :rows="3"
          placeholder="请输入任务描述"
        />
      </el-form-item>
      
      <!-- 标签 -->
      <el-form-item label="标签">
        <el-tag
          v-for="tag in taskForm.tags"
          :key="tag"
          closable
          @close="handleRemoveTag(tag)"
          class="mr-1 mb-1"
        >
          {{ tag }}
        </el-tag>
        <el-input
          v-if="inputTagVisible"
          ref="tagInputRef"
          v-model="inputTagValue"
          class="w-20 ml-1"
          size="small"
          @keyup.enter="handleAddTag"
          @blur="handleAddTag"
        />
        <el-button v-else size="small" @click="showTagInput">
          <el-icon><Plus /></el-icon> 添加标签
        </el-button>
      </el-form-item>
      
      <!-- 优先级 -->
      <el-form-item label="优先级">
        <el-select v-model="taskForm.priority" placeholder="请选择优先级" class="w-full">
          <el-option label="低优先级" value="low" />
          <el-option label="中优先级" value="medium" />
          <el-option label="高优先级" value="high" />
        </el-select>
      </el-form-item>
      
      <!-- 图片URL -->
      <el-form-item label="图片URL">
        <div class="flex items-center gap-2">
          <el-input v-model="taskForm.image" placeholder="请输入图片URL" class="flex-1" />
          <el-button type="primary" @click="generateRandomImage">随机图片</el-button>
        </div>
        <div v-if="taskForm.image" class="mt-2">
          <img :src="taskForm.image" alt="任务图片预览" class="w-full max-h-40 object-cover rounded" />
        </div>
      </el-form-item>
    </el-form>
    
    <template #footer>
      <div class="dialog-footer">
        <el-button @click="handleClose">取消</el-button>
        <el-button type="primary" @click="handleSave">保存</el-button>
      </div>
    </template>
  </el-dialog>
</template>

<script setup lang="ts">
import { ref, reactive, nextTick, defineProps, defineEmits, watch } from 'vue'

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

const props = defineProps<{
  visible: boolean
  task?: Task
  isNewTask?: boolean
}>()

const emit = defineEmits<{
  (e: 'update:visible', value: boolean): void
  (e: 'save', task: Task): void
}>()

// 对话框可见状态
const dialogVisible = ref(props.visible)

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听task属性变化，更新表单数据
watch(() => props.task, (newTask) => {
  if (newTask) {
    taskForm.id = newTask.id || Date.now()
    taskForm.title = newTask.title || ''
    taskForm.description = newTask.description || ''
    taskForm.image = newTask.image || ''
    taskForm.tags = [...(newTask.tags || [])]
    taskForm.priority = newTask.priority || 'medium'
    taskForm.height = newTask.height || 300
  }
}, { immediate: true })

// 监听dialogVisible变化，同步回父组件
watch(dialogVisible, (newVal) => {
  emit('update:visible', newVal)
})

// 任务表单数据
const taskForm = reactive<Task>({
  id: props.task?.id || Date.now(),
  title: props.task?.title || '',
  description: props.task?.description || '',
  image: props.task?.image || '',
  tags: [...(props.task?.tags || [])],
  priority: props.task?.priority || 'medium',
  height: props.task?.height || 300
})

// 标签输入相关
const inputTagVisible = ref(false)
const inputTagValue = ref('')
const tagInputRef = ref<HTMLInputElement | null>(null)

// 显示标签输入框
const showTagInput = () => {
  inputTagVisible.value = true
  nextTick(() => {
    tagInputRef.value?.focus()
  })
}

// 添加标签
const handleAddTag = () => {
  if (inputTagValue.value) {
    if (!taskForm.tags) {
      taskForm.tags = []
    }
    if (!taskForm.tags.includes(inputTagValue.value)) {
      taskForm.tags.push(inputTagValue.value)
    }
  }
  inputTagVisible.value = false
  inputTagValue.value = ''
}

// 移除标签
const handleRemoveTag = (tag: string) => {
  if (taskForm.tags) {
    taskForm.tags = taskForm.tags.filter(t => t !== tag)
  }
}

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 生成随机图片
const generateRandomImage = () => {
  // 随机高度200-350之间
  const height = Math.floor(Math.random() * 150) + 200
  // 随机宽度250-350之间
  const width = Math.floor(Math.random() * 100) + 250
  // 使用picsum.photos生成随机图片
  taskForm.image = `https://picsum.photos/${width}/${height}?random=${Date.now()}`
}

// 保存任务
const handleSave = () => {
  // 随机生成高度，用于瀑布流布局
  if (!taskForm.height) {
    taskForm.height = Math.floor(Math.random() * 100) + 280
  }
  
  // 如果没有图片，随机生成一张
  if (!taskForm.image) {
    generateRandomImage()
  }
  
  emit('save', { ...taskForm })
  dialogVisible.value = false
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}
</style> 