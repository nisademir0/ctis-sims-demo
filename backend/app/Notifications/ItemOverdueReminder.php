<?php

namespace App\Notifications;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent when a borrowed item is overdue
 */
class ItemOverdueReminder extends Notification implements ShouldQueue
{
    use Queueable;

    protected $transaction;

    /**
     * Create a new notification instance.
     */
    public function __construct(Transaction $transaction)
    {
        $this->transaction = $transaction;
    }

    /**
     * Get the notification's delivery channels.
     *
     * @return array<int, string>
     */
    public function via(object $notifiable): array
    {
        return ['mail', 'database'];
    }

    /**
     * Get the mail representation of the notification.
     */
    public function toMail(object $notifiable): MailMessage
    {
        $url = config('app.frontend_url') . '/transactions/' . $this->transaction->id;
        $daysOverdue = now()->diffInDays($this->transaction->return_date);

        return (new MailMessage)
            ->subject('Ödünç Alınan Ürün Gecikti - ' . $this->transaction->item->name)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line('Ödünç aldığınız ürünün iade tarihi geçmiştir.')
            ->line('**Ürün Detayları:**')
            ->line('- **Ürün:** ' . $this->transaction->item->name)
            ->line('- **Alınma Tarihi:** ' . $this->transaction->checkout_date->format('d.m.Y'))
            ->line('- **Beklenen İade Tarihi:** ' . $this->transaction->return_date->format('d.m.Y'))
            ->line('- **Gecikme Süresi:** ' . $daysOverdue . ' gün')
            ->line('Lütfen ürünü en kısa sürede iade ediniz.')
            ->action('İşlemi Görüntüle', $url)
            ->error()
            ->salutation('CTIS Envanter Yönetim Sistemi');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $daysOverdue = now()->diffInDays($this->transaction->return_date);
        
        return [
            'type' => 'error',
            'title' => 'Ödünç Alınan Ürün Gecikti',
            'message' => $this->transaction->item->name . ' - ' . $daysOverdue . ' gün gecikme',
            'action_url' => '/my-loans',
            'action_text' => 'İşlemleri Gör',
            'transaction_id' => $this->transaction->id,
            'item_name' => $this->transaction->item->name,
            'return_date' => $this->transaction->return_date,
            'days_overdue' => $daysOverdue,
        ];
    }
}
