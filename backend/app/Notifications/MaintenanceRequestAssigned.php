<?php

namespace App\Notifications;

use App\Models\MaintenanceRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent when a maintenance request is assigned to a staff member
 */
class MaintenanceRequestAssigned extends Notification implements ShouldQueue
{
    use Queueable;

    protected $maintenanceRequest;
    protected $assignedBy;

    /**
     * Create a new notification instance.
     */
    public function __construct(MaintenanceRequest $maintenanceRequest, $assignedBy)
    {
        $this->maintenanceRequest = $maintenanceRequest;
        $this->assignedBy = $assignedBy;
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
            ->subject('Bakım Talebi Size Atandı - #' . $this->maintenanceRequest->id)
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line('Size yeni bir bakım talebi atandı.')
            ->line('**Talep Detayları:**')
            ->line('- **Ürün:** ' . $this->maintenanceRequest->item->name)
            ->line('- **Açıklama:** ' . $this->maintenanceRequest->description)
            ->line('- **Öncelik:** ' . $this->getPriorityLabel($this->maintenanceRequest->priority))
            ->line('- **Atayan:** ' . $this->assignedBy->name)
            ->action('Talebi Görüntüle', $url)
            ->line('Lütfen bu talebi en kısa sürede tamamlayınız.')
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
            'type' => 'info',
            'title' => 'Bakım Talebi Atandı',
            'message' => 'Size yeni bir bakım talebi atandı: ' . $this->maintenanceRequest->item->name,
            'action_url' => '/maintenance-requests/' . $this->maintenanceRequest->id,
            'action_text' => 'Görüntüle',
            'maintenance_request_id' => $this->maintenanceRequest->id,
            'item_name' => $this->maintenanceRequest->item->name,
            'priority' => $this->maintenanceRequest->priority,
            'description' => $this->maintenanceRequest->description,
            'assigned_by' => $this->assignedBy->name,
        ];
    }

    /**
     * Get priority label in Turkish
     */
    private function getPriorityLabel(string $priority): string
    {
        return match($priority) {
            'urgent' => 'Acil',
            'high' => 'Yüksek',
            'medium' => 'Orta',
            'low' => 'Düşük',
            default => $priority
        };
    }
}
