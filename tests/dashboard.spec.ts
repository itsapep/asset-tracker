import { test, expect } from '@playwright/test';

test.describe('Admin Desktop Dashboard', () => {
  test('should load the dashboard and display key components', async ({ page }) => {
    // Navigate to the main dashboard page
    await page.goto('/');

    // Check heading
    const heading = page.locator('h1');
    await expect(heading).toBeVisible();
    await expect(heading).toHaveText('Admin Desktop Dashboard');

    // Check Compliance Command Center widgets
    const complianceHeading = page.locator('h2', { hasText: 'Vehicle Compliance Alerts' });
    await expect(complianceHeading).toBeVisible();

    const maintenanceHeading = page.locator('h2', { hasText: 'Maintenance Tracking' });
    await expect(maintenanceHeading).toBeVisible();

    // Check Inventory Ledger table heading
    const ledgerHeading = page.locator('h2', { hasText: 'Inventory Ledger' });
    await expect(ledgerHeading).toBeVisible();
  });

  test('should handle filtering and updating URL parameters', async ({ page }) => {
    await page.goto('/');

    // Locate the search bar
    const searchInput = page.locator('input[placeholder="Search by name or tag code..."]');
    await expect(searchInput).toBeVisible();

    // Type query
    await searchInput.fill('test-query');
    await searchInput.press('Enter');

    // Verify URL updates
    await expect(page).toHaveURL(/\?q=test-query/);

    // Filter by type
    const typeSelect = page.locator('select').first(); // Type select is first
    await typeSelect.selectOption('vehicle');

    // Verify URL updates
    await expect(page).toHaveURL(/type=vehicle/);
  });
});
