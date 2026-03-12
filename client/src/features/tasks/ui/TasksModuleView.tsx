import { useMemo } from 'react';
import { Trash2, Edit2, ArrowRight, ClipboardList, Search, LogOut, Eye } from 'lucide-react';
import { Task, TaskStatus } from '../types';

interface TasksModuleViewProps {
  tasks: Task[];
  currentUser?: {
    id: string;
    role: string;
  };
  statusFilter: TaskStatus | '';
  searchQuery: string;
  onSearchChange: (query: string) => void;
  loading: boolean;
  error: string | null;
  onStatusFilterChange: (status: TaskStatus | '') => void;
  onNewTask: () => void;
  onEditTask: (task: Task) => void;
  onDeleteTask: (id: string) => void;
  onViewTask: (task: Task) => void;
  onBack: () => void;
  onLogout: () => void;
}

const STATUS_CONFIG: Record<TaskStatus, { label: string; bg: string; text: string; border: string; icon: string }> = {
  open: { label: 'פתוח', bg: 'bg-red-50', text: 'text-red-700', border: 'border-red-200', icon: '●' },
  in_progress: { label: 'מטופל', bg: 'bg-blue-50', text: 'text-blue-700', border: 'border-blue-200', icon: '◐' },
  done: { label: 'סיום', bg: 'bg-emerald-50', text: 'text-emerald-700', border: 'border-emerald-200', icon: '✓' },
  cancelled: { label: 'בוטל', bg: 'bg-gray-100', text: 'text-gray-500', border: 'border-gray-200', icon: '✕' },
};


