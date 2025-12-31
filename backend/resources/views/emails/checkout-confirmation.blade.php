<x-mail::message>
# Item Checkout Confirmation

Hello **{{ $user->name }}**,

This email confirms that the following item has been successfully checked out to you.

<x-mail::panel>
## Item Details

**Item Name:** {{ $item->name }}  
**Item Code:** {{ $item->inventory_number }}  
**Category:** {{ $item->category->category_name }}

**Checkout Date:** {{ $checkoutDate }}  
**Due Date:** {{ $dueDate }}  
**Checked Out By:** {{ $checkedOutBy->name }}
</x-mail::panel>

### Important Reminders

- Please return the item **on or before {{ $dueDate }}** to avoid late fees
- Late fees are **$1.00 per day** after the due date
- Inspect the item upon receipt and report any damage immediately
- Keep this email for your records

<x-mail::button :url="config('app.frontend_url') . '/transactions'">
View My Transactions
</x-mail::button>

If you have any questions about this checkout, please contact the inventory management team.

Thank you,<br>
{{ config('app.name') }} Inventory Team
</x-mail::message>
