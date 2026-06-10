import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

async function readTrackX(locator: import('@playwright/test').Locator): Promise<number> {
  return locator.evaluate((el) => {
    const t = (el as HTMLElement).style.transform
    const m = t.match(/translate3d\(([-\d.]+)px/) ?? t.match(/translateX\(([-\d.]+)px/) ?? null
    if (m) return parseFloat(m[1])
    // Fall back to the computed matrix when GSAP is in matrix-3d mode.
    const cs = getComputedStyle(el as HTMLElement).transform
    const mm = cs.match(/matrix3d?\(([-\d.,\s]+)\)/)
    if (!mm) return 0
    const parts = mm[1].split(',').map((s) => parseFloat(s.trim()))
    // matrix3d's tx is index 12; matrix's tx is index 4.
    return parts.length === 16 ? parts[12] : parts[4]
  })
}

test.describe('marquee demo page', () => {
  test('lib initializes with marquee feature and the right plugins', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/marquee/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*marquee/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*Draggable/)
    expect(initLine).toMatch(/Plugins:.*InertiaPlugin/)
  })

  test('list gets cloned to fill the viewport', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/marquee/')
    await initLog
    await page.waitForTimeout(300)

    const firstTrack = page.locator('[aa-marquee-track]').first()
    const lists = firstTrack.locator('[aa-marquee-list]')
    const count = await lists.count()
    expect(count).toBeGreaterThanOrEqual(2)

    // Every list after the first should be marked as a clone and aria-hidden.
    const cloneAttr = await lists.nth(1).getAttribute('aa-marquee-clone')
    expect(cloneAttr).not.toBeNull()
    const ariaHidden = await lists.nth(1).getAttribute('aria-hidden')
    expect(ariaHidden).toBe('true')
  })

  test('first marquee animates the track translation over time', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/marquee/')
    await initLog

    const firstMarquee = page.locator('[aa-marquee]').first()
    await firstMarquee.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)

    const track = firstMarquee.locator('[aa-marquee-track]')
    const x1 = await readTrackX(track)
    await page.waitForTimeout(700)
    const x2 = await readTrackX(track)

    // Direction = left (default) → x decreases over time. Wrapping can land
    // it back near 0, but consecutive 700ms samples should not be identical.
    expect(Math.abs(x2 - x1)).toBeGreaterThan(2)
  })

  test('right-direction marquee initializes with aa-marquee-direction="right"', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/marquee/')
    await initLog
    await page.waitForTimeout(200)

    const rightMarquee = page.locator('[aa-marquee~="right"]').first()
    expect(await rightMarquee.getAttribute('aa-marquee-direction')).toBe('right')
  })

  test('hover-pause stops translation under the cursor', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/marquee/')
    await initLog

    // The "right hover-pause" demo is the second one on the page.
    const hoverMarquee = page.locator('[aa-marquee~="hover-pause"]').first()
    await hoverMarquee.scrollIntoViewIfNeeded()
    await page.waitForTimeout(300)

    const track = hoverMarquee.locator('[aa-marquee-track]')

    // Hover and confirm the track stops moving across two samples. toPass
    // retries the whole sample-pair so a starved rAF window can't false-fail.
    await hoverMarquee.hover()
    await expect(async () => {
      const xA = await readTrackX(track)
      await page.waitForTimeout(250)
      const xB = await readTrackX(track)
      expect(Math.abs(xB - xA)).toBeLessThan(1.5)
    }).toPass({ timeout: 5000 })

    // Move the pointer away and the loop should resume.
    await page.mouse.move(0, 0)
    await expect(async () => {
      const xC = await readTrackX(track)
      await page.waitForTimeout(250)
      const xD = await readTrackX(track)
      expect(Math.abs(xD - xC)).toBeGreaterThan(2)
    }).toPass({ timeout: 5000 })
  })
})
