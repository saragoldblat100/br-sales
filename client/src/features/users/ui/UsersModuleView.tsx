import { useState } from 'react';
import { ArrowRight, Plus, Edit3, KeyRound, UserX, Loader2, X, UserCheck } from 'lucide-react';
import type { UserRecord, CreateUserInput, UpdateUserInput } from '../api/users.api';
import type { UserFormMode } from './UsersModule';

const ROLES = [
  { value: 'admin', label: 'מנהל ראשי' },
  { value: 'manager', label: 'מנהל' },
  { value: 'sales_agent', label: 'סוכנת מכירות' },
  { value: 'accountant', label: 'חשבונאי' },
  { value: 'logistics', label: 'לוגיסטיקה' },
  { value: 'sales', label: 'מכירות' },
];

function getRoleLabel(role: string) {
  return ROLES.find((r) => r.value === role)?.label || role;
}

interface UsersModuleViewProps {
  users: UserRecord[];
  loading: boolean;
  error: string | null;
  filterRole: string;
  filterActive: string;
  formMode: UserFormMode;
  selectedUser: UserRecord | null;
  saving: boolean;
  formError: string | null;
  confirmDeleteUser: UserRecord | null;
  onBack: () => void;
  onFilterRole: (role: string) => void;
  onFilterActive: (active: string) => void;
  onOpenCreate: () => void;
  onOpenEdit: (user: UserRecord) => void;
  onOpenResetPassword: (user: UserRecord) => void;
  onCloseForm: () => void;
  onCreateUser: (data: CreateUserInput) => void;
  onUpdateUser: (data: UpdateUserInput) => void;
  onResetPassword: (newPassword: string) => void;
  onConfirmDelete: (user: UserRecord | null) => void;
  onDeleteUser: () => void;
  onCancelDelete: () => void;
}

