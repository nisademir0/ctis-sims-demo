<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent when a maintenance request is completed
 */
class MaintenanceRequestCompleted extends Notification implements ShouldQueue
{
    use Queueable;

    protected $maintenanceRequest;

    /**
     * Create a new notification instance.
     */
    public function __construct(MaintenanceRequest $maintenanceRequest)
    {
        $this->maintenanceRequest = $maintenanceRequest;
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
        $url = config('app.frontend_url') . '/maintenance-requests/' . $this->maintenanceRequest->id;

        return (new MailMessage)
            ->subject('Bakım Talebi Tamamlandı - #' . $this->maintenanceRequest->id)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line('Bakım talebi başarıyla tamamlandı.')
            ->line('**Talep Detayları:**')
            ->line('- **Ürün:** ' . $this->maintenanceRequest->item->name)
            ->line('- **Açıklama:** ' . $this->maintenanceRequest->description)
            ->line('- **Tamamlayan:** ' . ($this->maintenanceRequest->assignee ? $this->maintenanceRequest->assignee->name : 'Bilinmiyor'))
            ->line('- **Tamamlanma Tarihi:** ' . ($this->maintenanceRequest->completed_date ? $this->maintenanceRequest->completed_date->format('d.m.Y') : now()->format('d.m.Y')))
            ->action('Talebi Görüntüle', $url)
            ->success()
            ->salutation('CTIS Envanter Yönetim Sistemi');
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        return [
            'type' => 'success',
            'title' => 'Bakım Talebi Tamamlandı',
            'message' => 'Bakım talebi başarıyla tamamlandı: ' . $this->maintenanceRequest->item->name,
            'action_url' => '/maintenance-requests/' . $this->maintenanceRequest->id,
            'action_text' => 'Görüntüle',
            'maintenance_request_id' => $this->maintenanceRequest->id,
            'item_name' => $this->maintenanceRequest->item->name,
            'completed_by' => $this->maintenanceRequest->assignee ? $this->maintenanceRequest->assignee->name : null,
            'completed_date' => $this->maintenanceRequest->completed_date,
        ];
    }
}
