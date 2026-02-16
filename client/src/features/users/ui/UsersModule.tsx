import { useState, useEffect, useCallback } from 'react';
import { usersApi, type UserRecord, type CreateUserInput, type UpdateUserInput } from '../api/users.api';
import { UsersModuleView } from './UsersModuleView';

interface UsersModuleProps {
  onBack: () => void;
}

export type UserFormMode = 'create' | 'edit' | 'resetPassword' | null;

export function UsersModule({ onBack }: UsersModuleProps) {
  const [users, setUsers] = useState<UserRecord[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filters
  const [filterRole, setFilterRole] = useState<string>('');
  const [filterActive, setFilterActive] = useState<string>('');

  // Form state
  const [formMode, setFormMode] = useState<UserFormMode>(null);
  const [selectedUser, setSelectedUser] = useState<UserRecord | null>(null);
  const [saving, setSaving] = useState(false);
  const [formError, setFormError] = useState<string | null>(null);

  // Confirm delete
  const [confirmDeleteUser, setConfirmDeleteUser] = useState<UserRecord | null>(null);

  const fetchUsers = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const filters: { role?: string; isActive?: string } = {};
      if (filterRole) filters.role = filterRole;
      if (filterActive) filters.isActive = filterActive;
      const data = await usersApi.getUsers(filters);
      setUsers(data);
    } catch {
      setError('שגיאה בטעינת רשימת המשתמשים');
    } finally {
      setLoading(false);
    }
  }, [filterRole, filterActive]);

  useEffect(() => {
    fetchUsers();
  }, [fetchUsers]);

  const handleCreateUser = async (data: CreateUserInput) => {
    setSaving(true);
    setFormError(null);
    try {
      await usersApi.createUser(data);
      setFormMode(null);
      await fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'שגיאה ביצירת המשתמש');
    } finally {
      setSaving(false);
    }
  };

  const handleUpdateUser = async (data: UpdateUserInput) => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      await usersApi.updateUser(selectedUser.id, data);
      setFormMode(null);
      setSelectedUser(null);
      await fetchUsers();
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'שגיאה בעדכון המשתמש');
    } finally {
      setSaving(false);
    }
  };

  const handleResetPassword = async (newPassword: string) => {
    if (!selectedUser) return;
    setSaving(true);
    setFormError(null);
    try {
      await usersApi.resetPassword(selectedUser.id, newPassword);
      setFormMode(null);
      setSelectedUser(null);
    } catch (err) {
      setFormError(err instanceof Error ? err.message : 'שגיאה באיפוס הסיסמה');
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteUser = async () => {
    if (!confirmDeleteUser) return;
    setSaving(true);
    try {
      await usersApi.deleteUser(confirmDeleteUser.id);
      setConfirmDeleteUser(null);
      await fetchUsers();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'שגיאה בהשבתת המשתמש');
    } finally {
      setSaving(false);
    }
  };

  const handleOpenEdit = (user: UserRecord) => {
    setSelectedUser(user);
    setFormMode('edit');
    setFormError(null);
  };

  const handleOpenResetPassword = (user: UserRecord) => {
    setSelectedUser(user);
    setFormMode('resetPassword');
    setFormError(null);
  };

  const handleOpenCreate = () => {
    setSelectedUser(null);
    setFormMode('create');
    setFormError(null);
  };

  const handleCloseForm = () => {
    setFormMode(null);
    setSelectedUser(null);
    setFormError(null);
  };

  return (
    <UsersModuleView
      users={users}
      loading={loading}
      error={error}
      filterRole={filterRole}
      filterActive={filterActive}
      formMode={formMode}
      selectedUser={selectedUser}
      saving={saving}
      formError={formError}
      confirmDeleteUser={confirmDeleteUser}
      onBack={onBack}
      onFilterRole={setFilterRole}
      onFilterActive={setFilterActive}
      onOpenCreate={handleOpenCreate}
      onOpenEdit={handleOpenEdit}
      onOpenResetPassword={handleOpenResetPassword}
      onCloseForm={handleCloseForm}
      onCreateUser={handleCreateUser}
      onUpdateUser={handleUpdateUser}
      onResetPassword={handleResetPassword}
      onConfirmDelete={setConfirmDeleteUser}
      onDeleteUser={handleDeleteUser}
      onCancelDelete={() => setConfirmDeleteUser(null)}
    />
  );
}
