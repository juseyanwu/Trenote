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
      
      <!-- 图片上传 -->
      <el-form-item label="任务图片">
        <div class="image-upload-container">
          <!-- 图片上传区域 -->
          <el-upload
            class="image-uploader"
            :show-file-list="false"
            :before-upload="beforeImageUpload"
            :http-request="uploadImage"
            accept="image/*"
          >
            <img v-if="taskForm.image" :src="taskForm.image" class="uploaded-image" />
            <div v-else class="upload-placeholder">
              <el-icon class="upload-icon"><Plus /></el-icon>
              <div class="upload-text">点击上传图片</div>
            </div>
          </el-upload>
          
          <!-- 上传状态 -->
          <el-progress 
            v-if="uploadProgress > 0 && uploadProgress < 100" 
            :percentage="uploadProgress" 
            :format="percentageFormat"
            status="success"
          />
          
          <!-- 操作按钮 -->
          <div class="image-actions mt-2">
            <el-button v-if="taskForm.image" size="small" type="danger" @click="removeImage">
              <el-icon><Delete /></el-icon> 删除图片
            </el-button>
            <el-button size="small" type="primary" @click="generateRandomImage">
              <el-icon><Picture /></el-icon> 随机图片
            </el-button>
          </div>
        </div>
        
        <!-- 图片URL输入 -->
        <div class="mt-3">
          <div class="text-sm text-gray-500 mb-1">或者输入图片URL</div>
          <el-input v-model="taskForm.image" placeholder="请输入图片URL" />
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
import { Plus, Delete, Picture } from '@element-plus/icons-vue'
import { ElMessage } from 'element-plus'
import type { UploadProps, UploadRequestOptions } from 'element-plus'

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

const dialogVisible = ref(props.visible)
const tagInputRef = ref<HTMLInputElement | null>(null)
const inputTagVisible = ref(false)
const inputTagValue = ref('')
const uploadProgress = ref(0)

// 初始化表单数据
const taskForm = reactive<Task>({
  id: props.task?.id || Date.now(),
  title: props.task?.title || '',
  description: props.task?.description || '',
  image: props.task?.image || '',
  tags: [...(props.task?.tags || [])],
  priority: props.task?.priority || 'medium',
  height: props.task?.height || 300
})

// 监听visible属性变化
watch(() => props.visible, (newVal) => {
  dialogVisible.value = newVal
})

// 监听dialogVisible变化
watch(() => dialogVisible.value, (newVal) => {
  emit('update:visible', newVal)
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

// 关闭对话框
const handleClose = () => {
  dialogVisible.value = false
}

// 保存任务
const handleSave = () => {
  if (!taskForm.title.trim()) {
    ElMessage.warning('任务标题不能为空')
    return
  }
  
  emit('save', { ...taskForm })
  dialogVisible.value = false
}

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

// 生成随机图片
const generateRandomImage = () => {
  const width = 800
  const height = 600
  const randomId = Math.floor(Math.random() * 1000)
  taskForm.image = `https://picsum.photos/id/${randomId}/${width}/${height}`
}

// 图片上传前的验证
const beforeImageUpload: UploadProps['beforeUpload'] = (file) => {
  // 检查文件类型
  const isImage = file.type.startsWith('image/')
  if (!isImage) {
    ElMessage.error('只能上传图片文件!')
    return false
  }
  
  // 检查文件大小（限制为2MB）
  const isLt2M = file.size / 1024 / 1024 < 2
  if (!isLt2M) {
    ElMessage.error('图片大小不能超过2MB!')
    return false
  }
  
  return true
}

// 图片上传处理
const uploadImage = async (options: UploadRequestOptions) => {
  const { file } = options
  if (!file) return
  
  try {
    // 重置上传进度
    uploadProgress.value = 0
    
    // 模拟上传进度
    const progressInterval = setInterval(() => {
      if (uploadProgress.value < 90) {
        uploadProgress.value += 10
      }
    }, 300)
    
    console.log('准备上传文件:', file.name)
    console.log('文件类型:', file.type)
    console.log('文件大小:', file.size)
    
    // 调用后端API上传到Vercel Blob
    const response = await fetch('/api/upload?filename=' + encodeURIComponent(file.name), {
      method: 'POST',
      body: file,
      headers: {
        'Content-Type': file.type
      }
    })
    
    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}))
      throw new Error(errorData.error || `上传失败，状态码: ${response.status}`)
    }
    
    // 获取上传结果
    const result = await response.json()
    
    // 上传完成
    clearInterval(progressInterval)
    uploadProgress.value = 100
    
    console.log('上传成功，URL:', result.url)
    
    // 设置图片URL
    taskForm.image = result.url
    
    ElMessage.success('图片上传成功')
    
    // 3秒后隐藏进度条
    setTimeout(() => {
      uploadProgress.value = 0
    }, 3000)
    
  } catch (error) {
    console.error('上传错误:', error)
    ElMessage.error('图片上传失败: ' + (error instanceof Error ? error.message : String(error)))
    uploadProgress.value = 0
  }
}

// 删除图片
const removeImage = () => {
  taskForm.image = ''
  ElMessage.success('图片已删除')
}

// 格式化进度条显示
const percentageFormat = (percentage: number) => {
  return percentage === 100 ? '上传完成' : `${percentage}%`
}
</script>

<style scoped>
.dialog-footer {
  display: flex;
  justify-content: flex-end;
}

.image-upload-container {
  display: flex;
  align-items: center;
  gap: 10px;
}

.image-uploader {
  width: 100px;
  height: 100px;
  border: 1px dashed #d9d9d9;
  border-radius: 4px;
  overflow: hidden;
}

.uploaded-image {
  width: 100%;
  height: 100%;
  object-fit: cover;
}

.upload-placeholder {
  width: 100%;
  height: 100%;
  display: flex;
  flex-direction: column;
  justify-content: center;
  align-items: center;
}

.upload-icon {
  font-size: 24px;
  margin-bottom: 8px;
}

.upload-text {
  font-size: 12px;
  color: #909399;
}

.image-actions {
  display: flex;
  justify-content: space-between;
  align-items: center;
}
</style> 