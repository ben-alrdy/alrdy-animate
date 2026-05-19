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

  test('z-index ladder places later cards on top within a stack', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // The docs page mounts multiple [aa-stack] sections; each gets its own
    // independent z-index ladder (1, 2, 3, …) starting from 1. Scope to the
    // first stack so the assertion is deterministic regardless of how many
    // demos the page hosts.
    const cards = page.locator('[aa-stack]').first().locator('[aa-stack-card]')
    const count = await cards.count()
    expect(count).toBeGreaterThanOrEqual(3)

    const zIndices = await cards.evaluateAll((els) =>
      els.map((el) => parseInt(getComputedStyle(el as HTMLElement).zIndex || '0', 10)),
    )
    // First card lowest, last card highest, strictly increasing — each new
    // card overlays the previously-locked one as it slides into view.
    for (let i = 1; i < zIndices.length; i++) {
      expect(zIndices[i]).toBeGreaterThan(zIndices[i - 1])
    }
  })

  test('card-active event fires when a card scrolls into view; nested text-fade-up plays', async ({ page }) => {
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
    // and its first text-fade-up child to play. The animation is split-text-
    // based — opacity is animated on the `.aa-line` spans, not the <h3> itself
    // (the parent h3 stays opacity:1 throughout), so we query the spans.
    const firstCard = page.locator('[aa-stack-card]').first()
    await firstCard.scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)

    const fired = await page.evaluate(
      () => (window as unknown as { __cardEvents: number[] }).__cardEvents,
    )
    expect(fired).toContain(0)

    const visibleLines = await firstCard.locator('h3').first().evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line, .aa-word, .aa-char')
      let visible = 0
      lines.forEach((l) => {
        if (parseFloat(getComputedStyle(l as HTMLElement).opacity) > 0.85) visible++
      })
      return { total: lines.length, visible }
    })
    expect(visibleLines.total).toBeGreaterThan(0)
    expect(visibleLines.visible).toBe(visibleLines.total)

    void events // hold reference so the handle isn't GC'd before reads finish
  })

  test('descendant aa-animate inside a card uses the inferred event trigger', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // The second card's headline is `text-fade-up` + `aa-split="lines mask"` —
    // the split runtime applies the from-state (opacity:0) to each `.aa-line`
    // span, not the parent <h3>. Querying the h3 directly would always read
    // opacity:1 since the parent never animates.
    const secondCardLines = page.locator('[aa-stack-card]').nth(1).locator('h3').first()

    // Before scrolling, the split-line spans should be paused at opacity:0.
    const initialHidden = await secondCardLines.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line, .aa-word, .aa-char')
      let hidden = 0
      lines.forEach((l) => {
        if (parseFloat(getComputedStyle(l as HTMLElement).opacity) < 0.2) hidden++
      })
      return { total: lines.length, hidden }
    })
    expect(initialHidden.total).toBeGreaterThan(0)
    expect(initialHidden.hidden).toBe(initialHidden.total)

    // Scroll until the second card crosses scroll-start, then assert it plays.
    await page.locator('[aa-stack-card]').nth(1).scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)

    const played = await secondCardLines.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line, .aa-word, .aa-char')
      let visible = 0
      lines.forEach((l) => {
        if (parseFloat(getComputedStyle(l as HTMLElement).opacity) > 0.85) visible++
      })
      return { total: lines.length, visible }
    })
    expect(played.visible).toBe(played.total)
  })
})
