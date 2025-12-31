<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;
use Illuminate\Support\Facades\DB;

class CategorySchemaSeeder extends Seeder
{
    /**
     * Seed category schemas for different item types
     */
    public function run(): void
    {
        $categorySchemas = [
            'Bilgisayar' => [
                'description' => 'Masaüstü ve dizüstü bilgisayarlar',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'cpu',
                            'type' => 'string',
                            'label' => 'İşlemci',
                            'required' => true,
                            'placeholder' => 'Örn: Intel Core i7-12700'
                        ],
                        [
                            'name' => 'ram',
                            'type' => 'string',
                            'label' => 'RAM',
                            'required' => true,
                            'placeholder' => 'Örn: 16GB DDR4'
                        ],
                        [
                            'name' => 'storage',
                            'type' => 'string',
                            'label' => 'Depolama',
                            'required' => true,
                            'placeholder' => 'Örn: 512GB SSD'
                        ],
                        [
                            'name' => 'gpu',
                            'type' => 'string',
                            'label' => 'Ekran Kartı',
                            'required' => false,
                            'placeholder' => 'Örn: NVIDIA GTX 1650'
                        ],
                        [
                            'name' => 'screen_size',
                            'type' => 'string',
                            'label' => 'Ekran Boyutu',
                            'required' => false,
                            'placeholder' => 'Örn: 15.6 inç'
                        ],
                        [
                            'name' => 'os',
                            'type' => 'string',
                            'label' => 'İşletim Sistemi',
                            'required' => false,
                            'placeholder' => 'Örn: Windows 11 Pro'
                        ]
                    ]
                ]
            ],
            'Monitör' => [
                'description' => 'Ekran monitörleri',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'screen_size',
                            'type' => 'string',
                            'label' => 'Ekran Boyutu',
                            'required' => true,
                            'placeholder' => 'Örn: 27 inç'
                        ],
                        [
                            'name' => 'resolution',
                            'type' => 'string',
                            'label' => 'Çözünürlük',
                            'required' => true,
                            'placeholder' => 'Örn: 1920x1080 (Full HD)'
                        ],
                        [
                            'name' => 'refresh_rate',
                            'type' => 'string',
                            'label' => 'Yenileme Hızı',
                            'required' => false,
                            'placeholder' => 'Örn: 144Hz'
                        ],
                        [
                            'name' => 'panel_type',
                            'type' => 'string',
                            'label' => 'Panel Tipi',
                            'required' => false,
                            'placeholder' => 'Örn: IPS'
                        ],
                        [
                            'name' => 'inputs',
                            'type' => 'string',
                            'label' => 'Bağlantı Türleri',
                            'required' => false,
                            'placeholder' => 'Örn: HDMI, DisplayPort, USB-C'
                        ]
                    ]
                ]
            ],
            'Yazıcı' => [
                'description' => 'Yazıcı ve çok fonksiyonlu cihazlar',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'type',
                            'type' => 'string',
                            'label' => 'Yazıcı Tipi',
                            'required' => true,
                            'placeholder' => 'Örn: Lazer, İnkjet'
                        ],
                        [
                            'name' => 'color',
                            'type' => 'string',
                            'label' => 'Renkli/Siyah-Beyaz',
                            'required' => true,
                            'placeholder' => 'Örn: Renkli'
                        ],
                        [
                            'name' => 'print_speed',
                            'type' => 'string',
                            'label' => 'Yazdırma Hızı',
                            'required' => false,
                            'placeholder' => 'Örn: 30 sayfa/dakika'
                        ],
                        [
                            'name' => 'functions',
                            'type' => 'string',
                            'label' => 'Fonksiyonlar',
                            'required' => false,
                            'placeholder' => 'Örn: Yazdırma, Tarama, Fotokopi'
                        ],
                        [
                            'name' => 'network',
                            'type' => 'string',
                            'label' => 'Ağ Bağlantısı',
                            'required' => false,
                            'placeholder' => 'Örn: Wi-Fi, Ethernet'
                        ]
                    ]
                ]
            ],
            'Projeksiyon' => [
                'description' => 'Projektörler ve sunum cihazları',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'brightness',
                            'type' => 'string',
                            'label' => 'Parlaklık',
                            'required' => true,
                            'placeholder' => 'Örn: 3500 ANSI Lümen'
                        ],
                        [
                            'name' => 'resolution',
                            'type' => 'string',
                            'label' => 'Çözünürlük',
                            'required' => true,
                            'placeholder' => 'Örn: 1920x1080 (Full HD)'
                        ],
                        [
                            'name' => 'technology',
                            'type' => 'string',
                            'label' => 'Teknoloji',
                            'required' => false,
                            'placeholder' => 'Örn: DLP, LCD'
                        ],
                        [
                            'name' => 'throw_distance',
                            'type' => 'string',
                            'label' => 'Projeksiyon Mesafesi',
                            'required' => false,
                            'placeholder' => 'Örn: 1.5-12m'
                        ]
                    ]
                ]
            ],
            'Tablet' => [
                'description' => 'Tablet cihazları',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'screen_size',
                            'type' => 'string',
                            'label' => 'Ekran Boyutu',
                            'required' => true,
                            'placeholder' => 'Örn: 10.2 inç'
                        ],
                        [
                            'name' => 'storage',
                            'type' => 'string',
                            'label' => 'Depolama',
                            'required' => true,
                            'placeholder' => 'Örn: 128GB'
                        ],
                        [
                            'name' => 'ram',
                            'type' => 'string',
                            'label' => 'RAM',
                            'required' => false,
                            'placeholder' => 'Örn: 4GB'
                        ],
                        [
                            'name' => 'os',
                            'type' => 'string',
                            'label' => 'İşletim Sistemi',
                            'required' => false,
                            'placeholder' => 'Örn: iPadOS 16'
                        ],
                        [
                            'name' => 'cellular',
                            'type' => 'string',
                            'label' => 'Hücresel Bağlantı',
                            'required' => false,
                            'placeholder' => 'Örn: Wi-Fi + Cellular'
                        ]
                    ]
                ]
            ],
            'Mobilya' => [
                'description' => 'Ofis mobilyaları',
                'schema_definition' => [
                    'fields' => [
                        [
                            'name' => 'material',
                            'type' => 'string',
                            'label' => 'Malzeme',
                            'required' => true,
                            'placeholder' => 'Örn: Metal, Ahşap'
                        ],
                        [
                            'name' => 'dimensions',
                            'type' => 'string',
                            'label' => 'Boyutlar',
                            'required' => false,
                            'placeholder' => 'Örn: 120x60x75 cm'
                        ],
                        [
                            'name' => 'color',
                            'type' => 'string',
                            'label' => 'Renk',
                            'required' => false,
                            'placeholder' => 'Örn: Beyaz'
                        ],
                        [
                            'name' => 'capacity',
                            'type' => 'string',
                            'label' => 'Kapasite',
                            'required' => false,
                            'placeholder' => 'Örn: 2 kişilik'
                        ]
                    ]
                ]
            ]
        ];

        foreach ($categorySchemas as $categoryName => $data) {
            DB::table('item_categories')
                ->where('category_name', $categoryName)
                ->update([
                    'description' => $data['description'],
                    'schema_definition' => json_encode($data['schema_definition']),
                    'updated_at' => now()
                ]);
        }
    }
}
