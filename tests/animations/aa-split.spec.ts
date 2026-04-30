import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('split demo page', () => {
  test('lib initializes with split feature and produces .aa-word children', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-split/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*split/)

    const wordCount = await page.locator('.split-demo .aa-word').count()
    expect(wordCount).toBeGreaterThanOrEqual(5)
  })
})
