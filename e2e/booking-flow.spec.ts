import { test, expect } from '@playwright/test'

test.describe('Booking flow', () => {
  test('vehicle card links to detail page', async ({ page }) => {
    await page.goto('/')
    // Wait for vehicles to load
    const firstCard = page.locator('[href^="/vehicles/"]').first()
    await expect(firstCard).toBeVisible({ timeout: 10_000 })
    await firstCard.click()
    await expect(page.url()).toContain('/vehicles/')
  })

  test('vehicle detail page has Book Now button', async ({ page }) => {
    await page.goto('/')
    const firstCard = page.locator('[href^="/vehicles/"]').first()
    await firstCard.click()
    await expect(page.getByRole('link', { name: /book now/i })).toBeVisible({ timeout: 10_000 })
  })

  test('unauthenticated user redirected to login from /account', async ({ page }) => {
    await page.goto('/account/bookings')
    await expect(page.url()).toContain('/auth/login')
  })
})
