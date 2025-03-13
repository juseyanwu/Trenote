import { sql } from '@vercel/postgres';
import { createPool } from '@vercel/postgres';
import type { QueryResult } from '@vercel/postgres';

// 数据库连接字符串
const connectionString = process.env.POSTGRES_URL || 'postgres://neondb_owner:npg_6L7qDNJUmhwo@ep-polished-moon-a49659a2-pooler.us-east-1.aws.neon.tech/neondb?sslmode=require';

// 创建数据库连接池
export const pool = createPool({
  connectionString: connectionString,
});

// 初始化数据库表
export async function initDatabase() {
  try {
    // 创建任务列表表
    await sql`
      CREATE TABLE IF NOT EXISTS lists (
        id SERIAL PRIMARY KEY,
        title VARCHAR(255) NOT NULL,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    // 创建任务表
    await sql`
      CREATE TABLE IF NOT EXISTS tasks (
        id SERIAL PRIMARY KEY,
        list_id INTEGER REFERENCES lists(id) ON DELETE CASCADE,
        title VARCHAR(255) NOT NULL,
        description TEXT,
        image VARCHAR(1024),
        tags TEXT[],
        priority VARCHAR(50) DEFAULT 'medium',
        height INTEGER DEFAULT 300,
        position INTEGER NOT NULL DEFAULT 0,
        created_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP,
        updated_at TIMESTAMP WITH TIME ZONE DEFAULT CURRENT_TIMESTAMP
      );
    `;

    console.log('数据库表初始化成功');
    return { success: true };
  } catch (error) {
    console.error('数据库表初始化失败:', error);
    return { success: false, error };
  }
}

// 列表相关操作
export const listOperations = {
  // 获取所有列表及其任务
  async getAllLists() {
    try {
      const lists = await sql`
        SELECT * FROM lists ORDER BY position ASC;
      `;

      // 为每个列表获取任务
      const result = await Promise.all(
        lists.rows.map(async (list) => {
          const tasks = await sql`
            SELECT * FROM tasks 
            WHERE list_id = ${list.id} 
            ORDER BY position ASC;
          `;

          // 处理tags字段，将数据库中的数组转换为JavaScript数组
          const processedTasks = tasks.rows.map(task => ({
            ...task,
            tags: task.tags || []
          }));

          return {
            ...list,
            tasks: processedTasks
          };
        })
      );

      return result;
    } catch (error) {
      console.error('获取列表失败:', error);
      throw error;
    }
  },

  // 创建新列表
  async createList(title: string) {
    try {
      // 获取最大position值
      const maxPositionResult = await sql`
        SELECT COALESCE(MAX(position), 0) as max_position FROM lists;
      `;
      const maxPosition = maxPositionResult.rows[0].max_position;

      // 创建新列表，position设置为当前最大值+1
      const result = await sql`
        INSERT INTO lists (title, position) 
        VALUES (${title}, ${maxPosition + 1}) 
        RETURNING *;
      `;
      return result.rows[0];
    } catch (error) {
      console.error('创建列表失败:', error);
      throw error;
    }
  },

  // 更新列表
  async updateList(id: number, title: string) {
    try {
      const result = await sql`
        UPDATE lists 
        SET title = ${title}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${id} 
        RETURNING *;
      `;
      return result.rows[0];
    } catch (error) {
      console.error('更新列表失败:', error);
      throw error;
    }
  },

  // 删除列表
  async deleteList(id: number) {
    try {
      await sql`DELETE FROM lists WHERE id = ${id};`;
      return { success: true };
    } catch (error) {
      console.error('删除列表失败:', error);
      throw error;
    }
  },

  // 更新列表顺序
  async updateListPositions(listPositions: { id: number; position: number }[]) {
    try {
      // 使用事务确保所有更新都成功或都失败
      for (const { id, position } of listPositions) {
        await sql`
          UPDATE lists 
          SET position = ${position}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${id};
        `;
      }
      return { success: true };
    } catch (error) {
      console.error('更新列表顺序失败:', error);
      throw error;
    }
  }
};

// 任务相关操作
export const taskOperations = {
  // 获取特定列表的所有任务
  async getTasksByListId(listId: number) {
    try {
      const result = await sql`
        SELECT * FROM tasks 
        WHERE list_id = ${listId} 
        ORDER BY position ASC;
      `;
      
      // 处理tags字段
      return result.rows.map(task => ({
        ...task,
        tags: task.tags || []
      }));
    } catch (error) {
      console.error('获取任务失败:', error);
      throw error;
    }
  },

  // 创建新任务
  async createTask(task: {
    list_id: number;
    title: string;
    description?: string;
    image?: string;
    tags?: string[];
    priority?: string;
    height?: number;
  }) {
    try {
      // 获取当前列表中最大的position值
      const maxPositionResult = await sql`
        SELECT COALESCE(MAX(position), 0) as max_position 
        FROM tasks 
        WHERE list_id = ${task.list_id};
      `;
      const maxPosition = maxPositionResult.rows[0].max_position;

      // 创建新任务，position设置为当前最大值+1
      // 使用原始SQL查询来处理数组类型
      const query = `
        INSERT INTO tasks (
          list_id, title, description, image, tags, priority, height, position
        ) VALUES (
          $1, $2, $3, $4, $5, $6, $7, $8
        ) 
        RETURNING *;
      `;
      
      const values = [
        task.list_id,
        task.title,
        task.description || null,
        task.image || null,
        task.tags || [],
        task.priority || 'medium',
        task.height || 300,
        maxPosition + 1
      ];
      
      const result = await pool.query(query, values);
      
      // 处理tags字段
      const newTask = result.rows[0];
      return {
        ...newTask,
        tags: newTask.tags || []
      };
    } catch (error) {
      console.error('创建任务失败:', error);
      throw error;
    }
  },

  // 更新任务
  async updateTask(id: number, task: {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    priority?: string;
    height?: number;
  }) {
    try {
      // 构建更新语句
      const updateFields = [];
      const values: any[] = [];
      let paramIndex = 1;

      if (task.title !== undefined) {
        updateFields.push(`title = $${paramIndex++}`);
        values.push(task.title);
      }
      if (task.description !== undefined) {
        updateFields.push(`description = $${paramIndex++}`);
        values.push(task.description);
      }
      if (task.image !== undefined) {
        updateFields.push(`image = $${paramIndex++}`);
        values.push(task.image);
      }
      if (task.tags !== undefined) {
        updateFields.push(`tags = $${paramIndex++}`);
        values.push(task.tags);
      }
      if (task.priority !== undefined) {
        updateFields.push(`priority = $${paramIndex++}`);
        values.push(task.priority);
      }
      if (task.height !== undefined) {
        updateFields.push(`height = $${paramIndex++}`);
        values.push(task.height);
      }

      updateFields.push(`updated_at = CURRENT_TIMESTAMP`);

      if (updateFields.length === 0) {
        return null; // 没有字段需要更新
      }

      // 执行更新
      const query = `
        UPDATE tasks 
        SET ${updateFields.join(', ')} 
        WHERE id = $${paramIndex} 
        RETURNING *;
      `;
      values.push(id);

      const result = await pool.query(query, values);
      
      // 处理tags字段
      const updatedTask = result.rows[0];
      return {
        ...updatedTask,
        tags: updatedTask.tags || []
      };
    } catch (error) {
      console.error('更新任务失败:', error);
      throw error;
    }
  },

  // 删除任务
  async deleteTask(id: number) {
    try {
      await sql`DELETE FROM tasks WHERE id = ${id};`;
      return { success: true };
    } catch (error) {
      console.error('删除任务失败:', error);
      throw error;
    }
  },

  // 移动任务到另一个列表
  async moveTask(taskId: number, targetListId: number, position: number) {
    try {
      // 更新任务的列表ID和位置
      const result = await sql`
        UPDATE tasks 
        SET list_id = ${targetListId}, position = ${position}, updated_at = CURRENT_TIMESTAMP 
        WHERE id = ${taskId} 
        RETURNING *;
      `;
      
      // 处理tags字段
      const movedTask = result.rows[0];
      return {
        ...movedTask,
        tags: movedTask.tags || []
      };
    } catch (error) {
      console.error('移动任务失败:', error);
      throw error;
    }
  },

  // 更新任务顺序
  async updateTaskPositions(taskPositions: { id: number; position: number }[]) {
    try {
      // 使用循环逐个更新，而不是事务
      for (const { id, position } of taskPositions) {
        await sql`
          UPDATE tasks 
          SET position = ${position}, updated_at = CURRENT_TIMESTAMP 
          WHERE id = ${id};
        `;
      }
      return { success: true };
    } catch (error) {
      console.error('更新任务顺序失败:', error);
      throw error;
    }
  }
};

// 导出默认对象
export default {
  initDatabase,
  listOperations,
  taskOperations
}; 