<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;

class Vendor extends Model
{
    use HasFactory;

    protected $table = 'vendors';

    protected $fillable = [
        'vendor_name',
        'contact_info'
    ];

    public function items()
    {
        return $this->hasMany(Item::class, 'vendor_id');
    }
}
