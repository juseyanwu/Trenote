// 定义任务类型
export interface Task {
  id: number;
  list_id: number;
  title: string;
  description?: string;
  image?: string;
  tags?: string[];
  priority?: 'low' | 'medium' | 'high';
  height?: number;
  position: number;
  created_at?: string;
  updated_at?: string;
}

// 定义列表类型
export interface List {
  id: number;
  title: string;
  position: number;
  tasks: Task[];
  created_at?: string;
  updated_at?: string;
}

// API基础URL
const API_BASE_URL = '/api';

// 列表相关API
export const listApi = {
  // 获取所有列表及其任务
  async getAllLists(): Promise<List[]> {
    const response = await fetch(`${API_BASE_URL}/lists`);
    if (!response.ok) {
      throw new Error('获取列表失败');
    }
    return response.json();
  },

  // 创建新列表
  async createList(title: string): Promise<List> {
    const response = await fetch(`${API_BASE_URL}/lists`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new Error('创建列表失败');
    }
    return response.json();
  },

  // 更新列表
  async updateList(id: number, title: string): Promise<List> {
    const response = await fetch(`${API_BASE_URL}/lists/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ title }),
    });
    if (!response.ok) {
      throw new Error('更新列表失败');
    }
    return response.json();
  },

  // 删除列表
  async deleteList(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/lists/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('删除列表失败');
    }
    return response.json();
  },

  // 更新列表顺序
  async updateListPositions(positions: { id: number; position: number }[]): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/lists/positions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ positions }),
    });
    if (!response.ok) {
      throw new Error('更新列表顺序失败');
    }
    return response.json();
  },
};

// 任务相关API
export const taskApi = {
  // 获取特定列表的所有任务
  async getTasksByListId(listId: number): Promise<Task[]> {
    const response = await fetch(`${API_BASE_URL}/lists/${listId}/tasks`);
    if (!response.ok) {
      throw new Error('获取任务失败');
    }
    return response.json();
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
  }): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('创建任务失败');
    }
    return response.json();
  },

  // 更新任务
  async updateTask(id: number, task: {
    title?: string;
    description?: string;
    image?: string;
    tags?: string[];
    priority?: string;
    height?: number;
  }): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify(task),
    });
    if (!response.ok) {
      throw new Error('更新任务失败');
    }
    return response.json();
  },

  // 删除任务
  async deleteTask(id: number): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}`, {
      method: 'DELETE',
    });
    if (!response.ok) {
      throw new Error('删除任务失败');
    }
    return response.json();
  },

  // 移动任务到另一个列表
  async moveTask(id: number, targetListId: number, position: number): Promise<Task> {
    const response = await fetch(`${API_BASE_URL}/tasks/${id}/move`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ targetListId, position }),
    });
    if (!response.ok) {
      throw new Error('移动任务失败');
    }
    return response.json();
  },

  // 更新任务顺序
  async updateTaskPositions(positions: { id: number; position: number }[]): Promise<{ success: boolean }> {
    const response = await fetch(`${API_BASE_URL}/tasks/positions`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json',
      },
      body: JSON.stringify({ positions }),
    });
    if (!response.ok) {
      throw new Error('更新任务顺序失败');
    }
    return response.json();
  },
};

// 导出默认对象
export default {
  listApi,
  taskApi,
}; 