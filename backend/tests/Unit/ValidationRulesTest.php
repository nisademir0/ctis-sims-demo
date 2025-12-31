<?php

namespace Tests\Unit;

use App\Rules\ValidItemStatus;
use App\Rules\ValidPriority;
use App\Rules\PositiveQuantity;
use App\Rules\NonNegativeCost;
use App\Rules\ValidDueDate;
use Illuminate\Support\Facades\Validator;
use Tests\TestCase;

class ValidationRulesTest extends TestCase
{
    public function test_valid_item_status_accepts_valid_statuses(): void
    {
        $validStatuses = ['available', 'lent', 'maintenance', 'retired', 'donated'];

        foreach ($validStatuses as $status) {
            $validator = Validator::make(
                ['status' => $status],
                ['status' => [new ValidItemStatus()]]
            );

            $this->assertFalse($validator->fails(), "Status '{$status}' should be valid");
        }
    }

    public function test_valid_item_status_rejects_invalid_statuses(): void
    {
        $invalidStatuses = ['invalid', 'broken', 'lost', 'unknown'];

        foreach ($invalidStatuses as $status) {
            $validator = Validator::make(
                ['status' => $status],
                ['status' => [new ValidItemStatus()]]
            );

            $this->assertTrue($validator->fails(), "Status '{$status}' should be invalid");
        }
    }

    public function test_valid_priority_accepts_valid_priorities(): void
    {
        $validPriorities = ['low', 'medium', 'high', 'urgent'];

        foreach ($validPriorities as $priority) {
            $validator = Validator::make(
                ['priority' => $priority],
                ['priority' => [new ValidPriority()]]
            );

            $this->assertFalse($validator->fails(), "Priority '{$priority}' should be valid");
        }
    }

    public function test_positive_quantity_accepts_positive_integers(): void
    {
        $validQuantities = [1, 5, 100, 1000];

        foreach ($validQuantities as $quantity) {
            $validator = Validator::make(
                ['quantity' => $quantity],
                ['quantity' => [new PositiveQuantity()]]
            );

            $this->assertFalse($validator->fails(), "Quantity '{$quantity}' should be valid");
        }
    }

    public function test_positive_quantity_rejects_zero_and_negative(): void
    {
        $invalidQuantities = [0, -1, -100];

        foreach ($invalidQuantities as $quantity) {
            $validator = Validator::make(
                ['quantity' => $quantity],
                ['quantity' => [new PositiveQuantity()]]
            );

            $this->assertTrue($validator->fails(), "Quantity '{$quantity}' should be invalid");
        }
    }

    public function test_non_negative_cost_accepts_zero_and_positive(): void
    {
        $validCosts = [0, 0.01, 10.50, 1000.00];

        foreach ($validCosts as $cost) {
            $validator = Validator::make(
                ['cost' => $cost],
                ['cost' => [new NonNegativeCost()]]
            );

            $this->assertFalse($validator->fails(), "Cost '{$cost}' should be valid");
        }
    }

    public function test_non_negative_cost_rejects_negative(): void
    {
        $invalidCosts = [-0.01, -10.50, -1000.00];

        foreach ($invalidCosts as $cost) {
            $validator = Validator::make(
                ['cost' => $cost],
                ['cost' => [new NonNegativeCost()]]
            );

            $this->assertTrue($validator->fails(), "Cost '{$cost}' should be invalid");
        }
    }

    public function test_valid_due_date_accepts_future_dates(): void
    {
        $futureDate = now()->addDays(7)->format('Y-m-d');

        $validator = Validator::make(
            ['due_date' => $futureDate],
            ['due_date' => [new ValidDueDate()]]
        );

        $this->assertFalse($validator->fails(), "Future date should be valid");
    }

    public function test_valid_due_date_rejects_past_dates(): void
    {
        $pastDate = now()->subDays(1)->format('Y-m-d');

        $validator = Validator::make(
            ['due_date' => $pastDate],
            ['due_date' => [new ValidDueDate()]]
        );

        $this->assertTrue($validator->fails(), "Past date should be invalid");
    }

    public function test_valid_due_date_rejects_dates_too_far_ahead(): void
    {
        $tooFarAhead = now()->addDays(100)->format('Y-m-d');

        $validator = Validator::make(
            ['due_date' => $tooFarAhead],
            ['due_date' => [new ValidDueDate(90)]] // Max 90 days
        );

        $this->assertTrue($validator->fails(), "Date more than 90 days ahead should be invalid");
    }
}
