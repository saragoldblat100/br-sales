export type TaskStatus = 'open' | 'in_progress' | 'done' | 'cancelled';

export interface User {
  id: string;
  username: string;
  name: string;
  email: string;
}

export interface Task {
  _id: string;
  title: string;
  description?: string;
  status: TaskStatus;
  createdBy: User;
  assignedTo?: User;
  updatedBy?: User;
  createdAt: string;
  updatedAt: string;
}

export interface CreateTaskInput {
  title: string;
  description?: string;
}

export interface UpdateTaskInput {
  title?: string;
  description?: string;
  status?: TaskStatus;
}

export interface TaskListFilters {
  status?: TaskStatus;
  assignedTo?: string;
}
