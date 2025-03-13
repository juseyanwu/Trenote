import express from 'express'
import bodyParser from 'body-parser'
import { put } from '@vercel/blob'
import cors from 'cors'
import dotenv from 'dotenv'
import { fileURLToPath } from 'url'
import { dirname } from 'path'

// 获取当前文件的目录
const __filename = fileURLToPath(import.meta.url)
const __dirname = dirname(__filename)

// 加载环境变量 - 确保在导入数据库模块之前加载
dotenv.config()

// 检查环境变量是否加载
console.log('BLOB_READ_WRITE_TOKEN 是否存在:', !!process.env.BLOB_READ_WRITE_TOKEN)
console.log('BLOB_READ_WRITE_TOKEN 长度:', process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0)
console.log('POSTGRES_URL 是否存在:', !!process.env.POSTGRES_URL)
console.log('POSTGRES_URL 值:', process.env.POSTGRES_URL ? process.env.POSTGRES_URL.substring(0, 20) + '...' : 'undefined')

// 导入数据库模块
import { initDatabase, listOperations, taskOperations } from './src/db/index.ts'

const app = express()
const PORT = process.env.PORT || 3001

// 配置中间件
app.use(cors())
app.use(bodyParser.json()) // 用于解析JSON请求体
app.use(bodyParser.raw({ type: 'image/*', limit: '10mb' })) // 用于解析图片上传

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API服务器正常工作',
    env: {
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenLength: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0,
      hasPostgresUrl: !!process.env.POSTGRES_URL
    }
  })
})

// 初始化数据库
app.get('/api/init-db', async (req, res) => {
  try {
    const result = await initDatabase();
    res.json(result);
  } catch (error) {
    console.error('初始化数据库失败:', error);
    res.status(500).json({ error: '初始化数据库失败' });
  }
});

// 列表相关API
// 获取所有列表及其任务
app.get('/api/lists', async (req, res) => {
  try {
    const lists = await listOperations.getAllLists();
    res.json(lists);
  } catch (error) {
    console.error('获取列表失败:', error);
    res.status(500).json({ error: '获取列表失败' });
  }
});

// 创建新列表
app.post('/api/lists', async (req, res) => {
  try {
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: '列表标题不能为空' });
    }
    const newList = await listOperations.createList(title);
    res.status(201).json(newList);
  } catch (error) {
    console.error('创建列表失败:', error);
    res.status(500).json({ error: '创建列表失败' });
  }
});

// 更新列表
app.put('/api/lists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title } = req.body;
    if (!title) {
      return res.status(400).json({ error: '列表标题不能为空' });
    }
    const updatedList = await listOperations.updateList(parseInt(id), title);
    res.json(updatedList);
  } catch (error) {
    console.error('更新列表失败:', error);
    res.status(500).json({ error: '更新列表失败' });
  }
});

// 删除列表
app.delete('/api/lists/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await listOperations.deleteList(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('删除列表失败:', error);
    res.status(500).json({ error: '删除列表失败' });
  }
});

// 更新列表顺序
app.put('/api/lists/positions', async (req, res) => {
  try {
    const { positions } = req.body;
    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: '无效的位置数据' });
    }
    await listOperations.updateListPositions(positions);
    res.json({ success: true });
  } catch (error) {
    console.error('更新列表顺序失败:', error);
    res.status(500).json({ error: '更新列表顺序失败' });
  }
});

// 任务相关API
// 获取特定列表的所有任务
app.get('/api/lists/:listId/tasks', async (req, res) => {
  try {
    const { listId } = req.params;
    const tasks = await taskOperations.getTasksByListId(parseInt(listId));
    res.json(tasks);
  } catch (error) {
    console.error('获取任务失败:', error);
    res.status(500).json({ error: '获取任务失败' });
  }
});

// 创建新任务
app.post('/api/tasks', async (req, res) => {
  try {
    const { list_id, title, description, image, tags, priority, height } = req.body;
    if (!list_id || !title) {
      return res.status(400).json({ error: '列表ID和任务标题不能为空' });
    }
    const newTask = await taskOperations.createTask({
      list_id: parseInt(list_id),
      title,
      description,
      image,
      tags,
      priority,
      height
    });
    res.status(201).json(newTask);
  } catch (error) {
    console.error('创建任务失败:', error);
    res.status(500).json({ error: '创建任务失败' });
  }
});

// 更新任务
app.put('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    const { title, description, image, tags, priority, height } = req.body;
    const updatedTask = await taskOperations.updateTask(parseInt(id), {
      title,
      description,
      image,
      tags,
      priority,
      height
    });
    res.json(updatedTask);
  } catch (error) {
    console.error('更新任务失败:', error);
    res.status(500).json({ error: '更新任务失败' });
  }
});

// 删除任务
app.delete('/api/tasks/:id', async (req, res) => {
  try {
    const { id } = req.params;
    await taskOperations.deleteTask(parseInt(id));
    res.json({ success: true });
  } catch (error) {
    console.error('删除任务失败:', error);
    res.status(500).json({ error: '删除任务失败' });
  }
});

// 移动任务到另一个列表
app.put('/api/tasks/:id/move', async (req, res) => {
  try {
    const { id } = req.params;
    const { targetListId, position } = req.body;
    if (targetListId === undefined || position === undefined) {
      return res.status(400).json({ error: '目标列表ID和位置不能为空' });
    }
    const movedTask = await taskOperations.moveTask(
      parseInt(id),
      parseInt(targetListId),
      parseInt(position)
    );
    res.json(movedTask);
  } catch (error) {
    console.error('移动任务失败:', error);
    res.status(500).json({ error: '移动任务失败' });
  }
});

// 更新任务顺序
app.put('/api/tasks/positions', async (req, res) => {
  try {
    const { positions } = req.body;
    if (!positions || !Array.isArray(positions)) {
      return res.status(400).json({ error: '无效的位置数据' });
    }
    await taskOperations.updateTaskPositions(positions);
    res.json({ success: true });
  } catch (error) {
    console.error('更新任务顺序失败:', error);
    res.status(500).json({ error: '更新任务顺序失败' });
  }
});

// 处理图片上传
app.post('/api/upload', async (req, res) => {
  try {
    // 获取文件名
    const filename = req.query.filename
    if (!filename) {
      return res.status(400).json({ error: '缺少文件名参数' })
    }
    
    console.log('开始上传文件:', filename)
    console.log('请求体大小:', req.body ? req.body.length : 0)
    
    // 上传到Vercel Blob
    const blob = await put(filename, req.body, {
      access: 'public',
    })
    
    console.log('上传成功，URL:', blob.url)
    
    // 返回上传结果
    return res.status(200).json(blob)
  } catch (error) {
    console.error('上传文件失败:', error)
    console.error('错误详情:', error.message)
    console.error('错误堆栈:', error.stack)
    return res.status(500).json({ error: '上传文件失败: ' + error.message })
  }
})

// 启动服务器
app.listen(PORT, () => {
  console.log(`API服务器运行在 http://localhost:${PORT}`)
}) 