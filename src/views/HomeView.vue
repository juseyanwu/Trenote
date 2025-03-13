<script setup lang="ts">
import KanbanBoard from '../components/KanbanBoard.vue'
</script>

<template>
  <main class="kanban-container">
    <KanbanBoard />
  </main>
</template>

<style scoped>
.kanban-container {
  width: 100%;
  height: calc(100vh - 150px);
  overflow: hidden;
}
</style>
