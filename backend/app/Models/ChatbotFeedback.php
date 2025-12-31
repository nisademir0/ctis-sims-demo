<?php

namespace App\Models;

use Illuminate\Database\Eloquent\Model;
use Illuminate\Database\Eloquent\Factories\HasFactory;

class ChatbotFeedback extends Model
{
    use HasFactory;

    protected $table = 'chatbot_feedback';

    protected $fillable = [
        'chatbot_query_id',
        'user_id',
        'rating',
        'comment',
    ];

    protected $casts = [
        'created_at' => 'datetime',
        'updated_at' => 'datetime',
    ];

    /**
     * Get the chatbot query that this feedback is for
     */
    public function chatbotQuery()
    {
        return $this->belongsTo(ChatbotQuery::class, 'chatbot_query_id');
    }

    /**
     * Get the user that provided the feedback
     */
    public function user()
    {
        return $this->belongsTo(User::class);
    }

    /**
     * Scope for helpful feedback
     */
    public function scopeHelpful($query)
    {
        return $query->where('rating', 'helpful');
    }

    /**
     * Scope for unhelpful feedback
     */
    public function scopeUnhelpful($query)
    {
        return $query->where('rating', 'not_helpful');
    }

    /**
     * Check if feedback is helpful
     */
    public function isHelpful()
    {
        return $this->rating === 'helpful';
    }

    /**
     * Check if feedback is not helpful
     */
    public function isNotHelpful()
    {
        return $this->rating === 'not_helpful';
    }

    /**
     * Scope for feedback with ratings
     */
    public function scopeWithRating($query, $rating)
    {
        return $query->where('accuracy_rating', $rating);
    }
}
