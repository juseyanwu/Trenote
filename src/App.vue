<script setup lang="ts">
import { RouterLink, RouterView } from 'vue-router'
import { ref } from 'vue'
import { ElButton, ElIcon } from 'element-plus'
// import { Plus, Search, Bell, User } from '@element-plus/icons-vue'

const boardName = ref('看板')
</script>

<template>
  <div class="app-container">
    <header class="trello-header">
      <div class="header-left">
        <div class="logo-container">
          <span class="logo-text">Trello 工作区</span>
        </div>
        <nav class="main-nav">
          <RouterLink to="/" class="nav-item">看板</RouterLink>
          <a href="#" class="nav-item create-btn">
            <el-icon><Plus /></el-icon> 创建
          </a>
        </nav>
      </div>

      <div class="header-right">
        <div class="search-container">
          <el-icon><Search /></el-icon>
          <input type="text" placeholder="搜索" class="search-input" />
        </div>

        <div class="user-actions">
          <el-button link class="icon-btn">
            <el-icon><Bell /></el-icon>
          </el-button>
          <el-button link class="icon-btn user-avatar">
            <el-icon><User /></el-icon>
          </el-button>
        </div>
      </div>
    </header>

    <div class="board-header">
      <h1 class="board-title">{{ boardName }}</h1>
    </div>

    <main class="main-content">
      <RouterView />
    </main>
  </div>
</template>

<style scoped>
.app-container {
  display: flex;
  flex-direction: column;
  height: 100vh;
  overflow: hidden;
  background-color: #f9fafc;
}

.trello-header {
  display: flex;
  justify-content: space-between;
  align-items: center;
  padding: 0.5rem 1rem;
  background-color: #026aa7;
  color: white;
  height: 40px;
}

.header-left {
  display: flex;
  align-items: center;
}

.logo-container {
  margin-right: 1rem;
}

.logo-text {
  font-weight: bold;
  font-size: 1.2rem;
  color: white;
}

.main-nav {
  display: flex;
  align-items: center;
}

.nav-item {
  color: white;
  margin-right: 1rem;
  padding: 0.3rem 0.8rem;
  border-radius: 3px;
  text-decoration: none;
  font-size: 0.9rem;
}

.nav-item:hover {
  background-color: rgba(255, 255, 255, 0.3);
}

.create-btn {
  background-color: rgba(255, 255, 255, 0.3);
  display: flex;
  align-items: center;
  gap: 5px;
}

.header-right {
  display: flex;
  align-items: center;
}

.search-container {
  display: flex;
  align-items: center;
  background-color: rgba(255, 255, 255, 0.3);
  border-radius: 3px;
  padding: 0.3rem 0.5rem;
  margin-right: 1rem;
}

.search-input {
  background: transparent;
  border: none;
  color: white;
  outline: none;
  width: 180px;
  font-size: 0.9rem;
}

.search-input::placeholder {
  color: rgba(255, 255, 255, 0.8);
}

.user-actions {
  display: flex;
  align-items: center;
}

.icon-btn {
  color: white;
  margin-left: 0.5rem;
}

.user-avatar {
  background-color: #dfe1e6;
  color: #172b4d;
  border-radius: 50%;
  width: 32px;
  height: 32px;
  display: flex;
  align-items: center;
  justify-content: center;
}

.board-header {
  padding: 0.8rem 1rem;
  background-color: rgba(0, 0, 0, 0.08);
  border-bottom: 1px solid rgba(0, 0, 0, 0.1);
}

.board-title {
  font-size: 1.2rem;
  font-weight: bold;
  margin: 0;
  color: #172b4d;
}

.main-content {
  flex: 1;
  overflow: hidden;
}

/* 覆盖默认样式 */
#app {
  max-width: none;
  margin: 0;
  padding: 0;
}
</style>
