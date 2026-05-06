import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-block demo page', () => {
  test('lib initializes with text feature and SplitText plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-block/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('animation plays — bar disappears and text becomes visible after scroll', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-block/')
    await initLog

    const heading = page.locator('h1[aa-animate="text-block-right"]').first()
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2000)

    const state = await heading.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line')
      const bars = el.querySelectorAll('.aa-bar')
      const texts = el.querySelectorAll('.aa-block-text')
      const visibleTexts = Array.from(texts).filter((t) => {
        const cs = getComputedStyle(t as HTMLElement)
        return parseFloat(cs.opacity) > 0.9
      }).length
      return {
        lines: lines.length,
        bars: bars.length,
        texts: texts.length,
        visibleTexts,
      }
    })

    expect(state.lines).toBeGreaterThan(0)
    expect(state.bars).toBe(state.lines)
    expect(state.texts).toBe(state.lines)
    expect(state.visibleTexts).toBe(state.texts)
  })

  test('shrink direction stays correct on second play (again-trigger reset)', async ({
    page,
  }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-block/')
    await initLog

    // For text-block-right, phase 2 must shrink with transformOrigin's x at
    // the right edge of the line wrapper (≈ line width). If GSAP fails to
    // restore transformOrigin on the second play, x stays at 0 (left edge)
    // and the bar collapses in the wrong direction.
    const heading = page.locator('h1[aa-animate="text-block-right"]').first()

    // First play.
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    // Trigger the again-trigger reset by scrolling well past the element,
    // then back. The reset point is element-top minus one viewport.
    await page.evaluate(() => window.scrollTo(0, document.body.scrollHeight))
    await page.waitForTimeout(700)
    await page.evaluate(() => window.scrollTo(0, 0))
    await page.waitForTimeout(700)

    // Second play: scroll back into view, sample mid-shrink (around
    // revealDur + shrinkDur/2 = 0.7s into a 1s timeline).
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(700)

    const sample = await heading.evaluate((el) => {
      const bar = el.querySelector('.aa-bar') as HTMLElement | null
      if (!bar) return null
      const cs = getComputedStyle(bar)
      const m = new DOMMatrix(cs.transform)
      const lineRect = (bar.parentElement as HTMLElement).getBoundingClientRect()
      const [originX] = cs.transformOrigin.split(' ').map(parseFloat)
      return {
        scaleX: m.a,
        originX,
        lineWidth: lineRect.width,
      }
    })
    expect(sample).not.toBeNull()
    // Bar mid-shrink should be partially scaled and origin should be at the
    // right edge (x ≈ line width), not x ≈ 0.
    expect(sample!.scaleX).toBeGreaterThan(0)
    expect(sample!.scaleX).toBeLessThan(1)
    expect(sample!.originX).toBeGreaterThan(sample!.lineWidth * 0.9)
  })

  test('aa-color attribute applies to the bar', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-block/')
    await initLog

    const colored = page.locator('h1[aa-color="#C700EF"]').first()
    await colored.scrollIntoViewIfNeeded()
    await page.waitForTimeout(200)

    const barColor = await colored.evaluate((el) => {
      const bar = el.querySelector('.aa-bar') as HTMLElement | null
      return bar?.style.backgroundColor ?? null
    })
    // Browsers normalise inline #C700EF → rgb(199, 0, 239).
    expect(barColor).toMatch(/rgb\(\s*199,\s*0,\s*239\s*\)|#C700EF/i)
  })
})
