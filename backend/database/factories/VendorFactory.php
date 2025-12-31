<?php

namespace Database\Factories;

use App\Models\Vendor;
use Illuminate\Database\Eloquent\Factories\Factory;

/**
 * @extends \Illuminate\Database\Eloquent\Factories\Factory<\App\Models\Vendor>
 */
class VendorFactory extends Factory
{
    protected $model = Vendor::class;

    /**
     * Define the model's default state.
     *
     * @return array<string, mixed>
     */
    public function definition(): array
    {
        $vendorNames = [
            'Dell Türkiye',
            'HP Teknoloji',
            'Lenovo A.Ş.',
            'Apple Store',
            'Samsung Electronics',
            'Logitech Türkiye',
            'Microsoft Store',
            'Canon Türkiye',
            'Epson Teknoloji',
            'TP-Link Türkiye',
            'Cisco Systems',
            'Asus Bilgisayar',
            'Acer Türkiye',
            'LG Electronics',
            'Brother Türkiye',
        ];

        $companyName = fake()->randomElement($vendorNames);
        
        return [
            'vendor_name' => $companyName,
            'contact_info' => json_encode([
                'phone' => fake()->phoneNumber(),
                'email' => strtolower(str_replace(' ', '', $companyName)) . '@vendor.com',
                'address' => fake()->address(),
                'contact_person' => fake()->name(),
            ]),
        ];
    }
}
