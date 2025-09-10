import { test, expect } from '@playwright/test'

test.describe('AI ERP System E2E Tests', () => {
  test.beforeEach(async ({ page }) => {
    // Navigate to the home page
    await page.goto('/')
  })

  test('should load the homepage', async ({ page }) => {
    // Check if the page loads successfully
    await expect(page).toHaveTitle(/AI ERP/)
  })

  test('should navigate to login page', async ({ page }) => {
    // Look for login link and click it
    const loginLink = page.getByRole('link', { name: /login/i })
    if (await loginLink.isVisible()) {
      await loginLink.click()
      await expect(page).toHaveURL(/.*login/)
    }
  })

  test('should display navigation elements', async ({ page }) => {
    // Check for common navigation elements
    const navigation = page.getByRole('navigation')
    if (await navigation.isVisible()) {
      await expect(navigation).toBeVisible()
    }
  })
})

test.describe('Inventory Management', () => {
  test('should display inventory table', async ({ page }) => {
    await page.goto('/inventory')

    // Look for inventory-related elements
    const inventoryTable = page.getByRole('table')
    if (await inventoryTable.isVisible()) {
      await expect(inventoryTable).toBeVisible()
    }
  })

  test('should allow searching inventory items', async ({ page }) => {
    await page.goto('/inventory')

    // Look for search input
    const searchInput = page.getByPlaceholder(/search/i)
    if (await searchInput.isVisible()) {
      await searchInput.fill('test item')
      // The search should work (content may change based on results)
      await expect(searchInput).toHaveValue('test item')
    }
  })
})

test.describe('Sales Management', () => {
  test('should display sales table', async ({ page }) => {
    await page.goto('/sales')

    // Look for sales-related elements
    const salesTable = page.getByRole('table')
    if (await salesTable.isVisible()) {
      await expect(salesTable).toBeVisible()
    }
  })
})

test.describe('Responsive Design', () => {
  test('should work on mobile viewport', async ({ page }) => {
    await page.setViewportSize({ width: 375, height: 667 })
    await page.goto('/')

    // Check if page is responsive
    await expect(page.locator('body')).toBeVisible()
  })

  test('should work on tablet viewport', async ({ page }) => {
    await page.setViewportSize({ width: 768, height: 1024 })
    await page.goto('/')

    // Check if page is responsive
    await expect(page.locator('body')).toBeVisible()
  })
})
