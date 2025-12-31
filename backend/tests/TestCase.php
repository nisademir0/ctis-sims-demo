<?php

namespace Tests;

use Illuminate\Foundation\Testing\TestCase as BaseTestCase;

abstract class TestCase extends BaseTestCase
{
    /**
     * Base test case for all tests.
     * 
     * Uses MySQL test database (ctis_sims_test) configured in phpunit.xml.
     * Tests use DatabaseTransactions trait to ensure isolation without wiping data.
     */
}