export function UsersModuleView({
  users,
  loading,
  error,
  filterRole,
  filterActive,
  formMode,
  selectedUser,
  saving,
  formError,
  confirmDeleteUser,
  onBack,
  onFilterRole,
  onFilterActive,
  onOpenCreate,
  onOpenEdit,
  onOpenResetPassword,
  onCloseForm,
  onCreateUser,
  onUpdateUser,
  onResetPassword,
  onConfirmDelete,
  onDeleteUser,
  onCancelDelete,
}: UsersModuleViewProps) {
  return (
    <div className="min-h-screen bg-gradient-to-b from-blue-100 via-blue-50 to-gray-100 flex flex-col" dir="rtl">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-gray-200 shadow-sm sticky top-0 z-40">
        <div className="container mx-auto px-4 py-3">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <h1 className="text-lg font-bold text-gray-900">ניהול משתמשים</h1>
              <button
                onClick={onOpenCreate}
                className="flex items-center gap-1 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-all text-sm font-medium"
              >
                <Plus className="h-4 w-4" />
                משתמש חדש
              </button>
            </div>
            <button
              onClick={onBack}
              className="flex items-center gap-2 px-4 py-2 bg-gray-100 text-gray-700 rounded-xl hover:bg-gray-200 transition-all font-medium text-sm"
            >
              <ArrowRight className="h-4 w-4" />
              חזרה
            </button>
          </div>
        </div>
      </header>

      <main className="flex-grow container mx-auto px-4 py-6 max-w-4xl">
        {/* Filters */}
        <div className="flex gap-3 mb-4">
          <select
            value={filterRole}
            onChange={(e) => onFilterRole(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">כל התפקידים</option>
            {ROLES.map((r) => (
              <option key={r.value} value={r.value}>{r.label}</option>
            ))}
          </select>
          <select
            value={filterActive}
            onChange={(e) => onFilterActive(e.target.value)}
            className="px-3 py-2 border border-gray-300 rounded-lg text-sm bg-white"
          >
            <option value="">כל הסטטוסים</option>
            <option value="true">פעיל</option>
            <option value="false">מושבת</option>
          </select>
        </div>

        {/* Error */}
        {error && (
          <div className="bg-red-50 border border-red-200 rounded-xl p-4 mb-4 text-red-700 text-sm">
            {error}
          </div>
        )}

        {/* Loading */}
        {loading ? (
          <div className="flex items-center justify-center py-20">
            <Loader2 className="h-8 w-8 animate-spin text-blue-500" />
          </div>
        ) : (
          /* Users table */
          <div className="bg-white rounded-2xl shadow-lg overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full text-sm">
                <thead className="bg-gray-50 border-b border-gray-200">
                  <tr>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">שם</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">שם משתמש</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">אימייל</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">תפקיד</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">סטטוס</th>
                    <th className="text-right px-4 py-3 font-semibold text-gray-700">כניסה אחרונה</th>
                    <th className="text-center px-4 py-3 font-semibold text-gray-700">פעולות</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-gray-100">
                  {users.length === 0 ? (
                    <tr>
                      <td colSpan={7} className="text-center py-10 text-gray-400">
                        לא נמצאו משתמשים
                      </td>
                    </tr>
                  ) : (
                    users.map((user) => (
                      <tr key={user.id} className={`hover:bg-gray-50 ${!user.isActive ? 'opacity-50' : ''}`}>
                        <td className="px-4 py-3 font-medium text-gray-900">{user.name}</td>
                        <td className="px-4 py-3 text-gray-600">{user.username}</td>
                        <td className="px-4 py-3 text-gray-600">{user.email}</td>
                        <td className="px-4 py-3">
                          <span className="px-2 py-1 rounded-full text-xs font-medium bg-blue-100 text-blue-700">
                            {getRoleLabel(user.role)}
                          </span>
                        </td>
                        <td className="px-4 py-3">
                          {user.isActive ? (
                            <span className="flex items-center gap-1 text-green-600 text-xs font-medium">
                              <UserCheck className="h-3.5 w-3.5" /> פעיל
                            </span>
                          ) : (
                            <span className="flex items-center gap-1 text-red-500 text-xs font-medium">
                              <UserX className="h-3.5 w-3.5" /> מושבת
                            </span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-gray-500 text-xs">
                          {user.lastLogin
                            ? new Date(user.lastLogin).toLocaleDateString('he-IL', { day: '2-digit', month: '2-digit', year: 'numeric', hour: '2-digit', minute: '2-digit' })
                            : '—'}
                        </td>
                        <td className="px-4 py-3">
                          <div className="flex items-center justify-center gap-1">
                            <button
                              onClick={() => onOpenEdit(user)}
                              className="p-1.5 rounded-lg hover:bg-blue-50 text-blue-600 transition-colors"
                              title="עריכה"
                            >
                              <Edit3 className="h-4 w-4" />
                            </button>
                            <button
                              onClick={() => onOpenResetPassword(user)}
                              className="p-1.5 rounded-lg hover:bg-amber-50 text-amber-600 transition-colors"
                              title="איפוס סיסמה"
                            >
                              <KeyRound className="h-4 w-4" />
                            </button>
                            {user.isActive && (
                              <button
                                onClick={() => onConfirmDelete(user)}
                                className="p-1.5 rounded-lg hover:bg-red-50 text-red-500 transition-colors"
                                title="השבתה"
                              >
                                <UserX className="h-4 w-4" />
                              </button>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        )}
      </main>

      {/* Create/Edit Modal */}
      {(formMode === 'create' || formMode === 'edit') && (
        <UserFormModal
          mode={formMode}
          user={selectedUser}
          saving={saving}
          error={formError}
          onClose={onCloseForm}
          onCreate={onCreateUser}
          onUpdate={onUpdateUser}
        />
      )}

      {/* Reset Password Modal */}
      {formMode === 'resetPassword' && selectedUser && (
        <ResetPasswordModal
          username={selectedUser.username}
          saving={saving}
          error={formError}
          onClose={onCloseForm}
          onReset={onResetPassword}
        />
      )}

      {/* Delete Confirm Modal */}
      {confirmDeleteUser && (
        <ConfirmDeleteModal
          user={confirmDeleteUser}
          saving={saving}
          onConfirm={onDeleteUser}
          onCancel={onCancelDelete}
        />
      )}
    </div>
  );
}

/* ============================
   Create/Edit User Modal
   ============================ */

function UserFormModal({
  mode,
  user,
  saving,
  error,
  onClose,
  onCreate,
  onUpdate,
}: {
  mode: 'create' | 'edit';
  user: UserRecord | null;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onCreate: (data: CreateUserInput) => void;
  onUpdate: (data: UpdateUserInput) => void;
}) {
  const [username, setUsername] = useState(user?.username || '');
  const [name, setName] = useState(user?.name || '');
  const [email, setEmail] = useState(user?.email || '');
  const [role, setRole] = useState(user?.role || 'sales_agent');
  const [password, setPassword] = useState('');
  const [isActive, setIsActive] = useState(user?.isActive ?? true);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (mode === 'create') {
      onCreate({ username, name, email, role, password });
    } else {
      onUpdate({ username, name, email, role, isActive });
    }
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">
            {mode === 'create' ? 'משתמש חדש' : `עריכת ${user?.name}`}
          </h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" dir="rtl">
          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={3}
              />
            </div>
          )}

          {mode === 'edit' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">שם משתמש</label>
              <input
                type="text"
                value={username}
                onChange={(e) => setUsername(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={3}
              />
            </div>
          )}

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">שם מלא</label>
            <input
              type="text"
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={2}
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">אימייל</label>
            <input
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">תפקיד</label>
            <select
              value={role}
              onChange={(e) => setRole(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
            >
              {ROLES.map((r) => (
                <option key={r.value} value={r.value}>{r.label}</option>
              ))}
            </select>
          </div>

          {mode === 'create' && (
            <div>
              <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
                required
                minLength={8}
                placeholder="לפחות 8 תווים, אות גדולה, קטנה ומספר"
              />
            </div>
          )}

          {mode === 'edit' && (
            <div className="flex items-center gap-2">
              <input
                type="checkbox"
                id="isActive"
                checked={isActive}
                onChange={(e) => setIsActive(e.target.checked)}
                className="h-4 w-4 rounded border-gray-300 text-blue-600"
              />
              <label htmlFor="isActive" className="text-sm text-gray-700">משתמש פעיל</label>
            </div>
          )}

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-blue-600 text-white rounded-lg font-medium text-sm hover:bg-blue-700 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              {mode === 'create' ? 'צור משתמש' : 'שמור שינויים'}
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================
   Reset Password Modal
   ============================ */

function ResetPasswordModal({
  username,
  saving,
  error,
  onClose,
  onReset,
}: {
  username: string;
  saving: boolean;
  error: string | null;
  onClose: () => void;
  onReset: (newPassword: string) => void;
}) {
  const [newPassword, setNewPassword] = useState('');

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onReset(newPassword);
  };

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onClose}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="flex items-center justify-between p-5 border-b border-gray-100">
          <h2 className="text-lg font-bold text-gray-900">איפוס סיסמה</h2>
          <button onClick={onClose} className="p-1 rounded-lg hover:bg-gray-100">
            <X className="h-5 w-5 text-gray-400" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4" dir="rtl">
          <p className="text-sm text-gray-600">
            איפוס סיסמה עבור <span className="font-bold">{username}</span>
          </p>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">סיסמה חדשה</label>
            <input
              type="password"
              value={newPassword}
              onChange={(e) => setNewPassword(e.target.value)}
              className="w-full px-3 py-2 border border-gray-300 rounded-lg text-sm focus:ring-2 focus:ring-blue-500 focus:border-blue-500"
              required
              minLength={6}
              placeholder="לפחות 6 תווים"
            />
          </div>

          {error && (
            <div className="bg-red-50 border border-red-200 rounded-lg p-3 text-red-700 text-sm">
              {error}
            </div>
          )}

          <div className="flex gap-3 pt-2">
            <button
              type="submit"
              disabled={saving}
              className="flex-1 py-2.5 bg-amber-500 text-white rounded-lg font-medium text-sm hover:bg-amber-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              אפס סיסמה
            </button>
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}

/* ============================
   Confirm Delete Modal
   ============================ */

function ConfirmDeleteModal({
  user,
  saving,
  onConfirm,
  onCancel,
}: {
  user: UserRecord;
  saving: boolean;
  onConfirm: () => void;
  onCancel: () => void;
}) {
  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4" onClick={onCancel}>
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-sm" onClick={(e) => e.stopPropagation()}>
        <div className="p-6 text-center" dir="rtl">
          <div className="w-14 h-14 bg-red-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <UserX className="h-7 w-7 text-red-500" />
          </div>
          <h3 className="text-lg font-bold text-gray-900 mb-2">השבתת משתמש</h3>
          <p className="text-sm text-gray-600 mb-6">
            האם להשבית את המשתמש <span className="font-bold">{user.name}</span> ({user.username})?
            <br />
            <span className="text-xs text-gray-400">המשתמש לא יוכל להתחבר למערכת</span>
          </p>
          <div className="flex gap-3">
            <button
              onClick={onConfirm}
              disabled={saving}
              className="flex-1 py-2.5 bg-red-500 text-white rounded-lg font-medium text-sm hover:bg-red-600 disabled:opacity-50 transition-all flex items-center justify-center gap-2"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              השבת
            </button>
            <button
              onClick={onCancel}
              className="flex-1 py-2.5 bg-gray-100 text-gray-700 rounded-lg font-medium text-sm hover:bg-gray-200 transition-all"
            >
              ביטול
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
