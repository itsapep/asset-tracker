import { test, expect } from '@playwright/test';

test.describe('Edit Asset Modal Integration Tests', () => {
  test('should open the edit asset modal, verify layout, and update an asset successfully', async ({ page }) => {
    // 1. Navigate to the dashboard
    await page.goto('/');

    // 2. Click the first row in the inventory ledger to open the Asset Details Drawer
    const firstRow = page.locator('table tbody tr').first();
    await expect(firstRow).toBeVisible();
    await firstRow.click();

    // 3. Verify the details drawer is visible
    const drawerHeader = page.locator('h3:has-text("Details"), h3:has-text("Asset")').first();
    await expect(drawerHeader).toBeVisible();

    // 4. Click the "Edit Asset" button in the drawer footer
    const editButton = page.locator('button:has-text("Edit Asset")');
    await expect(editButton).toBeVisible();
    await expect(editButton).toBeEnabled();
    await editButton.click();

    // 5. Verify the Edit Asset Modal opens
    const modalHeader = page.locator('h3:has-text("Edit Asset details")');
    await expect(modalHeader).toBeVisible();

    // 6. Verify that the "status" field is NOT present/editable in the modal
    const statusFieldInput = page.locator('input[name="status"], select[name="status"]');
    await expect(statusFieldInput).not.toBeVisible();

    // 7. Verify fields exist (e.g. Asset Name, Vendor Name, Purchase Cost)
    const assetNameInput = page.locator('label:has-text("Asset Name") + input');
    await expect(assetNameInput).toBeVisible();
    const originalName = await assetNameInput.inputValue();

    // 8. Update the Asset Name
    const newName = originalName + ' - Edited Integration Test';
    await assetNameInput.fill(newName);

    // 9. Click Save Changes
    const saveButton = page.locator('button:has-text("Save Changes")');
    await expect(saveButton).toBeVisible();
    await saveButton.click();

    // 10. Verify the modal closes
    await expect(modalHeader).not.toBeVisible();

    // 11. Verify the updated name is displayed in the Drawer header
    const updatedDrawerHeader = page.locator('h3', { hasText: newName });
    await expect(updatedDrawerHeader).toBeVisible();
  });
});
