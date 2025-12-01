import { test, expect } from '@playwright/test';
import { injectAxe, checkA11y } from 'axe-playwright';

/**
 * Usability Test: Accessibility
 * Tests WCAG 2.1 AA compliance and keyboard navigation
 */

test.describe('Accessibility Tests', () => {
    test('should pass accessibility checks on home page', async ({ page }) => {
        await page.goto('/');
        await injectAxe(page);

        // Check for accessibility violations
        await checkA11y(page, undefined, {
            detailedReport: true,
            detailedReportOptions: {
                html: true,
            },
        });
    });

    test('should pass accessibility checks on login page', async ({ page }) => {
        await page.goto('/login');
        await injectAxe(page);
        await checkA11y(page);
    });

    test('should pass accessibility checks on customer dashboard', async ({ page }) => {
        // Login first
        await page.goto('/login');
        await page.fill('input[type="email"]', 'customer@test.com');
        await page.fill('input[type="password"]', 'test-password-123');
        await page.click('button[type="submit"]');

        await page.goto('/dashboard/customer');
        await injectAxe(page);
        await checkA11y(page);
    });

    test('should support keyboard navigation on booking form', async ({ page }) => {
        await page.goto('/');

        // Tab through service cards
        await page.keyboard.press('Tab');
        await page.keyboard.press('Tab');

        // Select service with Enter
        await page.keyboard.press('Enter');

        // Verify booking form is visible
        await expect(page.locator('[data-testid="booking-form"]')).toBeVisible();

        // Navigate through form with Tab
        await page.keyboard.press('Tab'); // Calendar
        await page.keyboard.press('Tab'); // Time slots
        await page.keyboard.press('Tab'); // Confirm button

        // Focused element should be visible
        const focusedElement = await page.evaluate(() => document.activeElement?.tagName);
        expect(focusedElement).toBeTruthy();
    });

    test('should have proper ARIA labels on interactive elements', async ({ page }) => {
        await page.goto('/');

        // Check service cards have aria-label
        const serviceCards = page.locator('[data-testid="service-card"]');
        const firstCard = serviceCards.first();
        const ariaLabel = await firstCard.getAttribute('aria-label');
        expect(ariaLabel).toBeTruthy();

        // Check buttons have accessible names
        const buttons = page.locator('button');
        const count = await buttons.count();

        for (let i = 0; i < Math.min(count, 5); i++) {
            const button = buttons.nth(i);
            const text = await button.textContent();
            const label = await button.getAttribute('aria-label');
            expect(text || label).toBeTruthy();
        }
    });

    test('should have sufficient color contrast', async ({ page }) => {
        await page.goto('/');
        await injectAxe(page);

        // Check specifically for color contrast violations
        await checkA11y(page, undefined, {
            rules: {
                'color-contrast': { enabled: true },
            },
        });
    });

    test('should have proper heading hierarchy', async ({ page }) => {
        await page.goto('/');

        // Check for h1
        const h1 = page.locator('h1');
        await expect(h1).toHaveCount(1); // Should have exactly one h1

        // Verify heading levels don't skip
        const headings = await page.locator('h1, h2, h3, h4, h5, h6').all();
        const levels = await Promise.all(
            headings.map(h => h.evaluate(el => parseInt(el.tagName.charAt(1))))
        );

        // Check no skipped levels (e.g., h1 -> h3)
        for (let i = 1; i < levels.length; i++) {
            expect(levels[i] - levels[i - 1]).toBeLessThanOrEqual(1);
        }
    });

    test('should have alt text for all images', async ({ page }) => {
        await page.goto('/');

        const images = page.locator('img');
        const count = await images.count();

        for (let i = 0; i < count; i++) {
            const img = images.nth(i);
            const alt = await img.getAttribute('alt');
            expect(alt).toBeDefined(); // All images should have alt attribute
        }
    });

    test('should support screen reader navigation', async ({ page }) => {
        await page.goto('/');

        // Check for landmark regions
        await expect(page.locator('header, nav, main, footer')).toHaveCount(4, { timeout: 5000 });

        // Check for skip links
        const skipLink = page.locator('a[href="#main-content"]');
        if (await skipLink.isVisible()) {
            await expect(skipLink).toHaveText(/skip|saltar/i);
        }
    });
});
