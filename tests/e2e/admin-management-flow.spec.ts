import { test, expect } from '@playwright/test';

/**
 * E2E Test: Admin Management Flow
 * Tests admin dashboard functionality and appointment management
 */

test.describe('Admin Management Flow', () => {
    test.beforeEach(async ({ page }) => {
        // Login as admin
        await page.goto('/login');
        await page.fill('input[type="email"]', 'admin@test.com');
        await page.fill('input[type="password"]', 'admin-password-123');
        await page.click('button[type="submit"]');
        await page.waitForURL(/.*dashboard/);
    });

    test('should display admin dashboard with statistics', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Verify stats cards are visible
        await expect(page.locator('[data-testid="stats-card"]')).toHaveCount(4, { timeout: 5000 });

        // Check for key metrics
        await expect(page.locator('text=/citas.*hoy/i')).toBeVisible();
        await expect(page.locator('text=/ingresos/i')).toBeVisible();
        await expect(page.locator('text=/pendientes/i')).toBeVisible();
    });

    test('should filter appointments by status', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Click on "Pendientes" filter
        await page.click('button:has-text("Pendientes")');

        // Wait for appointments to load
        await page.waitForSelector('[data-testid="appointment-row"]', { timeout: 5000 });

        // Verify all visible appointments have "pending" status
        const statusBadges = page.locator('[data-testid="status-badge"]');
        const count = await statusBadges.count();

        for (let i = 0; i < count; i++) {
            const text = await statusBadges.nth(i).textContent();
            expect(text?.toLowerCase()).toContain('pendiente');
        }
    });

    test('should confirm appointment and update status', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Find a pending appointment
        const pendingRow = page.locator('[data-testid="appointment-row"]').filter({
            has: page.locator('text=/pendiente/i'),
        }).first();

        if (await pendingRow.isVisible()) {
            // Click confirm button
            await pendingRow.locator('button:has-text("Confirmar")').click();

            // Verify success message
            await expect(page.locator('text=/confirmada/i')).toBeVisible({ timeout: 5000 });

            // Verify status changed
            await expect(pendingRow.locator('text=/confirmada/i')).toBeVisible();
        }
    });

    test('should cancel appointment with reason', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Find a pending or confirmed appointment
        const appointmentRow = page.locator('[data-testid="appointment-row"]').first();

        if (await appointmentRow.isVisible()) {
            // Click cancel button
            await appointmentRow.locator('button:has-text("Cancelar")').click();

            // Fill cancellation reason
            await page.fill('textarea[name="cancellation_reason"]', 'Cliente solicitó cancelación');

            // Confirm cancellation
            await page.click('button:has-text("Confirmar cancelación")');

            // Verify success
            await expect(page.locator('text=/cancelada/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should search appointments by client name', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Type in search box
        await page.fill('input[placeholder*="Buscar"]', 'Test Customer');

        // Wait for filtered results
        await page.waitForTimeout(500); // Debounce

        // Verify results contain search term
        const rows = page.locator('[data-testid="appointment-row"]');
        const count = await rows.count();

        if (count > 0) {
            const firstRowText = await rows.first().textContent();
            expect(firstRowText?.toLowerCase()).toContain('test');
        }
    });

    test('should archive completed appointments', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Filter by completed
        await page.click('button:has-text("Completadas")');

        // Select appointments to archive
        const checkboxes = page.locator('[data-testid="appointment-checkbox"]');
        const count = await checkboxes.count();

        if (count > 0) {
            // Select first appointment
            await checkboxes.first().check();

            // Click archive button
            await page.click('button:has-text("Archivar")');

            // Confirm
            await page.click('button:has-text("Confirmar")');

            // Verify success
            await expect(page.locator('text=/archivada/i')).toBeVisible({ timeout: 5000 });
        }
    });

    test('should generate and download reports', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Click on reports/analytics section
        await page.click('text=/reportes|análisis/i');

        // Select date range
        await page.selectOption('select[name="months"]', '3'); // Last 3 months

        // Click generate report
        const downloadPromise = page.waitForEvent('download');
        await page.click('button:has-text("Generar Reporte")');

        // Verify download started
        const download = await downloadPromise;
        expect(download.suggestedFilename()).toMatch(/report|reporte/i);
    });

    test('should display appointment details in modal', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Click on an appointment row
        const appointmentRow = page.locator('[data-testid="appointment-row"]').first();
        await appointmentRow.click();

        // Verify modal appears with details
        await expect(page.locator('[data-testid="appointment-modal"]')).toBeVisible();

        // Check for key details
        await expect(page.locator('text=/cliente/i')).toBeVisible();
        await expect(page.locator('text=/servicio/i')).toBeVisible();
        await expect(page.locator('text=/fecha/i')).toBeVisible();
        await expect(page.locator('text=/precio/i')).toBeVisible();
    });

    test('should prevent non-admin access to admin dashboard', async ({ page }) => {
        // Logout
        await page.click('text=/cerrar sesión/i');

        // Login as customer
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');

        // Try to access admin dashboard
        await page.goto('/dashboard/admin');

        // Should be redirected or show error
        await expect(page).not.toHaveURL(/.*dashboard\/admin/);
        // OR
        await expect(page.locator('text=/no autorizado|acceso denegado/i')).toBeVisible();
    });

    test('should update appointment status to completed', async ({ page }) => {
        await page.goto('/dashboard/admin');

        // Find a confirmed appointment
        const confirmedRow = page.locator('[data-testid="appointment-row"]').filter({
            has: page.locator('text=/confirmada/i'),
        }).first();

        if (await confirmedRow.isVisible()) {
            // Click complete button
            await confirmedRow.locator('button:has-text("Completar")').click();

            // Verify status changed
            await expect(page.locator('text=/completada/i')).toBeVisible({ timeout: 5000 });
        }
    });
});
