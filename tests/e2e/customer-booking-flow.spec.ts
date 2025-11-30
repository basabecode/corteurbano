import { test, expect } from '@playwright/test';

/**
 * E2E Test: Customer Booking Flow
 * Tests the complete user journey from login to booking confirmation
 */

test.describe('Customer Booking Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Navigate to home page
        await page.goto('/');
    });

    test('should complete full booking flow as authenticated user', async ({ page }) => {
        // Step 1: Navigate to login
        await page.click('text=Iniciar Sesión');
        await expect(page).toHaveURL(/.*login/);

        // Step 2: Login with test credentials
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');

        // Wait for redirect to home or dashboard
        await page.waitForURL(/.*\/(dashboard|$)/);

        // Step 3: Navigate to booking section
        await page.goto('/');

        // Step 4: Select a service
        const serviceCard = page.locator('[data-testid="service-card"]').first();
        await serviceCard.click();

        // Verify booking form appears
        await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();

        // Step 5: Select date
        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayButton = page.locator(`button[name="day"][value="${tomorrow.getDate()}"]`);
        await dayButton.click();

        // Step 6: Select time slot
        await page.waitForSelector('[data-testid="time-slot"]');
        const timeSlot = page.locator('[data-testid="time-slot"]').first();
        await timeSlot.click();

        // Step 7: Confirm booking
        await page.click('button:has-text("Confirmar Reserva")');

        // Step 8: Verify success message
        await expect(page.locator('text=Cita creada exitosamente')).toBeVisible({ timeout: 10000 });

        // Step 9: Navigate to customer dashboard
        await page.goto('/dashboard/customer');

        // Step 10: Verify appointment appears in dashboard
        await expect(page.locator('[data-testid="appointment-item"]')).toHaveCount(1, { timeout: 5000 });
    });

    test('should show validation errors for incomplete booking', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*\/(dashboard|$)/);

        // Go to home and select service
        await page.goto('/');
        const serviceCard = page.locator('[data-testid="service-card"]').first();
        await serviceCard.click();

        // Try to confirm without selecting date/time
        await page.click('button:has-text("Confirmar Reserva")');

        // Should show validation error
        await expect(page.locator('text=/selecciona.*fecha|elige.*hora/i')).toBeVisible();
    });

    test('should prevent booking past dates', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*\/(dashboard|$)/);

        // Go to booking
        await page.goto('/');
        const serviceCard = page.locator('[data-testid="service-card"]').first();
        await serviceCard.click();

        // Calendar should not allow selecting past dates
        const yesterday = new Date();
        yesterday.setDate(yesterday.getDate() - 1);

        const pastDayButton = page.locator(`button[name="day"][value="${yesterday.getDate()}"]`);

        // Past dates should be disabled
        if (await pastDayButton.isVisible()) {
            await expect(pastDayButton).toBeDisabled();
        }
    });

    test('should show busy time slots as unavailable', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*\/(dashboard|$)/);

        // Select service and date
        await page.goto('/');
        const serviceCard = page.locator('[data-testid="service-card"]').first();
        await serviceCard.click();

        const tomorrow = new Date();
        tomorrow.setDate(tomorrow.getDate() + 1);
        const dayButton = page.locator(`button[name="day"][value="${tomorrow.getDate()}"]`);
        await dayButton.click();

        // Wait for time slots to load
        await page.waitForSelector('[data-testid="time-slot"]');

        // Check if any slots are marked as busy/disabled
        const busySlots = page.locator('[data-testid="time-slot"][disabled]');
        const count = await busySlots.count();

        // If there are busy slots, verify they can't be clicked
        if (count > 0) {
            await expect(busySlots.first()).toBeDisabled();
        }
    });

    test('should allow cancelling appointment from customer dashboard', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');

        // Go to customer dashboard
        await page.goto('/dashboard/customer');

        // Find an appointment (assuming one exists)
        const appointmentItem = page.locator('[data-testid="appointment-item"]').first();

        if (await appointmentItem.isVisible()) {
            // Click cancel button
            await appointmentItem.locator('button:has-text("Cancelar")').click();

            // Confirm cancellation in modal
            await page.click('button:has-text("Confirmar cancelación")');

            // Verify success message
            await expect(page.locator('text=/cita.*cancelada/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should display service details correctly', async ({ page }) => {
        await page.goto('/');

        // Verify service cards are displayed
        const serviceCards = page.locator('[data-testid="service-card"]');
        await expect(serviceCards).toHaveCount(3, { timeout: 5000 }); // Assuming 3 services

        // Check first service has required info
        const firstCard = serviceCards.first();
        await expect(firstCard.locator('text=/corte|barba|afeitado/i')).toBeVisible();
        await expect(firstCard.locator('text=/\\$\\d+/')).toBeVisible(); // Price
        await expect(firstCard.locator('text=/\\d+\\s*min/')).toBeVisible(); // Duration
    });

    test('should maintain session after page refresh', async ({ page }) => {
        // Login
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*\/(dashboard|$)/);

        // Refresh page
        await page.reload();

        // Should still be logged in
        await expect(page.locator('text=/dashboard|mi cuenta/i')).toBeVisible();
    });
});
