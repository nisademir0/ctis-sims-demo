import { useState, useEffect } from 'react';
import { 
  CloudArrowUpIcon,
  CloudArrowDownIcon,
  TrashIcon,
  ClockIcon,
  CheckCircleIcon,
  ExclamationCircleIcon
} from '@heroicons/react/24/outline';
import { useTranslation } from 'react-i18next';
import Button from '../../components/common/Button';
import Card from '../../components/common/Card';
import Badge from '../../components/common/Badge';
import Modal from '../../components/common/Modal';
import Table from '../../components/common/Table';
import Loader from '../../components/common/Loader';
import { useToast } from '../../hooks/useToast';
import { formatDate, formatFileSize } from '../../utils/formatters';

/**
 * Backup & Restore Page - FAZ 7
 * Manage database backups and restore operations
 */
export default function BackupRestore() {
  const { t } = useTranslation();
  const { success, error: showError, info } = useToast();
  const [loading, setLoading] = useState(false);
  const [backups, setBackups] = useState([]);
  const [creatingBackup, setCreatingBackup] = useState(false);
  const [restoreConfirm, setRestoreConfirm] = useState(null);
  const [deleteConfirm, setDeleteConfirm] = useState(null);
  const [autoBackupEnabled, setAutoBackupEnabled] = useState(true);
  const [autoBackupSchedule, setAutoBackupSchedule] = useState('daily');

  useEffect(() => {
    fetchBackups();
    fetchBackupSettings();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const fetchBackups = async () => {
    setLoading(true);
    try {
      const { getBackups } = await import('../../api/admin');
      const response = await getBackups();
      setBackups(response.data.backups || []);
      return;
      
      // Mock data fallback
      await new Promise(resolve => setTimeout(resolve, 800));
      setBackups([
        {
          id: 1,
          filename: 'backup_2025_01_15_10_30.sql',
          size: 15728640, // bytes
          created_at: new Date().toISOString(),
          created_by: 'Admin User',
          type: 'manual',
          status: 'completed',
          records_count: 1234
        },
        {
          id: 2,
          filename: 'backup_2025_01_14_02_00.sql',
          size: 14680064,
          created_at: new Date(Date.now() - 86400000).toISOString(),
          created_by: 'System (Auto)',
          type: 'auto',
          status: 'completed',
          records_count: 1198
        },
        {
          id: 3,
          filename: 'backup_2025_01_13_02_00.sql',
          size: 14155776,
          created_at: new Date(Date.now() - 172800000).toISOString(),
          created_by: 'System (Auto)',
          type: 'auto',
          status: 'completed',
          records_count: 1165
        },
        {
          id: 4,
          filename: 'backup_2025_01_12_15_45.sql',
          size: 13893632,
          created_at: new Date(Date.now() - 259200000).toISOString(),
          created_by: 'Admin User',
          type: 'manual',
          status: 'completed',
          records_count: 1142
        }
      ]);
    } catch (err) {
      showError(t('admin.yedekler_y_klenirken_hata_olu_tu'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const fetchBackupSettings = async () => {
    try {
      // TODO: Replace with actual API call
      // const response = await api.get('/admin/backup-settings');
      // setAutoBackupEnabled(response.data.enabled);
      // setAutoBackupSchedule(response.data.schedule);
    } catch (err) {
      console.error('Backup settings fetch error:', err);
    }
  };

  const handleCreateBackup = async () => {
    setCreatingBackup(true);
    try {
      info(t('admin.yedek_olu_turuluyor_l_tfen_bekleyin'));
      
      const { createBackup } = await import('../../api/admin');
      const response = await createBackup();
      
      success(t('admin.yedek_ba_ar_yla_olu_turuldu'));
      fetchBackups();
    } catch (err) {
      showError(t('admin.yedek_olu_turulurken_hata_olu_tu'));
      console.error(err);
    } finally {
      setCreatingBackup(false);
    }
  };

  const handleRestore = async () => {
    if (!restoreConfirm) return;

    setLoading(true);
    try {
      info(t('other.geri_yukleme_islemi_baslatildi_lutfen_bekleyin'));
      
      const { restoreBackup } = await import('../../api/admin');
      await restoreBackup(restoreConfirm.id);
      
      // await new Promise(resolve => setTimeout(resolve, 5000));
      success(t('messages.veritaban_ba_ar_yla_geri_y_klendi'));
      setRestoreConfirm(null);
      
      // Redirect or reload after restore
      setTimeout(() => {
        window.location.reload();
      }, 2000);
    } catch (err) {
      showError(t('messages.geri_y_kleme_s_ras_nda_hata_olu_tu'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async () => {
    if (!deleteConfirm) return;

    setLoading(true);
    try {
      const { deleteBackup } = await import('../../api/admin');
      await deleteBackup(deleteConfirm.id);
      
      // await new Promise(resolve => setTimeout(resolve, 500));
      success(t('admin.yedek_ba_ar_yla_silindi'));
      setDeleteConfirm(null);
      fetchBackups();
    } catch (err) {
      showError(t('admin.yedek_silinirken_hata_olu_tu'));
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  const handleDownload = async (backup) => {
    try {
      info(t('admin.yedek_dosyas_indiriliyor'));
      
      const { downloadBackup } = await import('../../api/admin');
      const response = await downloadBackup(backup.id);
      const url = window.URL.createObjectURL(new Blob([response.data]));
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', backup.filename);
      document.body.appendChild(link);
      link.click();
      link.remove();
      
      // await new Promise(resolve => setTimeout(resolve, 1000));
      success(t('admin.yedek_dosyas_indirildi'));
    } catch (err) {
      showError(t('messages.i_ndirme_s_ras_nda_hata_olu_tu'));
      console.error(err);
    }
  };

  const handleAutoBackupToggle = async () => {
    try {
      const newValue = !autoBackupEnabled;
      // TODO: Replace with actual API call
      // await api.put('/admin/backup-settings', {
      //   enabled: newValue,
      //   schedule: autoBackupSchedule
      // });
      
      setAutoBackupEnabled(newValue);
      success(`Otomatik yedekleme ${newValue ? t('other.acildi') : t('other.kapatildi')}`);
    } catch (err) {
      showError(t('admin.ayar_g_ncellenirken_hata_olu_tu'));
      console.error(err);
    }
  };

  const handleScheduleChange = async (schedule) => {
    try {
      // TODO: Replace with actual API call
      // await api.put('/admin/backup-settings', {
      //   enabled: autoBackupEnabled,
      //   schedule: schedule
      // });
      
      setAutoBackupSchedule(schedule);
      success(t('admin.yedekleme_zamanlamas_g_ncellendi'));
    } catch (err) {
      showError(t('admin.ayar_g_ncellenirken_hata_olu_tu'));
      console.error(err);
    }
  };

  const columns = [
    {
      header: t('other.dosya_adi'),
      accessor: 'filename',
      cell: (row) => (
        <div className="flex items-center gap-2">
          {row.status === 'completed' ? (
            <CheckCircleIcon className="h-5 w-5 text-green-500" />
          ) : (
            <ExclamationCircleIcon className="h-5 w-5 text-yellow-500" />
          )}
          <div>
            <div className="font-medium text-gray-900 dark:text-gray-100">{row.filename}</div>
            <div className="text-sm text-gray-500 dark:text-gray-400">{formatFileSize(row.size)}</div>
          </div>
        </div>
      )
    },
    {
      header: t('common.date'),
      accessor: 'created_at',
      cell: (row) => (
        <div className="text-sm">
          <div className="text-gray-900 dark:text-gray-100">
            {formatDate(row.created_at, 'dd/MM/yyyy')}
          </div>
          <div className="text-gray-500 dark:text-gray-400">
            {formatDate(row.created_at, 'HH:mm')}
          </div>
        </div>
      )
    },
    {
      header: t('other.olusturan'),
      accessor: 'created_by',
      cell: (row) => (
        <div>
          <div className="text-sm text-gray-900 dark:text-gray-100">{row.created_by}</div>
          <Badge variant={row.type === 'auto' ? 'secondary' : 'info'} size="sm">
            {row.type === 'auto' ? 'Otomatik' : 'Manuel'}
          </Badge>
        </div>
      )
    },
    {
      header: t('other.kayit_sayisi'),
      accessor: 'records_count',
      cell: (row) => (
        <span className="text-sm font-medium text-gray-900 dark:text-gray-100">
          {row.records_count?.toLocaleString()}
        </span>
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
            onClick={() => handleDownload(row)}
            title={t('common.download')}
          >
            <CloudArrowDownIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setRestoreConfirm(row)}
            title={t('other.geri_yukle')}
          >
            <CloudArrowUpIcon className="h-4 w-4 text-blue-500" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => setDeleteConfirm(row)}
            title={t('common.delete')}
          >
            <TrashIcon className="h-4 w-4 text-red-500" />
          </Button>
        </div>
      )
    }
  ];

  if (loading && !backups.length) {
    return <Loader fullScreen text={t('admin.yedekler_y_kleniyor')} />;
  }

  return (
    <div className="space-y-6">
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">{t('admin.yedekleme_geri_y_kleme')}</h1>
          <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
            {t('admin.manageBackupsDescription')}
          </p>
        </div>
        <Button
          onClick={handleCreateBackup}
          loading={creatingBackup}
          icon={<CloudArrowUpIcon className="h-5 w-5" />}
        >
          {t('admin.createNewBackup')}
        </Button>
      </div>

      {/* Stats & Settings */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalBackups')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">{backups.length}</p>
            </div>
            <CloudArrowUpIcon className="h-10 w-10 text-blue-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.totalSize')}</p>
              <p className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                {formatFileSize(backups.reduce((sum, b) => sum + b.size, 0))}
              </p>
            </div>
            <CloudArrowDownIcon className="h-10 w-10 text-green-500" />
          </div>
        </Card>
        
        <Card>
          <div className="flex items-center justify-between">
            <div>
              <p className="text-sm text-gray-500 dark:text-gray-400">{t('admin.lastBackup')}</p>
              <p className="text-lg font-bold text-gray-900 dark:text-gray-100">
                {backups[0] ? formatDate(backups[0].created_at, 'dd/MM/yyyy HH:mm') : 'Yok'}
              </p>
            </div>
            <ClockIcon className="h-10 w-10 text-purple-500" />
          </div>
        </Card>
      </div>

      {/* Auto Backup Settings */}
      <Card title={t('admin.otomatik_yedekleme_ayarlar')}>
        <div className="space-y-4">
          <div className="flex items-center justify-between">
            <div>
              <h3 className="text-sm font-medium text-gray-900 dark:text-gray-100">{t('admin.autoBackup')}</h3>
              <p className="text-sm text-gray-500 dark:text-gray-400">
                {t('admin.autoBackupScheduleDescription')}
              </p>
            </div>
            <button
              onClick={handleAutoBackupToggle}
              className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors ${
                autoBackupEnabled ? 'bg-blue-600' : 'bg-gray-200 dark:bg-gray-600'
              }`}
            >
              <span
                className={`inline-block h-4 w-4 transform rounded-full bg-white transition-transform ${
                  autoBackupEnabled ? 'translate-x-6' : 'translate-x-1'
                }`}
              />
            </button>
          </div>

          {autoBackupEnabled && (
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-2">
                {t('admin.backupFrequency')}
              </label>
              <div className="flex gap-3">
                {['hourly', 'daily', 'weekly'].map((schedule) => (
                  <button
                    key={schedule}
                    onClick={() => handleScheduleChange(schedule)}
                    className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                      autoBackupSchedule === schedule
                        ? 'bg-blue-600 text-white'
                        : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                    }`}
                  >
                    {schedule === 'hourly' && t('admin.hourly')}
                    {schedule === 'daily' && t('other.gunluk')}
                    {schedule === 'weekly' && t('other.haftalik')}
                  </button>
                ))}
              </div>
            </div>
          )}
        </div>
      </Card>

      {/* Backups Table */}
      <Card title={t('admin.backupsTitle')}>
        {loading ? (
          <Loader text={t('common.loading')} />
        ) : backups.length > 0 ? (
          <Table columns={columns} data={backups} />
        ) : (
          <div className="text-center py-12">
            <CloudArrowUpIcon className="mx-auto h-12 w-12 text-gray-400 dark:text-gray-500" />
            <h3 className="mt-2 text-sm font-medium text-gray-900 dark:text-gray-100">{t('admin.yedek_bulunamad')}</h3>
            <p className="mt-1 text-sm text-gray-500 dark:text-gray-400">
              {t('admin.noBackupsCreatedYet')}
            </p>
          </div>
        )}
      </Card>

      {/* Restore Confirmation Modal */}
      <Modal
        isOpen={!!restoreConfirm}
        onClose={() => setRestoreConfirm(null)}
        title={t('other.veritabanini_geri_yukle')}
      >
        <div className="space-y-4">
          <div className="bg-yellow-50 border border-yellow-200 rounded-lg p-4">
            <div className="flex gap-3">
              <ExclamationCircleIcon className="h-6 w-6 text-yellow-600 flex-shrink-0" />
              <div>
                <h4 className="text-sm font-medium text-yellow-800">{t('messages.uyar')}</h4>
                <p className="text-sm text-yellow-700 mt-1">
                  {t('admin.restoreWarningMessage', { filename: restoreConfirm?.filename })}
                </p>
              </div>
            </div>
          </div>

          {restoreConfirm && (
            <div className="bg-gray-50 dark:bg-gray-700 rounded-lg p-4 space-y-2 text-sm">
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">Dosya:</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">{restoreConfirm.filename}</span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('other.tarih')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {formatDate(restoreConfirm.created_at, 'dd/MM/yyyy HH:mm')}
                </span>
              </div>
              <div className="flex justify-between">
                <span className="text-gray-600 dark:text-gray-400">{t('other.kayit_sayisi')}</span>
                <span className="font-medium text-gray-900 dark:text-gray-100">
                  {restoreConfirm.records_count?.toLocaleString()}
                </span>
              </div>
            </div>
          )}

          <p className="text-sm text-gray-600 dark:text-gray-300">
            Devam etmek istediğinize emin misiniz?
          </p>
        </div>

        <div className="flex justify-end gap-3 mt-6">
          <Button variant="outline" onClick={() => setRestoreConfirm(null)}>
            İptal
          </Button>
          <Button variant="danger" onClick={handleRestore} loading={loading}>
            Geri Yükle
          </Button>
        </div>
      </Modal>

      {/* Delete Confirmation Modal */}
      <Modal
        isOpen={!!deleteConfirm}
        onClose={() => setDeleteConfirm(null)}
        title={t('other.yedegi_sil')}
      >
        <p className="text-gray-600 dark:text-gray-300 mb-6">
          <strong>{deleteConfirm?.filename}</strong> {t('admin.deleteBackupConfirmation')}
          {t('common.cannotBeUndone')}
        </p>
        <div className="flex justify-end gap-3">
          <Button variant="outline" onClick={() => setDeleteConfirm(null)}>
            {t('common.cancel')}
          </Button>
          <Button variant="danger" onClick={handleDelete} loading={loading}>
            {t('common.delete')}
          </Button>
        </div>
      </Modal>
    </div>
  );
}
