<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Relations\BelongsTo;

class CommunityUpdate extends Model
{
    protected $fillable = ['title', 'body', 'status', 'created_by', 'published_at'];

    public function creator(): BelongsTo
    {
        return $this->belongsTo(User::class, 'created_by');
    }

    protected function casts(): array
    {
        return ['published_at' => 'datetime'];
    }
}
