<script setup lang="ts">
import { ref, reactive } from 'vue'
import { ElButton, ElInput, ElCard, ElIcon } from 'element-plus'
// import { Plus, Edit, Delete, Close, Check } from '@element-plus/icons-vue'

interface KanbanColumn {
  id: number
  title: string
  cards: KanbanCard[]
  isEditing?: boolean
}

interface KanbanCard {
  id: number
  title: string
  isEditing?: boolean
}

// 初始化看板数据
const columns = reactive<KanbanColumn[]>([
  {
    id: 1,
    title: '待办事项',
    cards: [
      { id: 1, title: '项目会议' },
      { id: 2, title: '应动会议' }
    ]
  },
  {
    id: 2,
    title: '正在处理',
    cards: [
      { id: 3, title: '添加卡片' }
    ]
  },
  {
    id: 3,
    title: '已完成',
    cards: [
      { id: 4, title: '完成卡片' }
    ]
  }
])

// 新列标题
const newColumnTitle = ref('')
const isAddingColumn = ref(false)

// 新卡片标题
const newCardTitles = reactive<Record<number, string>>({});
const isAddingCard = reactive<Record<number, boolean>>({});

// 添加新列
const addColumn = () => {
  if (newColumnTitle.value.trim()) {
    columns.push({
      id: Date.now(),
      title: newColumnTitle.value,
      cards: []
    })
    newColumnTitle.value = ''
    isAddingColumn.value = false
  }
}

// 编辑列标题
const startEditColumn = (column: KanbanColumn) => {
  column.isEditing = true
}

const saveColumnTitle = (column: KanbanColumn) => {
  if (column.title.trim()) {
    column.isEditing = false
  }
}

// 删除列
const deleteColumn = (columnId: number) => {
  const index = columns.findIndex(col => col.id === columnId)
  if (index !== -1) {
    columns.splice(index, 1)
  }
}

// 添加新卡片
const startAddCard = (columnId: number) => {
  isAddingCard[columnId] = true
  newCardTitles[columnId] = ''
}

const addCard = (columnId: number) => {
  const column = columns.find(col => col.id === columnId)
  if (column && newCardTitles[columnId]?.trim()) {
    column.cards.push({
      id: Date.now(),
      title: newCardTitles[columnId]
    })
    newCardTitles[columnId] = ''
    isAddingCard[columnId] = false
  }
}

// 编辑卡片
const startEditCard = (card: KanbanCard) => {
  card.isEditing = true
}

const saveCardTitle = (card: KanbanCard) => {
  if (card.title.trim()) {
    card.isEditing = false
  }
}

// 删除卡片
const deleteCard = (columnId: number, cardId: number) => {
  const column = columns.find(col => col.id === columnId)
  if (column) {
    const cardIndex = column.cards.findIndex(card => card.id === cardId)
    if (cardIndex !== -1) {
      column.cards.splice(cardIndex, 1)
    }
  }
}

// 取消添加
const cancelAddColumn = () => {
  isAddingColumn.value = false
  newColumnTitle.value = ''
}

const cancelAddCard = (columnId: number) => {
  isAddingCard[columnId] = false
  newCardTitles[columnId] = ''
}
</script>

