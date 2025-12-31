import { useState, useEffect } from 'react';
import { useTranslation } from 'react-i18next';
import { PlusIcon, PencilIcon, TrashIcon, CubeIcon } from '@heroicons/react/24/outline';
import toast from 'react-hot-toast';
import Card from '../../components/common/Card';
import Button from '../../components/common/Button';
import Table from '../../components/common/Table';
import Modal from '../../components/common/Modal';
import Loader from '../../components/common/Loader';
import { getCategories, createCategory, updateCategory, deleteCategory } from '../../api/categories';

export default function CategoryManagement() {
  const { t } = useTranslation();
  const [categories, setCategories] = useState([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCategory, setEditingCategory] = useState(null);
  const [formData, setFormData] = useState({
    category_name: '',
    description: '',
    schema_definition: '',
  });
  const [schemaFields, setSchemaFields] = useState([]);

  useEffect(() => {
    fetchCategories();
  }, []);

  const fetchCategories = async () => {
    try {
      setLoading(true);
      const response = await getCategories();
      setCategories(response.data || []);
    } catch (error) {
      toast.error(t('messages.error.load'));
      console.error('Failed to load categories:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleOpenModal = (category = null) => {
    if (category) {
      setEditingCategory(category);
      setFormData({
        category_name: category.category_name,
        description: category.description || '',
        schema_definition: category.schema_definition || '',
      });
      
      // Parse existing schema
      if (category.schema_definition) {
        try {
          const schema = JSON.parse(category.schema_definition);
          setSchemaFields(schema.fields || []);
        } catch (e) {
          setSchemaFields([]);
        }
      } else {
        setSchemaFields([]);
      }
    } else {
      setEditingCategory(null);
      setFormData({
        category_name: '',
        description: '',
        schema_definition: '',
      });
      setSchemaFields([]);
    }
    setShowModal(true);
  };

  const handleCloseModal = () => {
    setShowModal(false);
    setEditingCategory(null);
    setFormData({
      category_name: '',
      description: '',
      schema_definition: '',
    });
    setSchemaFields([]);
  };

  const addSchemaField = () => {
    setSchemaFields([...schemaFields, {
      name: '',
      label: '',
      type: 'text',
      required: false,
      options: []
    }]);
  };

  const updateSchemaField = (index, field, value) => {
    const updated = [...schemaFields];
    updated[index] = { ...updated[index], [field]: value };
    setSchemaFields(updated);
  };

  const removeSchemaField = (index) => {
    setSchemaFields(schemaFields.filter((_, i) => i !== index));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();

    if (!formData.category_name.trim()) {
      toast.error('Kategori adı zorunludur');
      return;
    }

    try {
      // Build schema JSON
      let schemaJson = '';
      if (schemaFields.length > 0) {
        const schema = {
          fields: schemaFields.map(field => ({
            name: field.name,
            label: field.label,
            type: field.type,
            required: field.required,
            ...(field.options && field.options.length > 0 ? { options: field.options } : {})
          }))
        };
        schemaJson = JSON.stringify(schema);
      }

      const payload = {
        category_name: formData.category_name.trim(),
        description: formData.description.trim(),
        schema_definition: schemaJson || null,
      };

      if (editingCategory) {
        await updateCategory(editingCategory.id, payload);
        toast.success('Kategori başarıyla güncellendi');
      } else {
        await createCategory(payload);
        toast.success('Kategori başarıyla oluşturuldu');
      }

      handleCloseModal();
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || t('messages.error.failed');
      toast.error(errorMessage);
      console.error('Failed to save category:', error);
    }
  };

  const handleDelete = async (category) => {
    if (!window.confirm(`"${category.category_name}" kategorisini silmek istediğinizden emin misiniz?`)) {
      return;
    }

    try {
      await deleteCategory(category.id);
      toast.success('Kategori başarıyla silindi');
      fetchCategories();
    } catch (error) {
      const errorMessage = error.response?.data?.message || error.message || 'Kategori silinemedi';
      toast.error(errorMessage);
      console.error('Failed to delete category:', error);
    }
  };

  const columns = [
    {
      key: 'category_name',
      label: 'Kategori Adı',
      render: (value) => (
        <div className="flex items-center gap-2">
          <CubeIcon className="h-5 w-5 text-blue-500 dark:text-blue-400" />
          <span className="font-medium text-gray-900 dark:text-white">{value}</span>
        </div>
      )
    },
    {
      key: 'description',
      label: 'Açıklama',
      render: (value) => (
        <span className="text-gray-600 dark:text-gray-400">{value || '-'}</span>
      )
    },
    {
      key: 'schema_definition',
      label: 'Şema Alanları',
      render: (value) => {
        if (!value) return <span className="text-gray-400 dark:text-gray-500">Yok</span>;
        try {
          const schema = JSON.parse(value);
          const fieldCount = schema.fields?.length || 0;
          return (
            <span className="text-sm text-gray-600 dark:text-gray-400">
              {fieldCount} alan
            </span>
          );
        } catch (e) {
          return <span className="text-gray-400 dark:text-gray-500">-</span>;
        }
      }
    },
    {
      key: 'items_count',
      label: 'Ürün Sayısı',
      render: (value) => (
        <span className="text-gray-900 dark:text-white font-medium">{value || 0}</span>
      )
    },
    {
      key: 'actions',
      label: 'İşlemler',
      render: (_, category) => (
        <div className="flex gap-2">
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleOpenModal(category)}
          >
            <PencilIcon className="h-4 w-4" />
          </Button>
          <Button
            variant="ghost"
            size="sm"
            onClick={() => handleDelete(category)}
            disabled={category.items_count > 0}
          >
            <TrashIcon className="h-4 w-4" />
          </Button>
        </div>
      )
    },
  ];

  if (loading) {
    return <Loader fullScreen text="Kategoriler yükleniyor..." />;
  }

  return (
    <div className="space-y-6">
      <div className="flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
            Kategori Yönetimi
          </h1>
          <p className="text-gray-600 dark:text-gray-400 mt-1">
            Ürün kategorilerini ve özel alanlarını yönetin
          </p>
        </div>
        <Button
          variant="primary"
          onClick={() => handleOpenModal()}
        >
          <PlusIcon className="h-5 w-5 mr-2" />
          Yeni Kategori
        </Button>
      </div>

      <Card>
        <Table
          columns={columns}
          data={categories}
          emptyMessage="Henüz kategori eklenmemiş"
        />
      </Card>

      <Modal
        isOpen={showModal}
        onClose={handleCloseModal}
        title={editingCategory ? 'Kategori Düzenle' : 'Yeni Kategori'}
        size="lg"
      >
        <form onSubmit={handleSubmit} className="space-y-6">
          <div className="space-y-4">
            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Kategori Adı *
              </label>
              <input
                type="text"
                value={formData.category_name}
                onChange={(e) => setFormData({ ...formData, category_name: e.target.value })}
                placeholder="Örn: Laptop, Monitor, Yazıcı"
                required
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                Açıklama
              </label>
              <textarea
                value={formData.description}
                onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                placeholder="Kategori açıklaması (opsiyonel)"
                rows={2}
                className="w-full px-3 py-2 border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white focus:ring-2 focus:ring-blue-500 dark:focus:ring-blue-400"
              />
            </div>

            <div className="border-t dark:border-gray-700 pt-4">
              <div className="flex items-center justify-between mb-3">
                <label className="block text-sm font-medium text-gray-700 dark:text-gray-300">
                  Özel Alanlar (Opsiyonel)
                </label>
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={addSchemaField}
                >
                  <PlusIcon className="h-4 w-4 mr-1" />
                  Alan Ekle
                </Button>
              </div>

              {schemaFields.length === 0 ? (
                <p className="text-sm text-gray-500 dark:text-gray-400 italic">
                  Bu kategoriye özel form alanları eklemek için "Alan Ekle" butonuna tıklayın
                </p>
              ) : (
                <div className="space-y-4 max-h-96 overflow-y-auto">
                  {schemaFields.map((field, index) => (
                    <div key={index} className="p-4 border dark:border-gray-700 rounded-lg bg-gray-50 dark:bg-gray-800">
                      <div className="grid grid-cols-2 gap-3">
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Alan Adı (Key)
                          </label>
                          <input
                            type="text"
                            value={field.name}
                            onChange={(e) => updateSchemaField(index, 'name', e.target.value)}
                            placeholder="processor_speed"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Alan Etiketi
                          </label>
                          <input
                            type="text"
                            value={field.label}
                            onChange={(e) => updateSchemaField(index, 'label', e.target.value)}
                            placeholder="İşlemci Hızı"
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          />
                        </div>
                        <div>
                          <label className="block text-sm font-medium text-gray-700 dark:text-gray-300 mb-1">
                            Tip
                          </label>
                          <select
                            value={field.type}
                            onChange={(e) => updateSchemaField(index, 'type', e.target.value)}
                            className="w-full px-3 py-2 text-sm border border-gray-300 dark:border-gray-600 rounded-md bg-white dark:bg-gray-700 text-gray-900 dark:text-white"
                          >
                            <option value="text">Metin</option>
                            <option value="number">Sayı</option>
                            <option value="select">Seçim</option>
                            <option value="textarea">Çok Satırlı Metin</option>
                            <option value="date">Tarih</option>
                          </select>
                        </div>
                        <div className="flex items-center">
                          <label className="flex items-center gap-2 cursor-pointer mt-6">
                            <input
                              type="checkbox"
                              checked={field.required}
                              onChange={(e) => updateSchemaField(index, 'required', e.target.checked)}
                              className="rounded border-gray-300 dark:border-gray-600"
                            />
                            <span className="text-sm text-gray-700 dark:text-gray-300">
                              Zorunlu
                            </span>
                          </label>
                        </div>
                      </div>
                      <div className="flex justify-end mt-2">
                        <Button
                          type="button"
                          variant="ghost"
                          size="sm"
                          onClick={() => removeSchemaField(index)}
                        >
                          <TrashIcon className="h-4 w-4 mr-1" />
                          Kaldır
                        </Button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>

          <div className="flex justify-end gap-3 border-t dark:border-gray-700 pt-4">
            <Button
              type="button"
              variant="outline"
              onClick={handleCloseModal}
            >
              İptal
            </Button>
            <Button type="submit" variant="primary">
              {editingCategory ? 'Güncelle' : 'Oluştur'}
            </Button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
