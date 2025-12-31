<x-mail::message>
# ⚠️ OVERDUE ITEM - Action Required

Hello **{{ $user->name }}**,

This is an **urgent reminder** that you have an overdue item that must be returned immediately.

<x-mail::panel>
## Overdue Item Details

**Item Name:** {{ $item->name }}  
**Item Code:** {{ $item->inventory_number }}

**Checkout Date:** {{ $checkoutDate }}  
**Due Date:** {{ $dueDate }}  
**Days Overdue:** **{{ $daysOverdue }} days**

### Current Late Fee: **${{ number_format($lateFee, 2) }}**

@if($severity === 'critical')
**Severity Level:** 🔴 **CRITICAL** (14+ days overdue)
@elseif($severity === 'high')
**Severity Level:** 🟠 **HIGH** (7-13 days overdue)
@else
**Severity Level:** 🟡 **MEDIUM** (1-6 days overdue)
@endif
</x-mail::panel>

### Immediate Action Required

1. **Return the item as soon as possible** to avoid additional late fees
2. Late fees accumulate at **$1.00 per day**
3. Your current late fee balance is **${{ number_format($lateFee, 2) }}**

@if($severity === 'critical')
<x-mail::panel>
### ⚠️ Critical Status Warning

This item has been overdue for **{{ $daysOverdue }} days**. 

- Your account may be restricted from future checkouts
- Unpaid late fees will prevent new item requests
- Please contact us immediately to resolve this matter
</x-mail::panel>
@endif

<x-mail::button :url="config('app.frontend_url') . '/transactions'">
View My Overdue Items
</x-mail::button>

### Need Help?

If you're unable to return the item or need an extension, please contact the inventory management team immediately.

**Contact:** inventory@{{ config('app.domain', 'example.com') }}

---

*This is an automated reminder. Late fees are calculated daily and will continue to accumulate until the item is returned.*

Best regards,<br>
{{ config('app.name') }} Inventory Team
</x-mail::message>
