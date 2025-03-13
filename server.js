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

// 加载环境变量
dotenv.config()

// 检查环境变量是否加载
console.log('BLOB_READ_WRITE_TOKEN 是否存在:', !!process.env.BLOB_READ_WRITE_TOKEN)
console.log('BLOB_READ_WRITE_TOKEN 长度:', process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0)

const app = express()
const PORT = process.env.PORT || 3001

// 配置中间件
app.use(cors())
app.use(bodyParser.raw({ type: '*/*', limit: '10mb' }))

// 测试路由
app.get('/api/test', (req, res) => {
  res.json({
    message: 'API服务器正常工作',
    env: {
      hasToken: !!process.env.BLOB_READ_WRITE_TOKEN,
      tokenLength: process.env.BLOB_READ_WRITE_TOKEN ? process.env.BLOB_READ_WRITE_TOKEN.length : 0
    }
  })
})

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