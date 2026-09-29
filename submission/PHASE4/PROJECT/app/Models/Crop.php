<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Factories\HasFactory;
use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\HasMany;

class Crop extends Model
{
    use HasFactory;

    protected $fillable = ['name', 'type'];

    public function plantings(): HasMany
    {
        return $this->hasMany(Planting::class);
    }
}
