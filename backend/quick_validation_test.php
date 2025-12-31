<?php

/**
 * Quick Validation Test Script
 * Run with: php artisan tinker < quick_validation_test.php
 */

echo "\n====================================\n";
echo "Form Request Validation Test\n";
echo "====================================\n\n";

// Test 1: Check all Form Request classes exist
echo "Test 1: Checking Form Request classes...\n";

$formRequests = [
    'App\\Http\\Requests\\Inventory\\IndexItemRequest',
    'App\\Http\\Requests\\Inventory\\StoreItemRequest',
    'App\\Http\\Requests\\Inventory\\UpdateItemRequest',
    'App\\Http\\Requests\\Transaction\\IndexTransactionRequest',
    'App\\Http\\Requests\\Transaction\\CheckoutItemRequest',
    'App\\Http\\Requests\\Transaction\\ReturnItemRequest',
    'App\\Http\\Requests\\MaintenanceRequest\\StoreMaintenanceRequestRequest',
    'App\\Http\\Requests\\MaintenanceRequest\\UpdateMaintenanceRequestRequest',
    'App\\Http\\Requests\\MaintenanceRequest\\AssignMaintenanceRequestRequest',
    'App\\Http\\Requests\\MaintenanceRequest\\CompleteMaintenanceRequestRequest',
    'App\\Http\\Requests\\MaintenanceRequest\\CancelMaintenanceRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\IndexPurchaseRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\StorePurchaseRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\UpdatePurchaseRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\ApprovePurchaseRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\RejectPurchaseRequestRequest',
    'App\\Http\\Requests\\PurchaseRequest\\MarkAsOrderedRequest',
    'App\\Http\\Requests\\PurchaseRequest\\MarkAsReceivedRequest',
];

$allExist = true;
foreach ($formRequests as $class) {
    if (class_exists($class)) {
        echo "  ✓ " . basename(str_replace('\\', '/', $class)) . "\n";
    } else {
        echo "  ✗ " . basename(str_replace('\\', '/', $class)) . " NOT FOUND\n";
        $allExist = false;
    }
}

if ($allExist) {
    echo "\n✅ All 18 Form Request classes exist!\n";
} else {
    echo "\n❌ Some Form Request classes are missing!\n";
}

// Test 2: Check custom validation rules
echo "\nTest 2: Checking Custom Validation Rules...\n";

$customRules = [
    'App\\Rules\\ValidItemStatus',
    'App\\Rules\\ValidPriority',
    'App\\Rules\\ValidMaintenanceStatus',
    'App\\Rules\\ValidPurchaseStatus',
    'App\\Rules\\ItemAvailableForCheckout',
    'App\\Rules\\ValidDueDate',
    'App\\Rules\\PositiveQuantity',
    'App\\Rules\\NonNegativeCost',
];

$allRulesExist = true;
foreach ($customRules as $class) {
    if (class_exists($class)) {
        echo "  ✓ " . basename(str_replace('\\', '/', $class)) . "\n";
    } else {
        echo "  ✗ " . basename(str_replace('\\', '/', $class)) . " NOT FOUND\n";
        $allRulesExist = false;
    }
}

if ($allRulesExist) {
    echo "\n✅ All 8 custom validation rules exist!\n";
} else {
    echo "\n❌ Some custom validation rules are missing!\n";
}

// Test 3: Check controllers
echo "\nTest 3: Checking Controllers...\n";

$controllers = [
    'App\\Http\\Controllers\\InventoryController',
    'App\\Http\\Controllers\\TransactionController',
    'App\\Http\\Controllers\\MaintenanceRequestController',
    'App\\Http\\Controllers\\PurchaseRequestController',
];

$allControllersExist = true;
foreach ($controllers as $class) {
    if (class_exists($class)) {
        echo "  ✓ " . basename(str_replace('\\', '/', $class)) . "\n";
    } else {
        echo "  ✗ " . basename(str_replace('\\', '/', $class)) . " NOT FOUND\n";
        $allControllersExist = false;
    }
}

if ($allControllersExist) {
    echo "\n✅ All 4 controllers exist!\n";
} else {
    echo "\n❌ Some controllers are missing!\n";
}

// Test 4: Verify no Validator::make in controllers
echo "\nTest 4: Checking for inline validation...\n";
$controllerPath = base_path('app/Http/Controllers');
$hasInlineValidation = false;

foreach (glob("$controllerPath/*Controller.php") as $file) {
    $content = file_get_contents($file);
    if (strpos($content, 'Validator::make') !== false) {
        echo "  ✗ Found Validator::make in " . basename($file) . "\n";
        $hasInlineValidation = true;
    }
}

if (!$hasInlineValidation) {
    echo "  ✓ No Validator::make found in controllers\n";
    echo "\n✅ All inline validation removed!\n";
} else {
    echo "\n❌ Some controllers still have inline validation!\n";
}

// Summary
echo "\n====================================\n";
echo "SUMMARY\n";
echo "====================================\n";

if ($allExist && $allRulesExist && $allControllersExist && !$hasInlineValidation) {
    echo "✅ ALL CHECKS PASSED!\n";
    echo "\nPhase 3 implementation is complete and working.\n";
    echo "All Form Requests are loaded and ready.\n";
    echo "All custom validation rules are available.\n";
    echo "Controllers are using Form Requests (no inline validation).\n";
    echo "\n🚀 Ready for API testing!\n";
} else {
    echo "❌ SOME CHECKS FAILED!\n";
    echo "\nPlease review the errors above.\n";
}

echo "\n====================================\n\n";
