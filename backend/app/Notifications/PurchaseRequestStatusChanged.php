<?php

namespace App\Notifications;

use App\Models\PurchaseRequest;
use Illuminate\Bus\Queueable;
use Illuminate\Contracts\Queue\ShouldQueue;
use Illuminate\Notifications\Messages\MailMessage;
use Illuminate\Notifications\Notification;

/**
 * Notification sent when a purchase request status changes
 * (approved, rejected, ordered, received)
 */
class PurchaseRequestStatusChanged extends Notification implements ShouldQueue
{
    use Queueable;

    protected $purchaseRequest;
    protected $oldStatus;
    protected $newStatus;

    /**
     * Create a new notification instance.
     */
    public function __construct(PurchaseRequest $purchaseRequest, string $oldStatus, string $newStatus)
    {
        $this->purchaseRequest = $purchaseRequest;
        $this->oldStatus = $oldStatus;
        $this->newStatus = $newStatus;
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
        $url = config('app.frontend_url') . '/purchase-requests/' . $this->purchaseRequest->id;
        
        $message = (new MailMessage)
            ->subject($this->getSubject())
            ->greeting('Merhaba ' . $notifiable->name . ',')
            ->line($this->getStatusMessage());

        // Add request details
        $message->line('**Talep Detayları:**')
            ->line('- **Ürün:** ' . $this->purchaseRequest->item_name)
            ->line('- **Miktar:** ' . $this->purchaseRequest->quantity)
            ->line('- **Tahmini Maliyet:** ₺' . number_format($this->purchaseRequest->estimated_cost, 2));

        // Add status-specific information
        if ($this->newStatus === 'approved' && $this->purchaseRequest->approved_cost) {
            $message->line('- **Onaylanan Bütçe:** ₺' . number_format($this->purchaseRequest->approved_cost, 2));
        }

        if ($this->newStatus === 'rejected' && $this->purchaseRequest->rejection_reason) {
            $message->line('- **Red Nedeni:** ' . $this->purchaseRequest->rejection_reason);
        }

        if ($this->newStatus === 'ordered' && $this->purchaseRequest->vendor) {
            $message->line('- **Tedarikçi:** ' . $this->purchaseRequest->vendor);
        }

        if ($this->purchaseRequest->notes) {
            $message->line('- **Not:** ' . $this->purchaseRequest->notes);
        }

        $message->action('Talebi Görüntüle', $url)
            ->salutation('CTIS Envanter Yönetim Sistemi');

        // Set line color based on status
        if ($this->newStatus === 'approved') {
            $message->success();
        } elseif ($this->newStatus === 'rejected') {
            $message->error();
        }

        return $message;
    }

    /**
     * Get the array representation of the notification.
     *
     * @return array<string, mixed>
     */
    public function toArray(object $notifiable): array
    {
        $statusType = match($this->newStatus) {
            'approved' => 'success',
            'rejected' => 'error',
            'ordered' => 'info',
            'received' => 'success',
            default => 'info'
        };

        return [
            'type' => $statusType,
            'title' => $this->getSubject(),
            'message' => $this->getStatusMessage(),
            'action_url' => '/purchase-requests/' . $this->purchaseRequest->id,
            'action_text' => 'Görüntüle',
            'purchase_request_id' => $this->purchaseRequest->id,
            'item_name' => $this->purchaseRequest->item_name,
            'old_status' => $this->oldStatus,
            'new_status' => $this->newStatus,
            'quantity' => $this->purchaseRequest->quantity,
            'estimated_cost' => $this->purchaseRequest->estimated_cost,
        ];
    }

    /**
     * Get email subject based on status
     */
    private function getSubject(): string
    {
        return match($this->newStatus) {
            'approved' => 'Satın Alma Talebiniz Onaylandı - #' . $this->purchaseRequest->id,
            'rejected' => 'Satın Alma Talebiniz Reddedildi - #' . $this->purchaseRequest->id,
            'ordered' => 'Satın Alma Talebiniz Sipariş Edildi - #' . $this->purchaseRequest->id,
            'received' => 'Satın Alma Talebiniz Teslim Alındı - #' . $this->purchaseRequest->id,
            default => 'Satın Alma Talebi Güncellendi - #' . $this->purchaseRequest->id
        };
    }

    /**
     * Get status message for email body
     */
    private function getStatusMessage(): string
    {
        return match($this->newStatus) {
            'approved' => 'Satın alma talebiniz onaylandı ve işlem için hazır.',
            'rejected' => 'Satın alma talebiniz reddedildi.',
            'ordered' => 'Satın alma talebiniz için sipariş verildi.',
            'received' => 'Satın alma talebinizin ürünleri teslim alındı.',
            default => 'Satın alma talebinizin durumu güncellendi.'
        };
    }
}
