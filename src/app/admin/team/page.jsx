'use client';

import { useEffect, useState, useMemo } from 'react';
import AdminLayout from '../AdminLayout';
import { useRouter } from 'next/navigation';
import { useTheme } from '../../providers';
import {
  useGetTeamMembersQuery,
  useCreateTeamMemberMutation,
  useUpdateTeamMemberMutation,
  useDeleteTeamMemberMutation,
} from '../../../services/api';
import {
  IoSearchOutline,
  IoAddOutline,
  IoClose,
  IoCheckmarkCircleOutline,
  IoCloseCircleOutline,
  IoPencilOutline,
  IoTrashOutline,
  IoPersonOutline,
  IoMailOutline,
  IoLockClosedOutline,
  IoShieldCheckmarkOutline,
  IoEyeOutline,
  IoEyeOffOutline,
} from 'react-icons/io5';

const AVAILABLE_PAGES = [
  { id: 'dashboard', label: 'Overview' },
  { id: 'catalog', label: 'Catalog' },
  { id: 'orders', label: 'Orders' },
  { id: 'kitchen', label: 'Kitchen' },
  { id: 'invoices', label: 'Invoices' },
  { id: 'waiters', label: 'Waiters' },
  { id: 'analytics', label: 'Analytics' },
  { id: 'team', label: 'Team' },
  { id: 'settings', label: 'Settings' },
];

