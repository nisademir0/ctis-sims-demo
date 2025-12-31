<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use App\Models\Translation;

class QuickTranslationSeeder extends Seeder
{
    /**
     * Run the database seeds - Quick manual seed for most important translations
     */
    public function run(): void
    {
        $this->command->info('Seeding Turkish translations...');
        $this->seedTurkishTranslations();
        
        $this->command->info('Seeding English translations...');
        $this->seedEnglishTranslations();
        
        $this->command->info('Translations seeded successfully!');
    }

    private function seedTurkishTranslations(): void
    {
        $translations = [
            // Common
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'loading', 'value' => 'Yükleniyor...'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'save', 'value' => 'Kaydet'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'cancel', 'value' => 'İptal'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'delete', 'value' => 'Sil'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'edit', 'value' => 'Düzenle'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'back', 'value' => 'Geri'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'filter', 'value' => 'Filtrele'],
            ['locale' => 'tr', 'namespace' => 'common', 'key' => 'export', 'value' => 'Dışa Aktar'],
            
            // Inventory
            ['locale' => 'tr', 'namespace' => 'inventory', 'key' => 'title', 'value' => 'Envanter Yönetimi'],
            ['locale' => 'tr', 'namespace' => 'inventory', 'key' => 'addItem', 'value' => 'Yeni Eşya Ekle'],
            ['locale' => 'tr', 'namespace' => 'inventory', 'key' => 'itemName', 'value' => 'Eşya Adı'],
            ['locale' => 'tr', 'namespace' => 'inventory', 'key' => 'status', 'value' => 'Durum'],
            ['locale' => 'tr', 'namespace' => 'inventory', 'key' => 'location', 'value' => 'Konum'],
            
            // Dashboard
            ['locale' => 'tr', 'namespace' => 'dashboard', 'key' => 'totalItems', 'value' => 'Toplam Ürün'],
            ['locale' => 'tr', 'namespace' => 'dashboard', 'key' => 'availableItems', 'value' => 'Müsait Ürün'],
            
            // Navigation
            ['locale' => 'tr', 'namespace' => 'nav', 'key' => 'dashboard', 'value' => 'Dashboard'],
            ['locale' => 'tr', 'namespace' => 'nav', 'key' => 'inventory', 'value' => 'Envanter'],
            ['locale' => 'tr', 'namespace' => 'nav', 'key' => 'transactions', 'value' => 'Hareketler'],
            ['locale' => 'tr', 'namespace' => 'nav', 'key' => 'settings', 'value' => 'Ayarlar'],
            ['locale' => 'tr', 'namespace' => 'nav', 'key' => 'logout', 'value' => 'Çıkış'],
        ];

        foreach ($translations as $translation) {
            Translation::updateOrCreate(
                [
                    'locale' => $translation['locale'],
                    'namespace' => $translation['namespace'],
                    'key' => $translation['key']
                ],
                [
                    'value' => $translation['value']
                ]
            );
        }
    }

    private function seedEnglishTranslations(): void
    {
        $translations = [
            // Common
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'loading', 'value' => 'Loading...'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'save', 'value' => 'Save'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'cancel', 'value' => 'Cancel'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'delete', 'value' => 'Delete'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'edit', 'value' => 'Edit'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'back', 'value' => 'Back'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'filter', 'value' => 'Filter'],
            ['locale' => 'en', 'namespace' => 'common', 'key' => 'export', 'value' => 'Export'],
            
            // Inventory
            ['locale' => 'en', 'namespace' => 'inventory', 'key' => 'title', 'value' => 'Inventory Management'],
            ['locale' => 'en', 'namespace' => 'inventory', 'key' => 'addItem', 'value' => 'Add New Item'],
            ['locale' => 'en', 'namespace' => 'inventory', 'key' => 'itemName', 'value' => 'Item Name'],
            ['locale' => 'en', 'namespace' => 'inventory', 'key' => 'status', 'value' => 'Status'],
            ['locale' => 'en', 'namespace' => 'inventory', 'key' => 'location', 'value' => 'Location'],
            
            // Dashboard
            ['locale' => 'en', 'namespace' => 'dashboard', 'key' => 'totalItems', 'value' => 'Total Items'],
            ['locale' => 'en', 'namespace' => 'dashboard', 'key' => 'availableItems', 'value' => 'Available Items'],
            
            // Navigation
            ['locale' => 'en', 'namespace' => 'nav', 'key' => 'dashboard', 'value' => 'Dashboard'],
            ['locale' => 'en', 'namespace' => 'nav', 'key' => 'inventory', 'value' => 'Inventory'],
            ['locale' => 'en', 'namespace' => 'nav', 'key' => 'transactions', 'value' => 'Transactions'],
            ['locale' => 'en', 'namespace' => 'nav', 'key' => 'settings', 'value' => 'Settings'],
            ['locale' => 'en', 'namespace' => 'nav', 'key' => 'logout', 'value' => 'Logout'],
        ];

        foreach ($translations as $translation) {
            Translation::updateOrCreate(
                [
                    'locale' => $translation['locale'],
                    'namespace' => $translation['namespace'],
                    'key' => $translation['key']
                ],
                [
                    'value' => $translation['value']
                ]
            );
        }
    }
}
