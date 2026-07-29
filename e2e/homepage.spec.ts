import { test, expect } from '@playwright/test'

test.describe('Homepage', () => {
  test('loads and shows vehicle search', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('RECI Transport')).toBeVisible()
    await expect(page.getByText('Available Vehicles')).toBeVisible()
  })

  test('AI search toggle visible', async ({ page }) => {
    await page.goto('/')
    await expect(page.getByText('AI Search')).toBeVisible()
    await expect(page.getByText('Filters')).toBeVisible()
  })

  test('switching to filters mode shows filter UI', async ({ page }) => {
    await page.goto('/')
    await page.getByText('Filters').click()
    // AdvancedFilterGrid should render
    await expect(page.locator('select, input[type="text"]').first()).toBeVisible()
  })

  test('cookie banner appears on first visit', async ({ page }) => {
    // Clear storage to simulate first visit
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    await expect(page.getByRole('dialog', { name: /cookie/i })).toBeVisible()
  })

  test('cookie banner disappears after accept', async ({ page }) => {
    await page.context().clearCookies()
    await page.evaluate(() => localStorage.clear())
    await page.goto('/')
    await page.getByRole('button', { name: 'Accept' }).click()
    await expect(page.getByRole('dialog', { name: /cookie/i })).not.toBeVisible()
  })

  test('privacy policy page loads', async ({ page }) => {
    await page.goto('/privacy')
    await expect(page.getByText('Privacy Policy')).toBeVisible()
    await expect(page.getByText('GDPR')).toBeVisible()
  })

  test('terms page loads', async ({ page }) => {
    await page.goto('/terms')
    await expect(page.getByText('Terms of Service')).toBeVisible()
  })
})