export default function TeamPage() {
  const { colors, theme } = useTheme();
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [showPassword, setShowPassword] = useState(false);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'admin',
    permissions: [],
  });

  const { data: usersData = [], isLoading, refetch } = useGetTeamMembersQuery(undefined, {
    refetchOnMountOrArgChange: true,
  });
  const [createTeamMember] = useCreateTeamMemberMutation();
  const [updateTeamMember] = useUpdateTeamMemberMutation();
  const [deleteTeamMember] = useDeleteTeamMemberMutation();

  // Filter to show only admin users
  const adminUsers = useMemo(() => {
    return usersData.filter(user => user.role === 'admin');
  }, [usersData]);

  const filteredUsers = useMemo(() => {
    let filtered = adminUsers;

    if (search.trim()) {
      const q = search.toLowerCase();
      filtered = filtered.filter(u =>
        u.name?.toLowerCase().includes(q) ||
        u.email?.toLowerCase().includes(q) ||
        u.username?.toLowerCase().includes(q)
      );
    }

    return filtered;
  }, [adminUsers, search]);

  useEffect(() => {
    const token = typeof window !== 'undefined' ? localStorage.getItem('nv_token') : null;
    if (!token) router.replace('/admin/login');
  }, [router]);

  const handleOpenModal = (user = null) => {
    if (user) {
      setEditingUser(user);
      setFormData({
        name: user.name || '',
        email: user.email || '',
        password: '', // Don't pre-fill password
        role: user.role || 'admin',
        permissions: user.permissions || [],
      });
    } else {
      setEditingUser(null);
      setFormData({
        name: '',
        email: '',
        password: '',
        role: 'admin',
        permissions: [],
      });
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingUser(null);
    setShowPassword(false);
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'admin',
      permissions: [],
    });
  };

  const handleTogglePermission = (pageId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(pageId)
        ? prev.permissions.filter(p => p !== pageId)
        : [...prev.permissions, pageId]
    }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    try {
      const submitData = {
        name: formData.name,
        email: formData.email,
        role: formData.role,
        permissions: formData.permissions,
      };

      // Only include password if it's provided (for new users or when updating)
      if (formData.password) {
        submitData.password = formData.password;
      }

      if (editingUser) {
        await updateTeamMember({ id: editingUser._id, ...submitData }).unwrap();
      } else {
        if (!formData.password) {
          alert('Password is required for new users');
          return;
        }
        await createTeamMember(submitData).unwrap();
      }

      handleCloseModal();
      refetch();
    } catch (error) {
      console.error('Failed to save user:', error);
      alert(error?.data?.message || 'Failed to save user. Please try again.');
    }
  };

  const handleDelete = async (userId) => {
    if (!window.confirm('Are you sure you want to delete this team member?')) {
      return;
    }

    try {
      await deleteTeamMember({ id: userId }).unwrap();
      refetch();
    } catch (error) {
      console.error('Failed to delete user:', error);
      alert('Failed to delete user. Please try again.');
    }
  };

  const stats = useMemo(() => {
    const total = adminUsers.length;
    const active = adminUsers.filter(u => u.isActive).length;
    const withPermissions = adminUsers.filter(u => u.permissions && u.permissions.length > 0).length;

    return { total, active, withPermissions };
  }, [adminUsers]);

  return (
    <AdminLayout title="Team" active="team" requiredPermission="team">
      <div className="max-w-7xl mx-auto p-4 space-y-4">
        {/* Stats */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
          <div className="rounded-2xl p-4 relative overflow-hidden" style={{ background: `linear-gradient(135deg, ${colors.amber500}, #f59e0b)`, border: `1px solid ${colors.amber500}` }}>
            <div className="text-base font-medium mb-1" style={{ color: 'rgba(255,255,255,0.9)' }}>Total Team Members</div>
            <div className="text-5xl font-extrabold" style={{ color: '#fff' }}>{stats.total}</div>
            <div className="absolute -right-8 -bottom-8 h-24 w-24 rounded-full opacity-20" style={{ background: '#fff' }} />
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-base font-medium mb-1" style={{ color: colors.mutedText }}>Active</div>
            <div className="text-5xl font-extrabold" style={{ color: colors.green600 }}>{stats.active}</div>
          </div>
          <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
            <div className="text-base font-medium mb-1" style={{ color: colors.mutedText }}>With Permissions</div>
            <div className="text-5xl font-extrabold" style={{ color: colors.blue600 || '#2563EB' }}>{stats.withPermissions}</div>
          </div>
        </div>

        {/* Actions Bar */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex flex-col md:flex-row gap-3">
            <div className="flex-1 relative">
              <IoSearchOutline className="absolute left-3 top-1/2 -translate-y-1/2 h-6 w-6" style={{ color: colors.mutedText }} />
              <input
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search by name, email, or username..."
                className="w-full rounded-lg pl-10 pr-4 py-3 text-lg font-medium"
                style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
              />
            </div>
            <button
              onClick={() => handleOpenModal()}
              className="px-6 py-3 rounded-lg text-lg font-semibold transition-transform hover:scale-105 flex items-center gap-2"
              style={{ background: colors.green500, color: '#fff' }}
            >
              <IoAddOutline className="h-6 w-6" />
              Add Team Member
            </button>
          </div>
        </div>

        {/* Team Members List */}
        <div className="rounded-2xl p-4" style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 4px 12px rgba(16,24,40,0.06)' : '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="flex items-center justify-between mb-4">
            <div className="text-xl font-bold" style={{ color: colors.text }}>Team Members</div>
            <div className="text-lg" style={{ color: colors.mutedText }}>{filteredUsers.length} members</div>
          </div>

          {isLoading ? (
            <div className="flex items-center justify-center py-12">
              <div className="text-lg" style={{ color: colors.mutedText }}>Loading team members...</div>
            </div>
          ) : filteredUsers.length === 0 ? (
            <div className="flex flex-col items-center justify-center py-12">
              <IoPersonOutline className="h-16 w-16 mb-4" style={{ color: colors.mutedText }} />
              <div className="text-lg font-medium mb-1" style={{ color: colors.text }}>No team members found</div>
              <div className="text-base" style={{ color: colors.mutedText }}>Click "Add Team Member" to create a new admin user.</div>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
              {filteredUsers.map((user) => {
                const hasAllAccess = !user.permissions || user.permissions.length === 0 || user.permissions.length === AVAILABLE_PAGES.length;

                return (
                  <div
                    key={user._id}
                    className="rounded-xl p-4 transition-all"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, boxShadow: theme === 'light' ? '0 2px 8px rgba(16,24,40,0.04)' : '0 2px 8px rgba(0,0,0,0.2)' }}
                  >
                    <div className="flex items-start justify-between mb-3">
                      <div className="flex items-center gap-3">
                        <div className="h-12 w-12 rounded-full flex items-center justify-center text-xl font-bold" style={{ background: colors.amber500, color: '#fff' }}>
                          {user.name?.charAt(0).toUpperCase() || 'A'}
                        </div>
                        <div>
                          <div className="text-lg font-bold" style={{ color: colors.text }}>{user.name || 'No Name'}</div>
                          <div className="text-base" style={{ color: colors.mutedText }}>{user.email}</div>
                        </div>
                      </div>
                      <div className="flex items-center gap-2">
                        <button
                          onClick={() => handleOpenModal(user)}
                          className="p-2 rounded-lg transition-transform hover:scale-110"
                          style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                        >
                          <IoPencilOutline className="h-5 w-5" />
                        </button>
                        <button
                          onClick={() => handleDelete(user._id)}
                          className="p-2 rounded-lg transition-transform hover:scale-110"
                          style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020', color: '#DC2626' }}
                        >
                          <IoTrashOutline className="h-5 w-5" />
                        </button>
                      </div>
                    </div>

                    <div className="space-y-2">
                      {user.username && (
                        <div className="flex items-center gap-2 text-base" style={{ color: colors.mutedText }}>
                          <IoPersonOutline className="h-5 w-5" />
                          <span>@{user.username}</span>
                        </div>
                      )}

                      <div className="flex items-center gap-2 text-base">
                        {user.isActive ? (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold" style={{ background: theme === 'light' ? '#ECFDF5' : '#052e21', color: colors.green700 || '#047857' }}>
                            <IoCheckmarkCircleOutline className="h-4 w-4" />
                            Active
                          </span>
                        ) : (
                          <span className="inline-flex items-center gap-1 px-2 py-1 rounded-full text-sm font-semibold" style={{ background: theme === 'light' ? '#FEF2F2' : '#3A2020', color: '#DC2626' }}>
                            <IoCloseCircleOutline className="h-4 w-4" />
                            Inactive
                          </span>
                        )}
                      </div>

                      <div className="pt-2" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                        <div className="text-sm font-semibold mb-2" style={{ color: colors.mutedText }}>Page Access:</div>
                        {hasAllAccess ? (
                          <div className="text-base font-medium" style={{ color: colors.green600 }}>
                            <IoShieldCheckmarkOutline className="inline h-5 w-5 mr-1" />
                            Full Access (All Pages)
                          </div>
                        ) : user.permissions && user.permissions.length > 0 ? (
                          <div className="flex flex-wrap gap-1">
                            {user.permissions.map(perm => {
                              const page = AVAILABLE_PAGES.find(p => p.id === perm);
                              return page ? (
                                <span
                                  key={perm}
                                  className="text-sm px-2 py-1 rounded font-medium"
                                  style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                                >
                                  {page.label}
                                </span>
                              ) : null;
                            })}
                          </div>
                        ) : (
                          <div className="text-base" style={{ color: colors.mutedText }}>No specific permissions set</div>
                        )}
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>

      {/* Create/Edit Modal */}
      {showModal && (
        <div
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ background: 'rgba(0,0,0,0.8)', backdropFilter: 'blur(4px)' }}
          onClick={handleCloseModal}
        >
          <div
            className="relative max-w-2xl w-full max-h-[90vh] overflow-y-auto rounded-2xl p-6"
            style={{ background: colors.cardBg, border: `1px solid ${colors.cardBorder}` }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="flex items-center justify-between mb-6">
              <h2 className="text-3xl font-bold" style={{ color: colors.text }}>
                {editingUser ? 'Edit Team Member' : 'Add Team Member'}
              </h2>
              <button
                onClick={handleCloseModal}
                className="p-2 rounded-lg transition-transform hover:scale-110"
                style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
              >
                <IoClose className="h-6 w-6" />
              </button>
            </div>

            <form onSubmit={handleSubmit} className="space-y-4">
              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: colors.text }}>
                  Name *
                </label>
                <input
                  type="text"
                  required
                  value={formData.name}
                  onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-lg"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  placeholder="Enter full name"
                />
              </div>

              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: colors.text }}>
                  Email *
                </label>
                <input
                  type="email"
                  required
                  value={formData.email}
                  onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                  className="w-full rounded-lg px-4 py-3 text-lg"
                  style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                  placeholder="Enter email address"
                />
              </div>

              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: colors.text }}>
                  Password {editingUser ? '(leave blank to keep current)' : '*'}
                </label>
                <div className="relative">
                  <input
                    type={showPassword ? 'text' : 'password'}
                    required={!editingUser}
                    value={formData.password}
                    onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                    className="w-full rounded-lg px-4 py-3 pr-12 text-lg"
                    style={{ background: colors.background, border: `1px solid ${colors.cardBorder}`, color: colors.text }}
                    placeholder={editingUser ? "Enter new password (optional)" : "Enter password"}
                  />
                  <button
                    type="button"
                    onClick={() => setShowPassword(!showPassword)}
                    className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-lg transition-transform hover:scale-110"
                    style={{ color: colors.mutedText }}
                  >
                    {showPassword ? (
                      <IoEyeOffOutline className="h-6 w-6" />
                    ) : (
                      <IoEyeOutline className="h-6 w-6" />
                    )}
                  </button>
                </div>
              </div>

              <div>
                <label className="block text-base font-semibold mb-2" style={{ color: colors.text }}>
                  Page Access Permissions
                </label>
                <div className="text-sm mb-3" style={{ color: colors.mutedText }}>
                  Select which pages this team member can access. Leave empty or select all for full access.
                </div>
                <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-2 p-4 rounded-lg" style={{ background: colors.background, border: `1px solid ${colors.cardBorder}` }}>
                  {AVAILABLE_PAGES.map((page) => {
                    const isSelected = formData.permissions.includes(page.id);
                    return (
                      <label
                        key={page.id}
                        className="flex items-center gap-2 p-2 rounded-lg cursor-pointer transition-all"
                        style={{
                          background: isSelected ? (theme === 'light' ? '#ECFDF5' : '#052e21') : 'transparent',
                          border: `1px solid ${isSelected ? colors.green500 : colors.cardBorder}`
                        }}
                      >
                        <input
                          type="checkbox"
                          checked={isSelected}
                          onChange={() => handleTogglePermission(page.id)}
                          className="rounded"
                          style={{ accentColor: colors.green500 }}
                        />
                        <span className="text-base font-medium" style={{ color: colors.text }}>
                          {page.label}
                        </span>
                      </label>
                    );
                  })}
                </div>
              </div>

              <div className="flex items-center gap-3 pt-4" style={{ borderTop: `1px solid ${colors.cardBorder}` }}>
                <button
                  type="submit"
                  className="flex-1 px-4 py-3 rounded-lg text-lg font-semibold transition-transform hover:scale-105"
                  style={{ background: colors.green500, color: '#fff' }}
                >
                  {editingUser ? 'Update Team Member' : 'Create Team Member'}
                </button>
                <button
                  type="button"
                  onClick={handleCloseModal}
                  className="px-4 py-3 rounded-lg text-lg font-semibold transition-transform hover:scale-105"
                  style={{ background: theme === 'light' ? '#F3F4F6' : '#1F2937', color: colors.text }}
                >
                  Cancel
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </AdminLayout>
  );
}


