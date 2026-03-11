import { useState, useEffect, useCallback } from 'react';
import { tasksApi } from '../api/tasks.api';
import {
  Task,
  TaskStatus,
  CreateTaskInput,
  UpdateTaskInput,
} from '../types';
import { TasksModuleView } from '../ui/TasksModuleView';
import { TaskDetailsModal } from './TaskDetailsModal';

interface TasksModuleProps {
  onBack: () => void;
  onLogout: () => void;
}

export function TasksModule({ onBack, onLogout }: TasksModuleProps) {
  const [tasks, setTasks] = useState<Task[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [statusFilter, setStatusFilter] = useState<TaskStatus | ''>('');
  const [searchQuery, setSearchQuery] = useState('');
  const [formMode, setFormMode] = useState<'create' | 'edit' | 'view' | null>(null);
  const [selectedTask, setSelectedTask] = useState<Task | null>(null);
  const [saving, setSaving] = useState(false);

  // Fetch tasks
  const fetchTasks = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const tasksList = await tasksApi.listTasks({
        status: statusFilter || undefined,
      });
      setTasks(tasksList);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'שגיאה בטעינת משימות'
      );
    } finally {
      setLoading(false);
    }
  }, [statusFilter]);

  useEffect(() => {
    fetchTasks();
  }, [fetchTasks]);

  const handleNewTask = () => {
    setSelectedTask(null);
    setFormMode('create');
  };

  const handleEditTask = (task: Task) => {
    setSelectedTask(task);
    setFormMode('edit');
  };

  const handleViewTask = (task: Task) => {
    setSelectedTask(task);
    setFormMode('view');
  };

  const handleDeleteTask = async (id: string) => {
    if (!window.confirm('האם אתה בטוח שברצונך למחוק משימה זו?')) {
      return;
    }

    try {
      await tasksApi.deleteTask(id);
      setTasks(tasks.filter((t) => t._id !== id));
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'שגיאה במחיקת המשימה'
      );
    }
  };

  const handleSaveTask = async (payload: CreateTaskInput | UpdateTaskInput) => {
    setSaving(true);
    setError(null);
    try {
      let updatedTask: Task;

      if (formMode === 'create') {
        updatedTask = await tasksApi.createTask(payload as CreateTaskInput);
        setTasks([updatedTask, ...tasks]);
      } else if (formMode === 'edit' && selectedTask) {
        updatedTask = await tasksApi.updateTask(
          selectedTask._id,
          payload as UpdateTaskInput
        );
        setTasks(
          tasks.map((t) => (t._id === selectedTask._id ? updatedTask : t))
        );
      }

      setFormMode(null);
      setSelectedTask(null);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : 'שגיאה בשמירת המשימה'
      );
      throw err; // Let the form show the error
    } finally {
      setSaving(false);
    }
  };

  const handleCloseModal = () => {
    if (!saving) {
      setFormMode(null);
      setSelectedTask(null);
    }
  };

  return (
    <>
      <TasksModuleView
        tasks={tasks}
        statusFilter={statusFilter}
        searchQuery={searchQuery}
        onSearchChange={setSearchQuery}
        loading={loading}
        error={error}
        onStatusFilterChange={setStatusFilter}
        onNewTask={handleNewTask}
        onEditTask={handleEditTask}
        onDeleteTask={handleDeleteTask}
        onViewTask={handleViewTask}
        onBack={onBack}
        onLogout={onLogout}
      />

      <TaskDetailsModal
        task={selectedTask || undefined}
        isOpen={formMode !== null}
        onClose={handleCloseModal}
        onSubmit={handleSaveTask}
        isLoading={saving}
        mode={formMode === null ? 'create' : formMode}
      />
    </>
  );
}
