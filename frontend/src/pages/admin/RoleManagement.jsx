import { useState, useEffect } from 'react';
import { 
  ShieldCheckIcon, 
  PlusIcon, 
  PencilIcon, 
  TrashIcon,
  UserGroupIcon 
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import FormInput from '../../components/forms/FormInput';
import Loader from '../../components/common/Loader';
import { useToast } from '../../hooks/useToast';
import { ROLES } from '../../utils/constants';
import apiClient from '../../api/axios';

/**
 * Role Management Page - FAZ 7
 * Manage system roles and their permissions
 */
export default function RoleManagement() {
  const { t } = useTranslation();
  const { success, error: showError } = useToast();
  const [loading, setLoading] = useState(false);
  const [roles, setRoles] = useState([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [editingRole, setEditingRole] = useState(null);
  const [formData, setFormData] = useState({
    name: '',
    display_name: '',
    description: '',
    permissions: []
  });
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Mock permissions list (should be fetched from backend)
  const availablePermissions = [
    { id: 'view_inventory', name: t('inventory.g_r_nt_leme'), category: 'Envanter' },
    { id: 'manage_inventory', name: t('inventory.y_netimi'), category: 'Envanter' },
    { id: 'view_transactions', name: t('other.islem_goruntuleme'), category: t('common.actions') },
    { id: 'approve_transactions', name: t('purchase.i_lem_onaylama'), category: t('common.actions') },
    { id: 'view_requests', name: t('purchase.talep_g_r_nt_leme'), category: t('purchase.talepler') },
    { id: 'manage_requests', name: t('purchase.talep_y_netimi'), category: t('purchase.talepler') },
    { id: 'view_reports', name: t('reports.rapor_g_r_nt_leme'), category: 'Raporlar' },
    { id: 'manage_users', name: t('admin.kullan_c_y_netimi'), category: t('other.yonetim') },
    { id: 'manage_roles', name: t('admin.rol_y_netimi'), category: t('other.yonetim') },
    { id: 'system_settings', name: t('admin.sistem_ayarlar'), category: t('other.yonetim') },
  ];

  useEffect(() => {
    fetchRoles();
    fetchPermissions();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchRoles = async () => {
    setLoading(true);
    try {
      const response = await apiClient.get('/admin/roles');
      console.log('📦 Fetched roles from backend:', response.data.roles);
      
      // Transform backend format to frontend format
      const transformedRoles = (response.data.roles || []).map(role => {
        const transformed = {
          id: role.id,
          name: role.role_name.toLowerCase().replace(/\s+/g, '_'), // Replace ALL spaces with underscore
          display_name: role.role_name,
          description: getRoleDescription(role.role_name),
          permissions: getRolePermissions(role.role_name),
          user_count: role.users_count || 0
        };
        console.log('✨ Transformed role:', role.role_name, '→', transformed);
        return transformed;
      });
      
      console.log('✅ All transformed roles:', transformedRoles);
      setRoles(transformedRoles);
    } catch (err) {
      showError(t('admin.roller_y_klenirken_hata_olu_tu'));
      console.error('❌ Error fetching roles:', err);
    } finally {
      setLoading(false);
    }
  };

  const fetchPermissions = async () => {
    try {
      const response = await apiClient.get('/admin/permissions');
      if (response.data.permissions) {
        // Backend returns permission groups, transform to flat list
        const flatPermissions = [];
        response.data.permissions.forEach(group => {
          group.permissions.forEach(perm => {
            flatPermissions.push({
              id: perm.name,
              name: perm.label,
              category: group.group
            });
          });
        });
        // Update availablePermissions if needed
        // For now, we keep the existing structure
      }
    } catch (err) {
      console.error('Failed to fetch permissions:', err);
    }
  };

  const getRoleDescription = (roleName) => {
    const descriptions = {
      'Admin': t('admin.t_m_sistem_yetkilerine_sahiptir'),
      'Inventory Manager': t('inventory.ve_talep_y_netimi_yetkilerine_sahiptir'),
      'Staff': t('purchase.g_r_nt_leme_ve_temel_talep_olu_turma_yetkilerine_sahiptir')
    };
    return descriptions[roleName] || t('admin.zel_rol');
  };

  const getRolePermissions = (roleName) => {
    const rolePerms = {
      'Admin': availablePermissions.map(p => p.id),
      'Inventory Manager': ['view_inventory', 'manage_inventory', 'view_transactions', 'approve_transactions', 'view_requests', 'manage_requests', 'view_reports'],
      'Staff': ['view_inventory', 'view_transactions', 'view_requests', 'view_reports']
    };
    return rolePerms[roleName] || [];
  };

  const handleOpenModal = (role = null) => {
    if (role) {
      setEditingRole(role);
      setFormData({
        name: role.name,
        display_name: role.display_name,
        description: role.description,
        permissions: role.permissions || []
      });
    } else {
      setEditingRole(null);
      setFormData({
        name: '',
        display_name: '',
        description: '',
        permissions: []
      });
    }
    setIsModalOpen(true);
  };

  const handleCloseModal = () => {
    setIsModalOpen(false);
    setEditingRole(null);
    setFormData({ name: '', display_name: '', description: '', permissions: [] });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    
    if (!formData.display_name) {
      showError(t('admin.l_tfen_rol_ad_n_girin'));
      return;
    }

    setLoading(true);
    try {
      const payload = {
        role_name: formData.display_name, // Backend expects 'role_name'
      };

      if (editingRole) {
        await apiClient.put(`/admin/roles/${editingRole.id}`, payload);
        success(t('admin.rol_ba_ar_yla_g_ncellendi'));
      } else {
        await apiClient.post('/admin/roles', payload);
        success(t('admin.rol_ba_ar_yla_olu_turuldu'));
      }
      
      handleCloseModal();
      fetchRoles();
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('messages.i_lem_s_ras_nda_hata_olu_tu');
      showError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    try {
      await apiClient.delete(`/admin/roles/${deleteConfirm.id}`);
      success(t('admin.rol_ba_ar_yla_silindi'));
      setDeleteConfirm(null);
      fetchRoles();
    } catch (err) {
      const errorMsg = err.response?.data?.message || t('admin.rol_silinirken_hata_olu_tu');
      showError(errorMsg);
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const togglePermission = (permissionId) => {
    setFormData(prev => ({
      ...prev,
      permissions: prev.permissions.includes(permissionId)
        ? prev.permissions.filter(p => p !== permissionId)
        : [...prev.permissions, permissionId]
    }));
  };

  const groupedPermissions = availablePermissions.reduce((acc, perm) => {
    if (!acc[perm.category]) acc[perm.category] = [];
    acc[perm.category].push(perm);
    return acc;
  }, {});

  const columns = [
    {
      header: t('admin.rol_ad'),
      accessor: 'display_name',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <ShieldCheckIcon className="h-5 w-5 text-blue-500" />
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.display_name}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{row.name}</div>
          </div>
        </div>
      )
    },
    {
      header: t('common.description'),
      accessor: 'description'
    },
    {
      header: 'Yetkiler',
      accessor: 'permissions',
      cell: (row) => (
        <div className="flex flex-wrap gap-1">
          {row.permissions?.slice(0, 3).map((perm) => (
            <Badge key={perm} variant="secondary" size="sm">
              {availablePermissions.find(p => p.id === perm)?.name || perm}
            </Badge>
          ))}
          {row.permissions?.length > 3 && (
            <Badge variant="secondary" size="sm">
              +{row.permissions.length - 3} daha
            </Badge>
          )}
        </div>
      )
    },
    {
      header: t('admin.kullan_c'),
      accessor: 'user_count',
      cell: (row) => (
        <div className="flex items-center gap-1 text-gray-700 dark:text-gray-300">
          <UserGroupIcon className="h-4 w-4" />
          <span className="font-medium">{row.user_count}</span>
        </div>
      )
    },
    {
      header: t('common.actions'),
      accessor: 'id',
      cell: (row) => (
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(row)}
            disabled={row.name === 'admin'} // Prevent editing admin role
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirm(row)}
            disabled={row.name === 'admin' || row.user_count > 0}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  if (loading && !roles.length) {
    return <Loader fullScreen text={t('admin.roller_y_kleniyor')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.rol_y_netimi')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('admin.manageRolesDescription')}
          </p>
        </div>
        <Button
          onClick={() => handleOpenModal()}
          icon={<PlusIcon className="h-5 w-5" />}
        >
          {t('admin.newRole')}
        </Button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalRoles')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{roles.length}</p>
            </div>
            <ShieldCheckIcon className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.availablePermissions')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{availablePermissions.length}</p>
            </div>
            <ShieldCheckIcon className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.toplam_kullan_c')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {roles.reduce((sum, role) => sum + (role.user_count || 0), 0)}
              </p>
            </div>
            <UserGroupIcon className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Roles Table */}
      <Card title={t('admin.rolesTitle')}>
        <Table columns={columns} data={roles} />
      </Card>

      {/* Role Form Modal */}
      <Modal
        isOpen={isModalOpen}
        onClose={handleCloseModal}
        title={editingRole ? t('admin.rol_d_zenle') : t('admin.yeni_rol_olu_tur')}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <FormInput
              label={t('admin.roleCode')}
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
              required
              placeholder="admin, staff, vb."
              disabled={editingRole?.name === 'admin'}
            />
            <FormInput
              label={t('other.gorunen_ad')}
              value={formData.display_name}
              onChange={(e) => setFormData({ ...formData, display_name: e.target.value })}
              required
              placeholder="Administrator"
            />
          </div>

          <FormInput
            label={t('common.description')}
            type="textarea"
            value={formData.description}
            onChange={(e) => setFormData({ ...formData, description: e.target.value })}
            rows={2}
          />

          {/* Permissions */}
          <div>
            <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-3">
              Yetkiler
            </label>
            <div className="space-y-4 max-h-96 overflow-y-auto border border-gray-200 dark:border-gray-600 rounded-lg p-4">
              {Object.entries(groupedPermissions).map(([category, perms]) => (
                <div key={category}>
                  <h4 className="font-medium text-gray-900 dark:text-gray-100 mb-2">{category}</h4>
                  <div className="space-y-2">
                    {perms.map((perm) => (
                      <label key={perm.id} className="flex items-center gap-2 cursor-pointer">
                        <input
                          type="checkbox"
                          checked={formData.permissions.includes(perm.id)}
                          onChange={() => togglePermission(perm.id)}
                          disabled={editingRole?.name === 'admin'}
                          className="h-4 w-4 text-blue-600 focus:ring-blue-500 border-gray-300 rounded"
                        />
                        <span className="text-sm text-gray-700">{perm.name}</span>
                      </label>
                    ))}
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="flex justify-end gap-3 pt-4 border-t">
            <Button type="button" variant="outline" onClick={handleCloseModal}>
              İptal
            </Button>
            <Button type="submit" loading={loading}>
              {editingRole ? t('common.update') : t('other.olustur')}
            </Button>
          </div>
        </form>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('admin.rol_sil')}
      >
        <p className="text-gray-600 mb-6">
          <strong>{deleteConfirm?.display_name}</strong> rolünü silmek istediğinizden emin misiniz? 
          Bu işlem geri alınamaz.
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            İptal
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            Sil
          </Button>
        </div>
      </Modal>
    </div>
  );
}
