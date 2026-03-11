import { useState } from 'react';
import { Task, TaskStatus, CreateTaskInput, UpdateTaskInput } from '../types';

interface TaskFormProps {
  task?: Task;
  onSubmit: (payload: CreateTaskInput | UpdateTaskInput) => Promise<void>;
  onCancel: () => void;
  isLoading?: boolean;
  isReadOnly?: boolean;
}

const STATUS_OPTIONS: { value: TaskStatus; label: string }[] = [
  { value: 'open', label: 'פתוח' },
  { value: 'in_progress', label: 'מטופל' },
  { value: 'done', label: 'סיום' },
  { value: 'cancelled', label: 'בוטל' },
];

export function TaskForm({ task, onSubmit, onCancel, isLoading = false, isReadOnly = false }: TaskFormProps) {
  const [title, setTitle] = useState(task?.title || '');
  const [description, setDescription] = useState(task?.description || '');
  const [status, setStatus] = useState<TaskStatus>(task?.status || 'open');
  const [error, setError] = useState<string | null>(null);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError(null);

    if (!title.trim()) {
      setError('כותרת משימה היא חובה');
      return;
    }

    try {
      const payload = task
        ? ({
            title: title.trim(),
            description: description.trim(),
            status,
          } as UpdateTaskInput)
        : ({
            title: title.trim(),
            description: description.trim(),
          } as CreateTaskInput);

      await onSubmit(payload);
    } catch (err) {
      setError(err instanceof Error ? err.message : 'אירעה שגיאה בעת שמירת המשימה');
    }
  };

  return (
    <form onSubmit={handleSubmit} className="space-y-6" dir="rtl">
      {error && (
        <div className="bg-red-50 border border-red-200 text-red-700 px-4 py-3 rounded-lg text-sm">
          {error}
        </div>
      )}

      {/* Title Field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">
          כותרת משימה <span className="text-red-500">*</span>
        </label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          disabled={isLoading || isReadOnly}
          maxLength={200}
          placeholder="הכנס כותרת משימה..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:bg-gray-50 disabled:text-gray-400"
        />
        <p className="text-xs text-gray-400 mt-1">{title.length}/200</p>
      </div>

      {/* Description Field */}
      <div>
        <label className="block text-sm font-semibold text-gray-700 mb-2">תיאור</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          disabled={isLoading || isReadOnly}
          maxLength={1000}
          rows={4}
          placeholder="הכנס תיאור משימה (אופציונלי)..."
          className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:bg-gray-50 disabled:text-gray-400 resize-none"
        />
        <p className="text-xs text-gray-400 mt-1">{description.length}/1000</p>
      </div>

      {/* Status Field (Edit Only) */}
      {task && (
        <div>
          <label className="block text-sm font-semibold text-gray-700 mb-2">סטטוס</label>
          <select
            value={status}
            onChange={(e) => setStatus(e.target.value as TaskStatus)}
            disabled={isLoading || isReadOnly}
            className="w-full px-4 py-3 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all disabled:bg-gray-50 bg-white"
          >
            {STATUS_OPTIONS.map((opt) => (
              <option key={opt.value} value={opt.value}>
                {opt.label}
              </option>
            ))}
          </select>
        </div>
      )}

      {/* Action Buttons */}
      {!isReadOnly && (
        <div className="flex gap-3 pt-4 flex-row-reverse">
          <button
            type="submit"
            disabled={isLoading}
            className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-red-300 text-white font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            {isLoading ? 'שומר...' : task ? 'עדכן משימה' : 'צור משימה'}
          </button>
          <button
            type="button"
            onClick={onCancel}
            disabled={isLoading}
            className="flex-1 bg-gray-200 hover:bg-gray-300 disabled:bg-gray-100 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            ביטול
          </button>
        </div>
      )}
      {isReadOnly && (
        <div className="flex gap-3 pt-4 flex-row-reverse">
          <button
            type="button"
            onClick={onCancel}
            className="flex-1 bg-gray-200 hover:bg-gray-300 text-gray-700 font-semibold py-3 px-4 rounded-lg transition-colors duration-200"
          >
            סגור
          </button>
        </div>
      )}
    </form>
  );
}
