<?php

namespace Database\Seeders;

use Illuminate\Database\Seeder;

class DatabaseSeeder extends Seeder
{
    /**
     * Seed the application's database for DEMO version.
     */
    public function run(): void
    {
        $this->call([
            DemoSeeder::class,
        ]);
    }
}