<template>
  <div class="kanban-board">
    <!-- 看板列 -->
    <div class="kanban-columns">
      <div v-for="column in columns" :key="column.id" class="kanban-column">
        <!-- 列标题 -->
        <div class="column-header">
          <div v-if="!column.isEditing" class="column-title-container">
            <h3 class="column-title">{{ column.title }}</h3>
            <div class="column-actions">
              <el-button link @click="startEditColumn(column)">
                <el-icon><Edit /></el-icon>
              </el-button>
              <el-button lin k @click="deleteColumn(column.id)">
                <el-icon><Delete /></el-icon>
              </el-button>
            </div>
          </div>
          <div v-else class="column-edit">
            <el-input v-model="column.title" size="small" @keyup.enter="saveColumnTitle(column)" />
            <div class="edit-actions">
              <el-button link @click="saveColumnTitle(column)">
                <el-icon><Check /></el-icon>
              </el-button>
              <el-button link @click="column.isEditing = false">
                <el-icon><Close /></el-icon>
              </el-button>
            </div>
          </div>
        </div>

        <!-- 卡片列表 -->
        <div class="cards-container">
          <el-card v-for="card in column.cards" :key="card.id" class="kanban-card" shadow="hover">
            <div v-if="!card.isEditing" class="card-content">
              <div class="card-title">{{ card.title }}</div>
              <div class="card-actions">
                <el-button link @click="startEditCard(card)">
                  <el-icon><Edit /></el-icon>
                </el-button>
                <el-button link @click="deleteCard(column.id, card.id)">
                  <el-icon><Delete /></el-icon>
                </el-button>
              </div>
            </div>
            <div v-else class="card-edit">
              <el-input v-model="card.title" size="small" @keyup.enter="saveCardTitle(card)" />
              <div class="edit-actions">
                <el-button link @click="saveCardTitle(card)">
                  <el-icon><Check /></el-icon>
                </el-button>
                <el-button link @click="card.isEditing = false">
                  <el-icon><Close /></el-icon>
                </el-button>
              </div>
            </div>
          </el-card>

          <!-- 添加新卡片 -->
          <div v-if="isAddingCard[column.id]" class="add-card-form">
            <el-input v-model="newCardTitles[column.id]" placeholder="输入卡片标题..." size="small" @keyup.enter="addCard(column.id)" />
            <div class="add-card-actions">
              <el-button type="primary" size="small" @click="addCard(column.id)">添加</el-button>
              <el-button size="small" @click="cancelAddCard(column.id)">取消</el-button>
            </div>
          </div>
          <div v-else class="add-card-button">
            <el-button link @click="startAddCard(column.id)">
              <el-icon><Plus /></el-icon> 添加卡片
            </el-button>
          </div>
        </div>
      </div>

      <!-- 添加新列 -->
      <div class="add-column-container">
        <div v-if="isAddingColumn" class="add-column-form">
          <el-input v-model="newColumnTitle" placeholder="输入列标题..." size="small" @keyup.enter="addColumn" />
          <div class="add-column-actions">
            <el-button type="primary" size="small" @click="addColumn">添加</el-button>
            <el-button size="small" @click="cancelAddColumn">取消</el-button>
          </div>
        </div>
        <el-button v-else class="add-column-button" @click="isAddingColumn = true">
          <el-icon><Plus /></el-icon> 添加新列表
        </el-button>
      </div>
    </div>
  </div>
</template>

<style scoped>
.kanban-board {
  display: flex;
  flex-direction: column;
  height: 100%;
  overflow: hidden;
}

.kanban-columns {
  display: flex;
  overflow-x: auto;
  padding: 1rem;
  height: 100%;
  gap: 1rem;
}

.kanban-column {
  background-color: #f1f2f4;
  border-radius: 8px;
  width: 280px;
  min-width: 280px;
  display: flex;
  flex-direction: column;
  max-height: 100%;
}

.column-header {
  padding: 10px;
  border-bottom: 1px solid #ddd;
}

.column-title-container {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.column-title {
  margin: 0;
  font-size: 16px;
  font-weight: bold;
}

.column-actions {
  display: flex;
}

.column-edit {
  display: flex;
  align-items: center;
  gap: 5px;
}

.edit-actions {
  display: flex;
}

.cards-container {
  padding: 10px;
  overflow-y: auto;
  flex-grow: 1;
}

.kanban-card {
  margin-bottom: 10px;
  cursor: pointer;
}

.card-content {
  display: flex;
  justify-content: space-between;
  align-items: center;
}

.card-actions {
  display: flex;
  opacity: 0;
  transition: opacity 0.2s;
}

.kanban-card:hover .card-actions {
  opacity: 1;
}

.card-edit {
  display: flex;
  flex-direction: column;
  gap: 5px;
}

.add-card-form, .add-column-form {
  display: flex;
  flex-direction: column;
  gap: 10px;
  margin-top: 10px;
}

.add-card-actions, .add-column-actions {
  display: flex;
  gap: 10px;
}

.add-column-container {
  min-width: 280px;
  margin-top: 0;
}

.add-column-button {
  background-color: rgba(255, 255, 255, 0.6);
  border: 1px dashed #ccc;
  border-radius: 8px;
  width: 280px;
  height: 40px;
  display: flex;
  align-items: center;
  justify-content: center;
}
</style>