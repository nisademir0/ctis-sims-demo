<x-mail::message>
# Item Return Confirmation

Hello **{{ $user->name }}**,

@if($isLate)
This email confirms that your **late return** has been processed. A late fee has been applied.
@else
This email confirms that your item return has been successfully processed. Thank you for returning on time!
@endif

<x-mail::panel>
## Transaction Details

**Item Name:** {{ $item->name }}  
**Item Code:** {{ $item->inventory_number }}

**Checkout Date:** {{ $checkoutDate }}  
**Due Date:** {{ $dueDate }}  
**Return Date:** {{ $returnDate }}

@if($returnCondition)
**Return Condition:** {{ ucfirst($returnCondition) }}
@endif

@if($isLate)
**Days Overdue:** {{ $daysOverdue }} days  
**Late Fee:** ${{ number_format($lateFee, 2) }}
@endif
</x-mail::panel>

@if($isLate)
<x-mail::panel>
### ⚠️ Late Fee Payment Required

You have been charged a late fee of **${{ number_format($lateFee, 2) }}** for returning this item {{ $daysOverdue }} day(s) late.

Please contact the inventory management team to arrange payment.
</x-mail::panel>
@endif

@if($returnCondition === 'damaged')
<x-mail::panel>
### 🔧 Damaged Item Notification

The item was returned in **damaged** condition and has been sent to maintenance for inspection.

Our team may contact you for additional information about the damage.
</x-mail::panel>
@endif

<x-mail::button :url="config('app.frontend_url') . '/transactions'">
View Transaction History
</x-mail::button>

@if(!$isLate)
Thank you for taking good care of our inventory and returning the item on time.
@endif

Best regards,<br>
{{ config('app.name') }} Inventory Team
</x-mail::message>
