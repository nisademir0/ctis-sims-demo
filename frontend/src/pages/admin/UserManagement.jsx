import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { useNavigate } from 'react-router-dom';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Badge from '../../components/common/Badge';
import Loader from '../../components/common/Loader';
import { useToast } from '../../hooks/useToast';
import { useAuth } from '../../context/AuthContext';
import { ROLES, isAdmin } from '../../utils/constants';
import {
  UserGroupIcon,
  PlusIcon,
  PencilIcon,
  TrashIcon,
  ShieldCheckIcon,
} from '@heroicons/react/24/outline';
import apiClient from '../../api/axios';

/**
 * User Management Page Component (Admin Only)
 * 
 * Features:
 * - List all users
 * - Create new user
 * - Edit user
 * - Delete user
 * - Role assignment
 * - Status management
 */
const UserManagement = () => {
  const { t } = useTranslation();
  const navigate = useNavigate();
  const { user: currentUser } = useAuth();
  const toast = useToast();
  const [users, setUsers] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingUser, setEditingUser] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    password: '',
    role: 'staff',
    is_active: true,
  });

  // Check if current user is admin
  useEffect(() => {
    if (!isAdmin(currentUser)) {
      toast.error(t('admin.bu_sayfaya_eri_im_yetkiniz_yok'));
      navigate('/');
      return;
    }
    loadUsers();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [currentUser]);

  const loadUsers = async () => {
    try {
      setLoading(true);
      const { data } = await apiClient.get('/users');
      
      // Transform backend format (role_id + role object) to frontend format (role string)
      const transformedUsers = (data.users || []).map(user => ({
        ...user,
        role: user.role?.role_name?.toLowerCase().replaceAll(' ', '_') || 'staff',
        is_active: user.is_active ?? true
      }));
      
      setUsers(transformedUsers);
    } catch (error) {
      console.error('Failed to load users:', error);
      toast.error(t('admin.kullan_c_lar_y_klenemedi'));
      setUsers([]);
    } finally {
      setLoading(false);
    }
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    try {
      // Convert role string to role_id
      const roleMap = {
        'admin': 1,
        'inventory_manager': 2,
        'staff': 3
      };
      
      const payload = {
        name: formData.name,
        email: formData.email,
        role_id: roleMap[formData.role] || 3,
        ...(formData.password && { password: formData.password, password_confirmation: formData.password })
      };
      
      if (editingUser) {
        // Update user
        await apiClient.put(`/users/${editingUser.id}`, payload);
        toast.success(t('admin.kullan_c_ba_ar_yla_g_ncellendi'));
      } else {
        // Create user
        await apiClient.post('/users', payload);
        toast.success(t('admin.kullan_c_ba_ar_yla_olu_turuldu'));
      }
      
      setShowModal(false);
      setEditingUser(null);
      resetForm();
      loadUsers();
    } catch (error) {
      console.error('Failed to save user:', error);
      toast.error(error.response?.data?.message || t('messages.bir_hata_olu_tu'));
    }
  };

  const handleEdit = (user) => {
    setEditingUser(user);
    setFormData({
      name: user.name,
      email: user.email,
      password: '', // Don't pre-fill password
      role: user.role,
      is_active: user.is_active,
    });
    setShowModal(true);
  };

  const handleDelete = async (userId) => {
    if (!confirm(t('admin.bu_kullan_c_y_silmek_istedi_inizden_emin_misiniz'))) {
      return;
    }

    try {
      await apiClient.delete(`/users/${userId}`);
      toast.success(t('admin.kullan_c_ba_ar_yla_silindi'));
      loadUsers();
    } catch (error) {
      console.error('Failed to delete user:', error);
      toast.error(error.response?.data?.message || t('admin.kullan_c_silinemedi'));
    }
  };

  const resetForm = () => {
    setFormData({
      name: '',
      email: '',
      password: '',
      role: 'staff',
      is_active: true,
    });
  };

  const getRoleBadgeVariant = (role) => {
    return role === 'admin' ? 'danger' : role === 'inventory_manager' ? 'warning' : 'info';
  };

  const getRoleLabel = (role) => {
    const labels = {
      admin: 'Admin',
      inventory_manager: t('inventory.y_neticisi'),
      staff: 'Personel',
    };
    return labels[role] || role;
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-64">
        <Loader size="lg" />
      </div>
    );
  }

  return (
    <div className="max-w-7xl mx-auto" data-testid="user-management-page">
      {/* Header */}
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900" data-testid="user-management-title">{t('admin.kullan_c_y_netimi')}</h1>
          <p className="mt-1 text-sm text-gray-600">
            {t('admin.manageSystemUsers')}
          </p>
        </div>
        <Button
          variant="primary"
          icon={<PlusIcon className="h-5 w-5" />}
          onClick={() => {
            setEditingUser(null);
            resetForm();
            setShowModal(true);
          }}
          data-testid="new-user-button"
        >
          {t('admin.newUser')}
        </Button>
      </div>

      {/* Users Table */}
      <Card>
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-gray-200">
            <thead className="bg-gray-50">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  İsim
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  E-posta
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  Rol
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('common.status')}
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase">
                  {t('admin.lastLogin')}
                </th>
                <th className="px-6 py-3 text-right text-xs font-medium text-gray-500 uppercase">
                  {t('common.actions')}
                </th>
              </tr>
            </thead>
            <tbody className="bg-white divide-y divide-gray-200">
              {users.map((user) => (
                <tr key={user.id} className="hover:bg-gray-50">
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="flex-shrink-0 h-10 w-10 rounded-full bg-blue-600 flex items-center justify-center text-white font-semibold">
                        {user.name.charAt(0).toUpperCase()}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-gray-900">
                          {user.name}
                        </div>
                        {user.email_verified_at && (
                          <ShieldCheckIcon className="h-4 w-4 text-green-500 inline" title={t('other.e_posta_dogrulandi')} />
                        )}
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-900">
                    {user.email}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={getRoleBadgeVariant(user.role)}>
                      {getRoleLabel(user.role)}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <Badge variant={user.is_active ? 'success' : 'default'}>
                      {user.is_active ? 'Aktif' : 'Pasif'}
                    </Badge>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                    {user.last_login_at ? new Date(user.last_login_at).toLocaleDateString('tr-TR') : '-'}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-right text-sm font-medium">
                    <button
                      onClick={() => handleEdit(user)}
                      className="text-blue-600 hover:text-blue-900 mr-3"
                      title={t('common.edit')}
                    >
                      <PencilIcon className="h-5 w-5" />
                    </button>
                    {user.id !== currentUser?.id && (
                      <button
                        onClick={() => handleDelete(user.id)}
                        className="text-red-600 hover:text-red-900"
                        title={t('common.delete')}
                      >
                        <TrashIcon className="h-5 w-5" />
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>

        {users.length === 0 && (
          <div className="text-center py-12">
            <UserGroupIcon className="mx-auto h-12 w-12 text-gray-400" />
            <h3 className="mt-2 text-sm font-medium text-gray-900">{t('admin.kullan_c_bulunamad')}</h3>
            <p className="mt-1 text-sm text-gray-500">{t('admin.yeni_kullan_c_ekleyerek_ba_lay_n')}</p>
          </div>
        )}
      </Card>

      {/* Create/Edit Modal */}
      {showModal && (
        <div className="fixed inset-0 bg-gray-600 bg-opacity-50 overflow-y-auto h-full w-full z-50">
          <div className="relative top-20 mx-auto p-5 border w-96 shadow-lg rounded-md bg-white">
            <div className="mt-3">
              <h3 className="text-lg font-medium text-gray-900 mb-4">
                {editingUser ? t('admin.kullan_c_y_d_zenle') : t('admin.yeni_kullan_c_olu_tur')}
              </h3>
              
              <form onSubmit={handleSubmit} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    İsim
                  </label>
                  <input
                    type="text"
                    required
                    value={formData.name}
                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    E-posta
                  </label>
                  <input
                    type="email"
                    required
                    value={formData.email}
                    onChange={(e) => setFormData({ ...formData, email: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                  />
                </div>

                {!editingUser && (
                  <div>
                    <label className="block text-sm font-medium text-gray-700">
                      {t('auth.password')}
                    </label>
                    <input
                      type="password"
                      required={!editingUser}
                      value={formData.password}
                      onChange={(e) => setFormData({ ...formData, password: e.target.value })}
                      className="mt-1 block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500"
                    />
                  </div>
                )}

                <div>
                  <label className="block text-sm font-medium text-gray-700">
                    Rol
                  </label>
                  <select
                    required
                    value={formData.role}
                    onChange={(e) => setFormData({ ...formData, role: e.target.value })}
                    className="mt-1 block w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md shadow-sm focus:outline-none focus:ring-blue-500 focus:border-blue-500 dark:bg-gray-700 dark:text-gray-100"
                  >
                    <option value="staff">{t('admin.userRoles.staff')}</option>
                    <option value="inventory_manager">{t('inventory.y_neticisi')}</option>
                    <option value="admin">{t('admin.userRoles.admin')}</option>
                  </select>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="is_active"
                    checked={formData.is_active}
                    onChange={(e) => setFormData({ ...formData, is_active: e.target.checked })}
                    className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                  />
                  <label htmlFor="is_active" className="ml-2 block text-sm text-gray-900">
                    Aktif
                  </label>
                </div>

                <div className="flex gap-3 mt-6">
                  <Button
                    type="button"
                    variant="outline"
                    fullWidth
                    onClick={() => {
                      setShowModal(false);
                      setEditingUser(null);
                      resetForm();
                    }}
                  >
                    İptal
                  </Button>
                  <Button type="submit" variant="primary" fullWidth>
                    {editingUser ? t('common.update') : t('other.olustur')}
                  </Button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default UserManagement;
