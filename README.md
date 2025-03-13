# Kanban 看板应用

一个基于Vue 3和Vite的看板应用，支持任务管理、拖拽排序和图片上传功能。
结合任务看板Trello和小红书Rednotes，实现了瀑布流式的看板demo。

## 功能特点

- 任务看板管理
- 拖拽排序任务
- 瀑布流布局
- 图片上传到Vercel Blob存储
- 响应式设计

## 开发环境设置

### 推荐的IDE设置

[VSCode](https://code.visualstudio.com/) + [Volar](https://marketplace.visualstudio.com/items?itemName=Vue.volar) (并禁用Vetur)。

### 安装依赖

```sh
npm install
# 或
pnpm install
```

### 配置环境变量

创建一个`.env`文件，并设置以下环境变量：

```
BLOB_READ_WRITE_TOKEN=your_blob_read_write_token_here
```

在Vercel部署时，需要在Vercel控制台中设置相同的环境变量。

### 开发模式

启动前端和API服务器：

```sh
npm run dev:all
# 或
pnpm run dev:all
```

或者分别启动：

```sh
# 前端开发服务器
npm run dev
# API服务器
npm run server
```

### 构建生产版本

```sh
npm run build
# 或
pnpm run build
```

## 图片上传功能

本应用使用Vercel Blob存储来保存任务图片。在开发环境中，图片上传功能通过本地API服务器处理，在生产环境中，需要在Vercel上配置Blob存储。

### 配置Vercel Blob存储

1. 在Vercel控制台中，选择你的项目
2. 进入"Storage"选项卡
3. 选择"Connect Database"按钮
4. 在"Create New"选项卡下，选择"Blob"
5. 使用名称"Images"创建一个新的Blob存储
6. 选择需要包含读写令牌的环境
7. 创建后，Vercel会自动添加`BLOB_READ_WRITE_TOKEN`环境变量到你的项目

### 本地开发

对于本地开发，你需要从Vercel拉取环境变量：

```sh
vercel env pull
```

## 许可证

MIT
