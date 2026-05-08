import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

const TABS_PATH = '/animations/components/tabs/'

test.describe('tabs demo page', () => {
  test('lib initializes with tabs feature and ScrollTrigger plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*tabs/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
  })

  test('FAQ accordion: clicking toggle expands content and flips aria-expanded', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const faq = page.locator('.aa-tabs-faq').first()
    const firstToggle = faq.locator('[aa-tabs-toggle]').first()
    const firstContent = faq.locator('[aa-tabs-content]').first()

    // Initial state: closed.
    expect(await firstToggle.getAttribute('aria-expanded')).toBe('false')
    const initialHeight = await firstContent.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    )
    expect(initialHeight).toBeLessThanOrEqual(1)

    await firstToggle.click()
    await page.waitForTimeout(700)

    expect(await firstToggle.getAttribute('aria-expanded')).toBe('true')
    const openHeight = await firstContent.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    )
    expect(openHeight).toBeGreaterThan(20)
  })

  test('default mode: clicking active toggle closes it', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const faq = page.locator('.aa-tabs-faq').first()
    const firstToggle = faq.locator('[aa-tabs-toggle]').first()
    const firstContent = faq.locator('[aa-tabs-content]').first()

    await firstToggle.click()
    await page.waitForTimeout(700)
    expect(await firstToggle.getAttribute('aria-expanded')).toBe('true')

    await firstToggle.click()
    await page.waitForTimeout(700)
    expect(await firstToggle.getAttribute('aria-expanded')).toBe('false')
    const closedHeight = await firstContent.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    )
    expect(closedHeight).toBeLessThanOrEqual(1)
  })

  test('single mode: aa-tabs-initial opens at init; clicking active does nothing', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    // Single-mode demo is the second .aa-tabs-faq on the page.
    const single = page.locator('.aa-tabs-faq').nth(1)
    const initialToggle = single.locator('[aa-tabs-toggle="a"]')

    expect(await initialToggle.getAttribute('aria-expanded')).toBe('true')

    await initialToggle.click()
    await page.waitForTimeout(500)
    // Still open — single mode forbids closing the active one.
    expect(await initialToggle.getAttribute('aria-expanded')).toBe('true')

    // Clicking another toggle switches the active.
    await single.locator('[aa-tabs-toggle="b"]').click()
    await page.waitForTimeout(700)
    expect(await initialToggle.getAttribute('aria-expanded')).toBe('false')
    expect(await single.locator('[aa-tabs-toggle="b"]').getAttribute('aria-expanded')).toBe('true')
  })

  test('tab interface: visual-only set gets role=tab + role=tabpanel + parent role=tablist', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const tabset = page.locator('.aa-tabs-tabset').first()
    const tablist = tabset.locator('.aa-tabs-tablist')
    expect(await tablist.getAttribute('role')).toBe('tablist')

    const firstTab = tablist.locator('[aa-tabs-toggle]').first()
    expect(await firstTab.getAttribute('role')).toBe('tab')
    expect(await firstTab.getAttribute('aria-selected')).toBe('true')

    const firstPanel = tabset.locator('[aa-tabs-visual]').first()
    expect(await firstPanel.getAttribute('role')).toBe('tabpanel')
  })

  test('inner aa-animate inside aa-tabs-visual plays on tab-active and reverses on tab-inactive', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const tabset = page.locator('.aa-tabs-tabset').first()
    const designPanel = tabset.locator('[aa-tabs-visual="design"]')
    const devPanel = tabset.locator('[aa-tabs-visual="dev"]')

    // Initial active panel's first heading line should be near full opacity.
    const designLine = designPanel.locator('h3 .aa-line').first()
    await page.waitForTimeout(900)
    const designOpacity = parseFloat(
      await designLine.evaluate((el) => getComputedStyle(el as HTMLElement).opacity),
    )
    expect(designOpacity).toBeGreaterThan(0.85)

    // Switch to a different tab; old panel reverses, new one plays.
    await tabset.locator('[aa-tabs-toggle="dev"]').click()
    await page.waitForTimeout(900)

    const designOpacityReversed = parseFloat(
      await designLine.evaluate((el) => getComputedStyle(el as HTMLElement).opacity),
    )
    expect(designOpacityReversed).toBeLessThan(0.5)

    const devLine = devPanel.locator('h3 .aa-line').first()
    const devOpacity = parseFloat(
      await devLine.evaluate((el) => getComputedStyle(el as HTMLElement).opacity),
    )
    expect(devOpacity).toBeGreaterThan(0.85)
  })

  test('Enter key on focused toggle activates it; ArrowDown shifts focus', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const faq = page.locator('.aa-tabs-faq').first()
    const toggles = faq.locator('[aa-tabs-toggle]')

    const firstToggle = toggles.first()
    await firstToggle.focus()
    await firstToggle.press('Enter')
    await page.waitForTimeout(700)
    expect(await firstToggle.getAttribute('aria-expanded')).toBe('true')

    // ArrowDown moves focus to the second toggle.
    await firstToggle.press('ArrowDown')
    const focusedId = await page.evaluate(() => document.activeElement?.getAttribute('aa-tabs-toggle') ?? '')
    expect(focusedId).toBe(await toggles.nth(1).getAttribute('aa-tabs-toggle'))
  })

  test('autoplay: progress bar fills mid-dwell on first tab when in view', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog

    const autoplay = page.locator('.aa-tabs-tabset').nth(1)
    await autoplay.scrollIntoViewIfNeeded()
    // Dwell is 3s — sample at ~1.5s after autoplay starts.
    await page.waitForTimeout(1500)

    const progress = autoplay
      .locator('[aa-tabs-toggle="auto-1"] [aa-tabs-progress]')
      .first()
    const widthPct = await progress.evaluate((el) => {
      const w = parseFloat(getComputedStyle(el as HTMLElement).width)
      const parent = (el as HTMLElement).parentElement
      const parentWidth = parent ? parseFloat(getComputedStyle(parent).width) : 0
      return parentWidth ? (w / parentWidth) * 100 : 0
    })
    expect(widthPct).toBeGreaterThan(5)
    expect(widthPct).toBeLessThan(95)
  })

  test('content height regression: nested children retain natural size mid-close', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(TABS_PATH)
    await initLog
    await page.waitForTimeout(300)

    const faq = page.locator('.aa-tabs-faq').first()
    const toggle = faq.locator('[aa-tabs-toggle]').first()
    const content = faq.locator('[aa-tabs-content]').first()
    // The <p> inside the body — its height should never collapse to 0
    // during the close animation. (This is the v7 grid-template-rows bug.)
    const innerP = content.locator('p').first()

    await toggle.click()
    await page.waitForTimeout(700)
    const fullyOpenInnerHeight = await innerP.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    )
    expect(fullyOpenInnerHeight).toBeGreaterThan(8)

    // Start closing; sample mid-close (duration ~0.5s — sample at 0.2s).
    await toggle.click()
    await page.waitForTimeout(200)
    const midCloseInnerHeight = await innerP.evaluate(
      (el) => (el as HTMLElement).getBoundingClientRect().height,
    )
    // Inner element keeps its natural height — wrapper clips via overflow.
    expect(midCloseInnerHeight).toBeGreaterThan(8)
  })
})
