<template>
  <div
    class="draggable-container"
    :class="{ 'empty-list': modelValue.length === 0 }"
    @dragover.prevent="onDragOver"
    @drop.prevent="onDrop"
  >
    <slot></slot>
  </div>
</template>

<script setup lang="ts">
import { defineProps, defineEmits } from 'vue'

const props = defineProps({
  modelValue: {
    type: Array,
    required: true,
  },
  group: {
    type: Object,
    default: () => ({
      name: 'default',
      pull: true,
      put: true,
    }),
  },
})

const emit = defineEmits(['update:modelValue', 'end'])

// 拖拽开始时存储相关信息
let dragSourceElement: HTMLElement | null = null


// 拖拽经过目标区域事件处理
const onDragOver = (event: DragEvent) => {
  if (!event.dataTransfer) return

  // 检查是否允许放置
  try {
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    if (data.groupName !== props.group.name && !props.group.put) {
      return
    }
  } catch (e) {
    // 解析失败，可能不是我们的拖拽数据
    console.log(e)
    return
  }

  // 允许放置
  event.dataTransfer.dropEffect = 'move'
}

// 拖拽放置事件处理
const onDrop = (event: DragEvent) => {
  if (!event.dataTransfer) return

  try {
    // 解析拖拽数据
    const data = JSON.parse(event.dataTransfer.getData('text/plain'))
    // 兼容不同的数据格式（从DraggableTaskCard或DraggableContainer）
    const sourceIndex = data.index !== undefined ? data.index : data.taskIndex
    const sourceListId = data.listId !== undefined ? data.listId : data.listIndex
    const groupName = data.groupName

    // 检查是否允许放置
    if (groupName !== props.group.name && !props.group.put) {
      return
    }

    // 获取目标列表ID
    const targetListId = (event.currentTarget as HTMLElement).dataset.listId || ''

    // 触发拖拽结束事件
    emit('end', {
      from: sourceListId,
      to: targetListId,
      oldIndex: sourceIndex,
      newIndex: props.modelValue.length, // 默认添加到末尾
    })

    // 清除拖拽样式
    if (dragSourceElement) {
      dragSourceElement.classList.remove('dragging')
      dragSourceElement = null
    }
  } catch (e) {
    console.error('Drop error:', e)
  }
}

</script>

<style scoped>
.draggable-container {
  position: relative;
  min-height: 50px;
}

.empty-list {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: center;
  min-height: calc(100vh - 250px);
  width: 100%;
  border-radius: 8px;
}

:deep(.dragging) {
  opacity: 0.5;
  background: #c8ebfb;
  border: 1px dashed #409eff;
}
</style>
