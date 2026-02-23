import { test, expect } from '@playwright/test';

test.describe('Live Appointment Tracker Flow', () => {
    test('should allow user to visit tracker from dashboard', async ({ page }) => {
        // Step 1: Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');

        // Wait for dashboard redirect
        await page.waitForURL(/.*\/(dashboard|$)/);
        await page.goto('/dashboard/customer');

        // Step 2: Ensure there's at least one upcoming appointment.
        // If the button "Seguimiento" exists, we will click it.
        // Assuming the test DB has upcoming appointments:
        const trackingButton = page.locator('text=Seguimiento').first();

        if (await trackingButton.isVisible()) {
            await trackingButton.click();

            // Should redirect to /tracker/[uuid]
            await expect(page).toHaveURL(/.*\/tracker\/.*/);

            // Step 3: Check tracker mount (Skeleton screen first, then content)
            // It should ultimately show the "SEGUIMIENTO EN TIEMPO REAL" title
            const mainTitle = page.locator('h1:has-text("SEGUIMIENTO EN")');
            await expect(mainTitle).toBeVisible({ timeout: 10000 });

            // Verify a step is rendered (e.g., SOLICITUD RECIBIDA)
            await expect(page.locator('text=SOLICITUD RECIBIDA')).toBeVisible();
        }
    });

    test('should return 404 for non-existent appointment tracker', async ({ page }) => {
        // Visit an invalid UUID
        const response = await page.goto('/tracker/00000000-0000-0000-0000-000000000000');
        expect(response?.status()).toBe(404);
    });
});
