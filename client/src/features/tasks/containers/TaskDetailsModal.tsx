import { X } from 'lucide-react';
import { Task, CreateTaskInput, UpdateTaskInput } from '../types';
import { TaskForm } from '../ui/TaskForm';

interface TaskDetailsModalProps {
  task?: Task;
  isOpen: boolean;
  onClose: () => void;
  onSubmit: (payload: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  isLoading?: boolean;
  mode?: 'create' | 'edit' | 'view';
}

export function TaskDetailsModal({ task, isOpen, onClose, onSubmit, isLoading = false, mode = 'create' }: TaskDetailsModalProps) {
  if (!isOpen) return null;

  const handleSuccess = async (payload: CreateTaskInput | UpdateTaskInput) => {
    await onSubmit(payload);
    onClose();
  };

  const getTitle = () => {
    if (mode === 'view') return 'פרוטי המשימה';
    if (mode === 'edit') return 'עדכן משימה';
    return 'משימה חדשה';
  };

  return (
    <div className="fixed inset-0 z-50 bg-black/40 backdrop-blur-sm flex items-center justify-center p-4" dir="rtl">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg animate-scale-in max-h-[90vh] overflow-y-auto">
        {/* Header */}
        <div className="sticky top-0 bg-white border-b border-gray-200 px-8 py-6 flex items-center justify-between">
          <h2 className="text-xl font-bold text-gray-900">{getTitle()}</h2>
          <button
            onClick={onClose}
            disabled={isLoading}
            className="p-1 hover:bg-gray-100 rounded-lg transition-colors disabled:opacity-50"
            title="סגור"
          >
            <X className="w-6 h-6 text-gray-500" />
          </button>
        </div>

        {/* Body */}
        <div className="px-8 py-6">
          <TaskForm task={task} onSubmit={handleSuccess} onCancel={onClose} isLoading={isLoading} isReadOnly={mode === 'view'} />
        </div>
      </div>
    </div>
  );
}
