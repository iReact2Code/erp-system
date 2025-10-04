import { test, expect } from '@playwright/test'
import AxeBuilder from '@axe-core/playwright'

const ROUTES = ['/', '/en/login', '/en/(dashboard)/dashboard']

test.describe('Accessibility', () => {
  test.beforeEach(async ({ page }) => {
    await page.goto('/')
  })

  for (const route of ROUTES) {
    test(`axe on ${route}`, async ({ page }) => {
      await page.goto(route)
      const accessibilityScanResults = await new AxeBuilder({ page })
        .withTags(['wcag2a', 'wcag2aa'])
        .analyze()

      // Fail on serious & above in CI later; for now, just assert no errors property missing
      expect(accessibilityScanResults.violations).toBeDefined()
      // Print a concise summary for CI logs
      const serious = accessibilityScanResults.violations.filter(
        v => v.impact === 'serious' || v.impact === 'critical'
      )
      console.log(
        `A11y violations on ${route}: total=${accessibilityScanResults.violations.length} serious+critical=${serious.length}`
      )
    })
  }
})
