import { Router, Response } from 'express';
import { authenticate, AuthenticatedRequest } from '@/shared/middleware';
import { asyncHandler } from '@/shared/utils';
import { taskService } from './task.service';
import { TaskStatus } from './task.model';

const router = Router();

// All routes require authentication
router.use(authenticate);

/**
 * GET /api/tasks/users
 * List active users for task assignment (accessible to all authenticated users)
 */
router.get(
  '/users',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const users = await taskService.listUsersForAssignment();

    res.json({
      success: true,
      data: users,
    });
  })
);

/**
 * GET /api/tasks
 * List all tasks (with optional filters)
 */
router.get(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { status, assignedTo } = req.query;

    const filters: any = {};
    if (status) {
      filters.status = status as TaskStatus;
    }
    if (assignedTo) {
      filters.assignedTo = assignedTo as string;
    }

    const tasks = await taskService.listTasks(filters);

    res.json({
      success: true,
      data: tasks,
    });
  })
);

/**
 * POST /api/tasks
 * Create a new task
 */
router.post(
  '/',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { title, description, assignedTo } = req.body;

    const task = await taskService.createTask({
      title,
      description,
      assignedTo,
      createdBy: req.user!.id,
    });

    res.status(201).json({
      success: true,
      data: task,
    });
  })
);

/**
 * GET /api/tasks/:id
 * Get a specific task
 */
router.get(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    const task = await taskService.getTaskById(id);

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/:id
 * Update a task
 */
router.patch(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { title, description, status, assignedTo } = req.body;

    const task = await taskService.updateTask(id, req.user!.id, {
      title,
      description,
      status,
      assignedTo,
    });

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * PATCH /api/tasks/:id/status
 * Quick update of task status
 */
router.patch(
  '/:id/status',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;
    const { status } = req.body;

    if (!status) {
      res.status(400).json({
        success: false,
        error: {
          code: 'INVALID_INPUT',
          message: 'Status is required',
        },
      });
      return;
    }

    const task = await taskService.updateTaskStatus(
      id,
      req.user!.id,
      status as TaskStatus
    );

    res.json({
      success: true,
      data: task,
    });
  })
);

/**
 * DELETE /api/tasks/:id
 * Delete a task
 */
router.delete(
  '/:id',
  asyncHandler(async (req: AuthenticatedRequest, res: Response) => {
    const { id } = req.params;

    await taskService.deleteTask(id, req.user!.id);

    res.json({
      success: true,
      message: 'Task deleted successfully',
    });
  })
);

export default router;
