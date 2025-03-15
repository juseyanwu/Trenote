<template>
  <div class="app-container">
    <header class="bg-white-600 dark:bg-gray-800 text-white p-4 shadow-md flex justify-between items-center">
      <h1 class="text-2xl font-bold text-black dark:text-white">欢迎来到Trenote～在这里可以管理您的任务</h1>
      <div class="theme-switch">
        <el-tooltip :content="isDark ? '切换到亮色模式' : '切换到暗色模式'" placement="bottom">
          <el-button circle @click="toggleDark()">
            <el-icon v-if="isDark">
              <Sunny />
            </el-icon>
            <el-icon v-else>
              <Moon />
            </el-icon>
          </el-button>
        </el-tooltip>
      </div>
    </header>
    <main class="p-4">
      <router-view />
    </main>
  </div>
</template>

<script setup lang="ts">
import { useDark, useToggle } from '@vueuse/core'
import { Sunny, Moon } from '@element-plus/icons-vue'

// 使用Element Plus的useDark钩子实现暗黑模式切换
const isDark = useDark({
  selector: 'html',
  attribute: 'class',
  valueDark: 'dark',
  valueLight: ''
})
const toggleDark = useToggle(isDark)
</script>

<style>
@import './styles.css';

.app-container {
  min-height: 100vh;
  display: flex;
  flex-direction: column;
  background-color: var(--bg-color);
  color: var(--text-color);
}

main {
  flex: 1;
}

.theme-switch {
  transition: all 0.3s ease;
}

/* 暗黑模式样式通过styles.css全局设置 */
</style>
