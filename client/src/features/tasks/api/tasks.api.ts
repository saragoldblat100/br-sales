import { api } from '@/shared/lib/api';
import { Task, CreateTaskInput, UpdateTaskInput, TaskListFilters } from '../types';

interface AssignableUser {
  id: string;
  username: string;
  name: string;
}

export const tasksApi = {
  async getAssignableUsers(): Promise<AssignableUser[]> {
    const response = await api.get('/tasks/users');
    return response.data.data;
  },

  async listTasks(filters?: TaskListFilters): Promise<Task[]> {
    const params = new URLSearchParams();
    if (filters?.status) params.append('status', filters.status);
    if (filters?.assignedTo) params.append('assignedTo', filters.assignedTo);

    const queryString = params.toString();
    const url = `/tasks${queryString ? '?' + queryString : ''}`;

    const response = await api.get(url);
    return response.data.data;
  },

  async getTask(id: string): Promise<Task> {
    const response = await api.get(`/tasks/${id}`);
    return response.data.data;
  },

  async createTask(payload: CreateTaskInput): Promise<Task> {
    const response = await api.post('/tasks', payload);
    return response.data.data;
  },

  async updateTask(id: string, payload: UpdateTaskInput): Promise<Task> {
    const response = await api.patch(`/tasks/${id}`, payload);
    return response.data.data;
  },

  async updateTaskStatus(id: string, status: string): Promise<Task> {
    const response = await api.patch(`/tasks/${id}/status`, { status });
    return response.data.data;
  },

  async deleteTask(id: string): Promise<void> {
    await api.delete(`/tasks/${id}`);
  },
};
