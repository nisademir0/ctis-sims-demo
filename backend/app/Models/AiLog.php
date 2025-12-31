<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;

class AiLog extends Model
{
    protected $table = 'activity_logs';

    // Disable automatic timestamp management since we use a custom 'timestamp' column
    public $timestamps = false;

    protected $fillable = [
        'user_id',
        'action_description',
        'timestamp'
    ];

    protected $casts = [
        'timestamp' => 'datetime',
    ];

    /**
     * Get the user who performed the action
     */
    public function user()
    {
        return $this->belongsTo(User::class, 'user_id');
    }

    /**
     * Scope to get recent logs
     */
    public function scopeRecent($query, $limit = 50)
    {
        return $query->orderBy('timestamp', 'desc')->limit($limit);
    }

    /**
     * Scope to get logs for a specific user
     */
    public function scopeForUser($query, $userId)
    {
        return $query->where('user_id', $userId);
    }
}
