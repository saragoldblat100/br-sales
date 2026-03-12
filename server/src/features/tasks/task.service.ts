import { Task, TaskStatus } from './task.model';
import { AppError } from '@/shared/errors';
import { Types } from 'mongoose';
import { User } from '@/features/auth/auth.model';

interface CreateTaskPayload {
  title: string;
  description?: string;
  assignedTo?: string;
  createdBy: string;
}

interface UpdateTaskPayload {
  title?: string;
  description?: string;
  status?: TaskStatus;
  assignedTo?: string;
}

interface TaskFilters {
  status?: TaskStatus;
  assignedTo?: string;
  createdBy?: string;
}

export const taskService = {
  async listTasks(filters?: TaskFilters) {
    const query: any = {};

    if (filters?.status) {
      query.status = filters.status;
    }
    if (filters?.assignedTo) {
      query.assignedTo = new Types.ObjectId(filters.assignedTo);
    }
    if (filters?.createdBy) {
      query.createdBy = new Types.ObjectId(filters.createdBy);
    }

    const tasks = await Task.find(query)
      .populate('createdBy', 'username name email')
      .populate('assignedTo', 'username name email')
      .populate('updatedBy', 'username name email')
      .sort({ createdAt: -1 })
      .lean();

    return tasks;
  },

  async getTaskById(id: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid task ID');
    }

    const task = await Task.findById(id)
      .populate('createdBy', 'username name email')
      .populate('assignedTo', 'username name email')
      .populate('updatedBy', 'username name email')
      .lean();

    if (!task) {
      throw AppError.notFound('Task');
    }

    return task;
  },

  async createTask(payload: CreateTaskPayload) {
    if (!payload.title || payload.title.trim().length === 0) {
      throw AppError.badRequest('Task title is required');
    }

    const createdById = new Types.ObjectId(payload.createdBy);
    let assignedToId: Types.ObjectId | undefined;

    if (payload.assignedTo) {
      if (!Types.ObjectId.isValid(payload.assignedTo)) {
        throw AppError.badRequest('Invalid assignedTo user ID');
      }
      assignedToId = new Types.ObjectId(payload.assignedTo);
    }

    const task = new Task({
      title: payload.title.trim(),
      description: payload.description?.trim(),
      createdBy: createdById,
      assignedTo: assignedToId,
    });

    const savedTask = await task.save();

    return await Task.findById(savedTask._id)
      .populate('createdBy', 'username name email')
      .populate('assignedTo', 'username name email')
      .lean();
  },

  async updateTask(id: string, userId: string, payload: UpdateTaskPayload) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid task ID');
    }

    const task = await Task.findById(id);

    if (!task) {
      throw AppError.notFound('Task');
    }

    // All authenticated users can edit any task
    // Update fields
    if (payload.title !== undefined) {
      if (payload.title.trim().length === 0) {
        throw AppError.badRequest('Task title cannot be empty');
      }
      task.title = payload.title.trim();
    }

    if (payload.description !== undefined) {
      task.description = payload.description?.trim();
    }

    if (payload.status !== undefined) {
      task.status = payload.status;
    }

    if (payload.assignedTo !== undefined) {
      if (payload.assignedTo === '') {
        task.assignedTo = undefined;
      } else if (Types.ObjectId.isValid(payload.assignedTo)) {
        task.assignedTo = new Types.ObjectId(payload.assignedTo);
      } else {
        throw AppError.badRequest('Invalid assignedTo user ID');
      }
    }

    task.updatedBy = new Types.ObjectId(userId);
    const updatedTask = await task.save();

    return await Task.findById(updatedTask._id)
      .populate('createdBy', 'username name email')
      .populate('assignedTo', 'username name email')
      .populate('updatedBy', 'username name email')
      .lean();
  },

  async updateTaskStatus(id: string, userId: string, status: TaskStatus) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid task ID');
    }

    if (!['open', 'in_progress', 'done', 'cancelled'].includes(status)) {
      throw AppError.badRequest('Invalid task status');
    }

    const task = await Task.findById(id);

    if (!task) {
      throw AppError.notFound('Task');
    }

    // All authenticated users can update task status
    task.status = status;
    task.updatedBy = new Types.ObjectId(userId);
    const updatedTask = await task.save();

    return await Task.findById(updatedTask._id)
      .populate('createdBy', 'username name email')
      .populate('assignedTo', 'username name email')
      .populate('updatedBy', 'username name email')
      .lean();
  },

  async deleteTask(id: string, userId: string, userRole?: string) {
    if (!Types.ObjectId.isValid(id)) {
      throw AppError.badRequest('Invalid task ID');
    }

    const task = await Task.findById(id);

    if (!task) {
      throw AppError.notFound('Task');
    }

    // Check permissions:
    // ADMIN and MANAGER can delete any task
    // Other users can only delete their own tasks
    const isAdmin = userRole === 'admin' || userRole === 'manager';
    const isOwner = task.createdBy.toString() === userId;

    if (!isAdmin && !isOwner) {
      throw AppError.forbidden('You can only delete tasks you created');
    }

    await Task.findByIdAndDelete(id);
  },

  async listUsersForAssignment() {
    const users = await User.find({ isActive: true })
      .select('id username name')
      .lean();

    return users;
  },
};
