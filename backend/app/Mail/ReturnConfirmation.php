<?php

namespace App\Mail;

use App\Models\Transaction;
use Illuminate\Bus\Queueable;
use Illuminate\Mail\Mailable;
use Illuminate\Mail\Mailables\Content;
use Illuminate\Mail\Mailables\Envelope;
use Illuminate\Queue\SerializesModels;

class ReturnConfirmation extends Mailable
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
        $isLate = $this->transaction->status === 'late_return';
        $subject = $isLate 
            ? 'Late Return Processed - Late Fee Applied' 
            : 'Item Return Confirmation';
        
        return new Envelope(
            subject: $subject . ' - ' . $this->transaction->item->name,
        );
    }

    /**
     * Get the message content definition.
     */
    public function content(): Content
    {
        $isLate = $this->transaction->status === 'late_return';
        $daysOverdue = $isLate ? $this->transaction->daysOverdue() : 0;
        
        return new Content(
            markdown: 'emails.return-confirmation',
            with: [
                'transaction' => $this->transaction,
                'item' => $this->transaction->item,
                'user' => $this->transaction->user,
                'returnedTo' => $this->transaction->returnedTo,
                'checkoutDate' => $this->transaction->checkout_date->format('F j, Y'),
                'dueDate' => $this->transaction->due_date->format('F j, Y'),
                'returnDate' => $this->transaction->return_date ? $this->transaction->return_date->format('F j, Y') : 'N/A',
                'isLate' => $isLate,
                'daysOverdue' => $daysOverdue,
                'lateFee' => $this->transaction->late_fee,
                'returnCondition' => $this->transaction->return_condition,
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
}
