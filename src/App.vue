<template>
  <div class="app-container">
    <header class="bg-blue-600 text-white p-4 shadow-md">
      <h1 class="text-2xl font-bold">看板任务管理</h1>
    </header>
    <main class="p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
// 主应用组件
</script>

<style>
@import './styles.css';

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: #f5f7fa;
}

main {
  flex: 1;
}
</style>