export function TasksModuleView({
  tasks,
  currentUser,
  statusFilter,
  searchQuery,
  onSearchChange,
  loading,
  error,
  onStatusFilterChange,
  onNewTask,
  onEditTask,
  onDeleteTask,
  onViewTask,
  onBack,
  onLogout,
}: TasksModuleViewProps) {
  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('he-IL', {
      year: 'numeric',
      month: '2-digit',
      day: '2-digit',
    });
  };


  // Filter tasks
  const filteredTasks = useMemo(
    () =>
      tasks.filter((t) => {
        const matchStatus = !statusFilter || t.status === statusFilter;
        const matchSearch = !searchQuery || t.title.toLowerCase().includes(searchQuery.toLowerCase());
        return matchStatus && matchSearch;
      }),
    [tasks, statusFilter, searchQuery]
  );

  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 p-6" dir="rtl">
      {/* Logout button */}
      <button
        onClick={onLogout}
        className="absolute top-6 left-6 w-12 h-12 bg-red-500 hover:bg-red-600 rounded-xl flex items-center justify-center shadow-lg transition-all"
        aria-label="התנתק"
      >
        <LogOut className="w-6 h-6 text-white" />
      </button>

      {/* Back button */}
      <button
        onClick={onBack}
        className="absolute top-6 right-6 flex items-center gap-2 px-4 py-2 bg-white hover:bg-gray-50 rounded-xl text-gray-700 transition-all shadow-lg"
      >
        <ArrowRight className="w-5 h-5" />
        <span className="font-medium">חזרה לתפריט</span>
      </button>

      <div className="max-w-6xl mx-auto pt-8">
        {/* Logo */}
        <div className="text-center mb-8">
          <img src="/logoBravo.svg" alt="Bravo Logo" className="h-24 mx-auto mb-6" />
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h1 className="text-3xl font-bold">
            <span className="text-gray-700">משימות</span>
          </h1>
          <p className="text-gray-500 mt-2">ניהול משימות הצוות</p>
        </div>

        {/* Header with New Task Button and Filters */}
        <div className="flex flex-col md:flex-row items-center justify-center gap-4 mb-8">
          {/* New Task Button */}
          <button
            onClick={onNewTask}
            className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2.5 px-6 rounded-xl transition-all duration-200 flex items-center gap-2 shadow-sm hover:shadow-md whitespace-nowrap"
          >
            <span>+ משימה חדשה</span>
          </button>

          {/* Search Input */}
          <div className="w-full md:w-64 relative">
            <Search className="absolute right-3 top-1/2 -translate-y-1/2 w-5 h-5 text-gray-400" />
            <input
              type="text"
              placeholder="חיפוש משימה..."
              value={searchQuery}
              onChange={(e) => onSearchChange(e.target.value)}
              className="w-full pl-4 pr-10 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
            />
          </div>

          {/* Status Filter */}
          <select
            value={statusFilter}
            onChange={(e) => onStatusFilterChange((e.target.value as TaskStatus) || '')}
            className="w-full md:w-48 px-4 py-2.5 border border-gray-200 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500/20 focus:border-red-500 transition-all bg-white"
          >
            <option value="">כל הסטטוסים</option>
            <option value="open">פתוח</option>
            <option value="in_progress">מטופל</option>
            <option value="done">סיום</option>
            <option value="cancelled">בוטל</option>
          </select>
        </div>

        {/* Error Message */}
        {error && (
          <div className="bg-red-50 border border-red-200 text-red-700 px-5 py-4 rounded-xl mb-6 text-sm">
            {error}
          </div>
        )}

        {/* Tasks Container */}
        <div className="bg-white rounded-2xl shadow-soft border border-gray-100 overflow-hidden">
          {loading ? (
            // Loading Skeleton
            <div className="space-y-0 divide-y divide-gray-50">
              {[...Array(5)].map((_, i) => (
                <div key={i} className="p-6 animate-pulse">
                  <div className="flex items-center justify-between gap-4">
                    <div className="flex-1">
                      <div className="h-4 bg-gray-200 rounded w-1/3 mb-2" />
                      <div className="h-3 bg-gray-100 rounded w-1/4" />
                    </div>
                    <div className="h-4 bg-gray-200 rounded w-16" />
                  </div>
                </div>
              ))}
            </div>
          ) : filteredTasks.length === 0 ? (
            // Empty State
            <div className="flex flex-col items-center justify-center py-20 px-6 text-center">
              <div className="w-16 h-16 bg-gray-100 rounded-full flex items-center justify-center mb-4">
                <ClipboardList className="w-8 h-8 text-gray-400" />
              </div>
              <h3 className="text-lg font-semibold text-gray-700 mb-2">אין משימות עדיין</h3>
              <p className="text-sm text-gray-400 mb-6">צור משימה חדשה כדי להתחיל</p>
              <button onClick={onNewTask} className="bg-red-600 hover:bg-red-700 text-white font-semibold py-2 px-5 rounded-lg transition-colors">
                + משימה חדשה
              </button>
            </div>
          ) : (
            // Table
            <div className="overflow-x-auto">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-50 border-b border-gray-100">
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">כותרת</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">סטטוס</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">יוצר</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">תאריך יצירה</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">עדכון אחרון</th>
                  <th className="px-6 py-5 text-right text-xs font-semibold text-gray-600 uppercase tracking-wider">פעולות</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-gray-100">
                {filteredTasks.map((task, index) => {
                  const config = STATUS_CONFIG[task.status];
                  return (
                    <tr
                      key={task._id}
                      className={`hover:bg-gray-50 transition-colors ${index % 2 === 0 ? 'bg-white' : 'bg-gray-50/50'}`}
                    >
                      <td className="px-6 py-5 text-sm">
                        <span className="font-semibold text-gray-900">{task.title}</span>
                      </td>
                      <td className="px-6 py-5 text-sm">
                        <span className={`inline-flex items-center gap-1.5 px-3 py-1 rounded-full text-xs font-semibold border ${config.bg} ${config.text} ${config.border}`}>
                          {config.icon}
                          {config.label}
                        </span>
                      </td>
                      <td className="px-6 py-5 text-sm text-gray-600">{task.createdBy.name}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{formatDate(task.createdAt)}</td>
                      <td className="px-6 py-5 text-sm text-gray-600">{formatDate(task.updatedAt)}</td>
                      <td className="px-6 py-5 text-sm">
                        <div className="flex gap-2">
                          <button
                            onClick={() => onViewTask(task)}
                            className="p-2 text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
                            title="צפייה"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          <button
                            onClick={() => onEditTask(task)}
                            className="p-2 text-blue-600 hover:bg-blue-50 rounded-lg transition-colors"
                            title="עריכה"
                          >
                            <Edit2 className="w-4 h-4" />
                          </button>
                          {currentUser && (
                            (currentUser.role === 'admin' || currentUser.role === 'manager' || currentUser.id === task.createdBy.id) && (
                              <button
                                onClick={() => onDeleteTask(task._id)}
                                className="p-2 text-red-600 hover:bg-red-50 rounded-lg transition-colors"
                                title="מחיקה"
                              >
                                <Trash2 className="w-4 h-4" />
                              </button>
                            )
                          )}
                        </div>
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            </div>
          )}
        </div>

        {/* Footer */}
        <div className="fixed bottom-6 left-0 right-0 text-center text-sm text-gray-400">
          <p>כל הזכויות שמורות - בראבו מערכות {new Date().getFullYear()} &copy;</p>
        </div>
      </div>
    </div>
  );
}
