import { expect, test, type ConsoleMessage } from '@playwright/test'
import { opacityOf } from '../helpers'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('aa-again utility page', () => {
  test('lib initializes with appear feature + ScrollTrigger', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-again/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*appear/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('aa-again="false" plays once; default resets and replays', async ({ page }) => {
    // Short viewport so the demo can stay compact: the "again" reset point is
    // element-top minus one viewport, so a shorter viewport keeps it reachable
    // by scrolling to the top without padding the page with tall spacers.
    await page.setViewportSize({ width: 1280, height: 500 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-again/')
    await initLog

    const def = page.locator('#again-default')
    const once = page.locator('#again-once')

    // 1. Scroll both cards into view — both fade-up to full opacity.
    await once.scrollIntoViewIfNeeded()
    await expect.poll(() => opacityOf(def), { timeout: 4000 }).toBeGreaterThan(0.9)
    await expect.poll(() => opacityOf(once), { timeout: 4000 }).toBeGreaterThan(0.9)

    // 2. Scroll well past, then back to the top. The "again" reset point is
    //    element-top minus one viewport, so returning to the top drops both
    //    cards a full viewport below — firing onLeaveBack for the default card
    //    (again: true) but not for the aa-again="false" card.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(600)
    await page.evaluate(() => window.scrollTo(0, 0))

    // 3. Default resets to its from-state (opacity 0); aa-again="false" stays put.
    await expect.poll(() => opacityOf(def), { timeout: 4000 }).toBeLessThan(0.1)
    await expect.poll(() => opacityOf(once), { timeout: 2000 }).toBeGreaterThan(0.9)

    // 4. Scroll back down — the default card replays, the once card is unchanged.
    await once.scrollIntoViewIfNeeded()
    await expect.poll(() => opacityOf(def), { timeout: 4000 }).toBeGreaterThan(0.9)
    await expect.poll(() => opacityOf(once), { timeout: 2000 }).toBeGreaterThan(0.9)
  })
})
