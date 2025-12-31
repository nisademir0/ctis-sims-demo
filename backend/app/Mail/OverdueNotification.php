<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class OverdueNotification extends Mailable
{
    use Queueable, SerializesModels;

    /**
     * Create a new message instance.
     */
    public function __construct(
        public Transaction $transaction
    ) {
        //
    }

    /**
     * Get the message envelope.
     */
    public function envelope(): Envelope
    {
        return new Envelope(
            subject: '⚠️ OVERDUE: Please Return Item - ' . $this->transaction->item->name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $daysOverdue = $this->transaction->daysOverdue();
        $lateFee = $this->transaction->calculateLateFee();
        
        return new Content(
            markdown: 'emails.overdue-notification',
            with: [
                'transaction' => $this->transaction,
                'item' => $this->transaction->item,
                'user' => $this->transaction->user,
                'checkoutDate' => $this->transaction->checkout_date->format('F j, Y'),
                'dueDate' => $this->transaction->due_date->format('F j, Y'),
                'daysOverdue' => $daysOverdue,
                'lateFee' => $lateFee,
                'severity' => $this->getSeverity($daysOverdue),
            ],
        );
    }

    /**
     * Get the attachments for the message.
     *
     * @return array<int, \Illuminate\Mail\Mailables\Attachment>
     */
    public function attachments(): array
    {
        return [];
    }

    /**
     * Determine severity level based on days overdue
     */
    private function getSeverity(int $daysOverdue): string
    {
        if ($daysOverdue >= 14) {
            return 'critical';
        } elseif ($daysOverdue >= 7) {
            return 'high';
        } else {
            return 'medium';
        }
    }
}
