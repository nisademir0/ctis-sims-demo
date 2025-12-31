<?php

namespace App\Services;

use App\Models\User;
use App\Notifications\SystemNotification;

class NotificationService
{
    /**
     * Send notification using Laravel Notification system
     */
    public function sendNotification(
        User|int $user,
        string $type,
        string $title,
        string $message,
        ?string $actionUrl = null,
        ?string $actionText = null
    ): void {
        $userModel = $user instanceof User ? $user : User::find($user);
        
        if ($userModel) {
            $userModel->notify(new SystemNotification($type, $title, $message, $actionUrl, $actionText));
        }
    }

    /**
     * Send notification for transaction checkout
     */
    public function notifyCheckout($transaction)
    {
        $this->sendNotification(
            $transaction->user_id,
            'success',
            'Ödünç Alma Başarılı',
            "{$transaction->item->name} başarıyla ödünç alındı. İade tarihi: " . 
            $transaction->due_date->format('d.m.Y'),
            "/transactions/{$transaction->id}",
            'İşlemi Görüntüle'
        );
    }

    /**
     * Send notification for transaction return
     */
    public function notifyReturn($transaction)
    {
        $message = $transaction->late_fee > 0
            ? "Ürün iade edildi. Gecikme ücreti: " . number_format($transaction->late_fee, 2) . " TL"
            : "Ürün başarıyla iade edildi. Teşekkür ederiz!";

        $this->sendNotification(
            $transaction->user_id,
            $transaction->late_fee > 0 ? 'warning' : 'success',
            'Ürün İade Edildi',
            $message,
            "/transactions/{$transaction->id}",
            'İşlemi Görüntüle'
        );
    }

    /**
     * Send notification for overdue transaction
     */
    public function notifyOverdue($transaction)
    {
        $daysOverdue = $transaction->daysOverdue();
        
        $this->sendNotification(
            $transaction->user_id,
            'error',
            'Gecikmiş Ürün',
            "'{$transaction->item->name}' ürünü {$daysOverdue} gün gecikmiş. Gecikme ücreti: " . 
            number_format($transaction->calculateLateFee(), 2) . " TL",
            "/transactions/{$transaction->id}",
            'Hemen İade Et'
        );
    }

    /**
     * Send notification for due soon transaction
     */
    public function notifyDueSoon($transaction)
    {
        $this->sendNotification(
            $transaction->user_id,
            'warning',
            'İade Tarihi Hatırlatması',
            "'{$transaction->item->name}' ürününün iade tarihi yarın. Lütfen zamanında iade edin.",
            "/transactions/{$transaction->id}",
            'İade Yap'
        );
    }

    /**
     * Send notification for new maintenance request
     */
    public function notifyMaintenanceRequest($maintenanceRequest)
    {
        $this->sendNotification(
            $maintenanceRequest->requested_by,
            'info',
            'Bakım Talebi Oluşturuldu',
            "'{$maintenanceRequest->item->name}' için bakım talebi oluşturuldu.",
            "/maintenance/{$maintenanceRequest->id}",
            'Talebi Görüntüle'
        );
    }

    /**
     * Send notification for maintenance request status update
     */
    public function notifyMaintenanceStatusUpdate($maintenanceRequest)
    {
        $statusMap = [
            'pending' => 'Beklemede',
            'in_progress' => 'İşlemde',
            'completed' => 'Tamamlandı',
            'cancelled' => 'İptal Edildi',
        ];

        $status = $statusMap[$maintenanceRequest->status] ?? $maintenanceRequest->status;

        $this->sendNotification(
            $maintenanceRequest->requested_by,
            'info',
            'Bakım Durumu Güncellendi',
            "'{$maintenanceRequest->item->name}' için bakım talebi durumu: {$status}",
            "/maintenance/{$maintenanceRequest->id}",
            'Detayları Gör'
        );
    }

    /**
     * Send notification for purchase request status update
     */
    public function notifyPurchaseRequestStatusUpdate($purchaseRequest)
    {
        $statusMap = [
            'pending' => 'Beklemede',
            'approved' => 'Onaylandı',
            'rejected' => 'Reddedildi',
            'ordered' => 'Sipariş Edildi',
            'received' => 'Teslim Alındı',
            'cancelled' => 'İptal Edildi',
        ];

        $status = $statusMap[$purchaseRequest->status] ?? $purchaseRequest->status;

        $this->sendNotification(
            $purchaseRequest->requested_by,
            $purchaseRequest->status === 'approved' ? 'success' : 'info',
            'Satın Alma Talebi Güncellendi',
            "Satın alma talebi durumu: {$status}",
            "/purchase-requests/{$purchaseRequest->id}",
            'Detayları Gör'
        );
    }
}
