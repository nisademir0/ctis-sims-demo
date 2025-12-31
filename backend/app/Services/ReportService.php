<?php

namespace App\Services;

use App\Models\Item;
use App\Models\Transaction;
use App\Models\MaintenanceRequest;
use App\Models\PurchaseRequest;
use Carbon\Carbon;
use Illuminate\Support\Facades\DB;

class ReportService
{
    /**
     * Generate inventory summary report
     */
    public function generateInventoryReport(array $filters = [])
    {
        $query = Item::with(['category', 'vendor']);

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['category_id'])) {
            $query->where('category_id', $filters['category_id']);
        }

        if (isset($filters['date_from'])) {
            $query->where('purchase_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('purchase_date', '<=', $filters['date_to']);
        }

        $items = $query->get();

        return [
            'items' => $items,
            'summary' => [
                'total_items' => $items->count(),
                'available' => $items->where('status', 'available')->count(),
                'lent' => $items->where('status', 'lent')->count(),
                'maintenance' => $items->where('status', 'maintenance')->count(),
                'retired' => $items->where('status', 'retired')->count(),
                'total_value' => $items->sum('purchase_price'),
            ],
            'by_category' => $items->groupBy('category.category_name')->map(function ($categoryItems) {
                return [
                    'count' => $categoryItems->count(),
                    'value' => $categoryItems->sum('purchase_price'),
                ];
            }),
        ];
    }

    /**
     * Generate transaction summary report
     */
    public function generateTransactionReport(array $filters = [])
    {
        $query = Transaction::with(['user', 'item', 'checkedOutBy']);

        if (isset($filters['date_from'])) {
            $query->where('checkout_date', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('checkout_date', '<=', $filters['date_to']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['user_id'])) {
            $query->where('user_id', $filters['user_id']);
        }

        $transactions = $query->get();

        return [
            'transactions' => $transactions,
            'summary' => [
                'total_transactions' => $transactions->count(),
                'active' => $transactions->where('status', 'active')->count(),
                'completed' => $transactions->where('status', 'completed')->count(),
                'overdue' => $transactions->where('status', 'overdue')->count(),
                'total_late_fees' => $transactions->sum('late_fee'),
                'unpaid_late_fees' => $transactions->where('late_fee_paid', false)->sum('late_fee'),
            ],
        ];
    }

    /**
     * Generate maintenance request report
     */
    public function generateMaintenanceReport(array $filters = [])
    {
        $query = MaintenanceRequest::with(['item', 'requester', 'assignedTo']);

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        if (isset($filters['priority'])) {
            $query->where('priority', $filters['priority']);
        }

        $requests = $query->get();

        return [
            'requests' => $requests,
            'summary' => [
                'total_requests' => $requests->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'in_progress' => $requests->where('status', 'in_progress')->count(),
                'completed' => $requests->where('status', 'completed')->count(),
                'total_cost' => $requests->sum('cost'),
                'average_cost' => $requests->avg('cost'),
            ],
            'by_priority' => $requests->groupBy('priority')->map(function ($priorityRequests) {
                return $priorityRequests->count();
            }),
        ];
    }

    /**
     * Generate purchase request report
     */
    public function generatePurchaseReport(array $filters = [])
    {
        $query = PurchaseRequest::with(['requester', 'approvedBy']);

        if (isset($filters['date_from'])) {
            $query->where('created_at', '>=', $filters['date_from']);
        }

        if (isset($filters['date_to'])) {
            $query->where('created_at', '<=', $filters['date_to']);
        }

        if (isset($filters['status'])) {
            $query->where('status', $filters['status']);
        }

        $requests = $query->get();

        return [
            'requests' => $requests,
            'summary' => [
                'total_requests' => $requests->count(),
                'pending' => $requests->where('status', 'pending')->count(),
                'approved' => $requests->where('status', 'approved')->count(),
                'rejected' => $requests->where('status', 'rejected')->count(),
                'ordered' => $requests->where('status', 'ordered')->count(),
                'received' => $requests->where('status', 'received')->count(),
                'total_estimated_cost' => $requests->sum('estimated_cost'),
                'approved_cost' => $requests->where('status', 'approved')->sum('estimated_cost'),
            ],
        ];
    }

    /**
     * Generate report data based on type
     */
    public function generateReport(string $reportType, array $filters = [])
    {
        return match($reportType) {
            'inventory' => $this->generateInventoryReport($filters),
            'transactions' => $this->generateTransactionReport($filters),
            'maintenance' => $this->generateMaintenanceReport($filters),
            'purchase' => $this->generatePurchaseReport($filters),
            default => throw new \InvalidArgumentException("Invalid report type: {$reportType}"),
        };
    }

    /**
     * Generate report data (alias for generateReport for compatibility)
     */
    public function generateReportData(string $reportType, array $filters = []): array
    {
        return $this->generateReport($reportType, $filters);
    }

    /**
     * Format report to specified format
     */
    public function formatReport(array $data, string $format, string $reportType): mixed
    {
        return match($format) {
            'json' => json_encode($data, JSON_PRETTY_PRINT),
            'csv' => $this->formatForCsv($data, $reportType),
            'array' => $data,
            default => json_encode($data),
        };
    }

    /**
     * Format report for CSV export
     */
    public function formatForCsv(array $reportData, string $reportType): string
    {
        // Implementation depends on report type
        // This is a simplified version
        $output = '';
        
        // Add headers
        $headers = $this->getHeadersForType($reportType);
        $output .= implode(',', $headers) . "\n";

        // Add data rows
        $dataKey = match($reportType) {
            'inventory' => 'items',
            'transactions' => 'transactions',
            'maintenance' => 'requests',
            'purchase' => 'requests',
            default => 'data',
        };

        foreach ($reportData[$dataKey] as $row) {
            $rowData = $this->formatRowForType($row, $reportType);
            $output .= implode(',', array_map(fn($v) => '"' . str_replace('"', '""', $v ?? '') . '"', $rowData)) . "\n";
        }

        return $output;
    }

    /**
     * Get CSV headers for report type
     */
    private function getHeadersForType(string $reportType): array
    {
        return match($reportType) {
            'inventory' => ['ID', 'Name', 'Category', 'Status', 'Purchase Date', 'Price'],
            'transactions' => ['ID', 'User', 'Item', 'Checkout Date', 'Due Date', 'Status', 'Late Fee'],
            'maintenance' => ['ID', 'Item', 'Issue', 'Priority', 'Status', 'Cost', 'Date'],
            'purchase' => ['ID', 'Item Name', 'Quantity', 'Estimated Cost', 'Status', 'Date'],
            default => ['Data'],
        };
    }

    /**
     * Format single row for CSV
     */
    private function formatRowForType($row, string $reportType): array
    {
        return match($reportType) {
            'inventory' => [
                $row->id,
                $row->name,
                $row->category->category_name ?? 'N/A',
                $row->status,
                $row->purchase_date?->format('Y-m-d') ?? 'N/A',
                $row->purchase_price ?? 0,
            ],
            'transactions' => [
                $row->id,
                $row->user->name ?? 'N/A',
                $row->item->name ?? 'N/A',
                $row->checkout_date->format('Y-m-d'),
                $row->due_date->format('Y-m-d'),
                $row->status,
                $row->late_fee ?? 0,
            ],
            'maintenance' => [
                $row->id,
                $row->item->name ?? 'N/A',
                $row->issue_description,
                $row->priority,
                $row->status,
                $row->cost ?? 0,
                $row->created_at->format('Y-m-d'),
            ],
            'purchase' => [
                $row->id,
                $row->item_name,
                $row->quantity,
                $row->estimated_cost,
                $row->status,
                $row->created_at->format('Y-m-d'),
            ],
            default => [$row->id ?? 'N/A'],
        };
    }
}
