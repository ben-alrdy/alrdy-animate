import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('class presets', () => {
  test('lib initializes and presets contribute the right feature set', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/initialization/presets/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:/)
    // text-fade-up + text-blur-up → text feature; fade-up (cta-card) → scroll feature.
    expect(initLine).toMatch(/text/)
    expect(initLine).toMatch(/scroll/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/SplitText/)
  })

  test('preset elements have no aa-* attributes in the DOM', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/initialization/presets/')
    await initLog

    // First demo block — every preset target must be free of aa-* attributes.
    // The second demo intentionally has aa-animate on the override h2; only
    // assert about the first .heading-style-h2 (in the first PresetsDemo).
    const presetElementAttrs = await page.evaluate(() => {
      const out: string[][] = []
      // Pick elements known to be preset-only (no explicit aa-*).
      const selectors = [
        '[data-presets-demo] .heading-style-h2:not([aa-animate])',
        '[data-presets-demo] .heading-style-h3',
        '[data-presets-demo] .cta-card',
      ]
      for (const sel of selectors) {
        for (const el of document.querySelectorAll(sel)) {
          out.push([...el.attributes].map((a) => a.name))
        }
      }
      return out
    })
    expect(presetElementAttrs.length).toBeGreaterThan(0)
    for (const attrs of presetElementAttrs) {
      const aaAttrs = attrs.filter((n) => n.startsWith('aa-'))
      expect(aaAttrs).toEqual([])
    }
  })

  test('preset element animates when scrolled into view', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/initialization/presets/')
    await initLog

    const card = page
      .locator('[data-presets-demo] .cta-card')
      .first()
    await card.scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)
    const opacity = await card.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeGreaterThan(0.95)
  })

  test('explicit aa-* attribute overrides the preset', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/initialization/presets/')
    await initLog

    // The override demo has an h2 with class heading-style-h2 AND aa-animate="fade-right".
    // The preset would have given it text-fade-up (a text feature). Because of the
    // override rule, it should be driven by aa-animate="fade-right" instead — a
    // scroll feature. Easiest signal: it must still have its explicit attribute.
    const overrideAttr = await page.evaluate(() => {
      const el = document.querySelector(
        '[data-presets-demo] .heading-style-h2[aa-animate]',
      )
      return el?.getAttribute('aa-animate') ?? null
    })
    expect(overrideAttr).toBe('fade-right')

    const override = page.locator('[data-presets-demo] .heading-style-h2[aa-animate]')
    await override.scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)
    const opacity = await override.evaluate((el) => getComputedStyle(el).opacity)
    expect(parseFloat(opacity)).toBeGreaterThan(0.95)
  })

  test('reduced motion collapses preset animations to a plain fade', async ({ browser }) => {
    const ctx = await browser.newContext({ reducedMotion: 'reduce' })
    const page = await ctx.newPage()
    try {
      const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
      await page.goto('/initialization/presets/')
      await initLog

      const card = page.locator('[data-presets-demo] .cta-card').first()
      await card.scrollIntoViewIfNeeded()
      await page.waitForTimeout(900)

      const result = await card.evaluate((el) => ({
        opacity: getComputedStyle(el).opacity,
        // Under reduced motion, the fade-fallback pass only tweens opacity —
        // no transform. We can detect that no translate was applied.
        transform: getComputedStyle(el).transform,
      }))
      expect(parseFloat(result.opacity)).toBeGreaterThan(0.95)
      // The fade-fallback path does not write any transform onto the element.
      expect(result.transform === 'none' || result.transform === 'matrix(1, 0, 0, 1, 0, 0)').toBe(
        true,
      )
    } finally {
      await page.close()
      await ctx.close()
    }
  })
})
