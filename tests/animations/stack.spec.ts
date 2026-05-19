import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('stack demo page', () => {
  test('lib initializes with stack feature and ScrollTrigger plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*stack/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('cards are sticky-positioned via the shipped helper rule', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    const firstCard = page.locator('[aa-stack-card]').first()
    const position = await firstCard.evaluate(
      (el) => getComputedStyle(el as HTMLElement).position,
    )
    expect(position).toBe('sticky')
  })

  test('z-index ladder places earlier cards on top', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    const cards = page.locator('[aa-stack-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const zIndices = await cards.evaluateAll((els) =>
      els.map((el) => parseInt(getComputedStyle(el as HTMLElement).zIndex || '0', 10)),
    )
    // First card highest, last card lowest, strictly decreasing.
    for (let i = 1; i < zIndices.length; i++) {
      expect(zIndices[i]).toBeLessThan(zIndices[i - 1])
    }
  })

  test('card-active event fires when a card scrolls into view; nested fade-up plays', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // Capture every card-active dispatch with its target card index.
    const events = await page.evaluateHandle(() => {
      const log: number[] = []
      const cards = Array.from(document.querySelectorAll('[aa-stack-card]'))
      document.addEventListener('aa:trigger', (e) => {
        const detail = (e as CustomEvent).detail as { name?: string }
        if (detail?.name !== 'card-active') return
        const idx = cards.indexOf(e.target as Element)
        if (idx !== -1) log.push(idx)
      })
      ;(window as unknown as { __cardEvents: number[] }).__cardEvents = log
      return log
    })

    // Scroll the first stack card into view; expect card-active to fire on it
    // and its first fade-up child to play.
    const firstCard = page.locator('[aa-stack-card]').first()
    await firstCard.scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)

    const fired = await page.evaluate(
      () => (window as unknown as { __cardEvents: number[] }).__cardEvents,
    )
    expect(fired).toContain(0)

    const headlineOpacity = await firstCard
      .locator('h3')
      .first()
      .evaluate((el) => parseFloat(getComputedStyle(el as HTMLElement).opacity))
    expect(headlineOpacity).toBeGreaterThan(0.85)

    void events // hold reference so the handle isn't GC'd before reads finish
  })

  test('descendant aa-animate inside a card uses the inferred event trigger', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // Before scrolling, the child should be paused at the from-state (opacity 0).
    const secondCardHeading = page.locator('[aa-stack-card]').nth(1).locator('h3').first()
    const initialOpacity = await secondCardHeading.evaluate(
      (el) => parseFloat(getComputedStyle(el as HTMLElement).opacity),
    )
    expect(initialOpacity).toBeLessThan(0.2)

    // Scroll until the second card crosses scroll-start, then assert it plays.
    await page.locator('[aa-stack-card]').nth(1).scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)

    const playedOpacity = await secondCardHeading.evaluate(
      (el) => parseFloat(getComputedStyle(el as HTMLElement).opacity),
    )
    expect(playedOpacity).toBeGreaterThan(0.85)
  })
})
