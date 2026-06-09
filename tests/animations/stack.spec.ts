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

  test('perspective exit lifts the last card to cover the receded card behind it', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // The "rotate entrance + perspective exit" demo carries aa-stack-out
    // including `perspective`. That preset is the one that gives the LAST card a
    // cover finisher — it rises at the end of the stack so it overlays the
    // receded card behind it instead of leaving a gap. The cover lift is half
    // the perspective out lift = `3.5%` of the card's height, and the runway for
    // it is added as the last card's own margin-bottom (so it never clobbers the
    // author's root padding).
    const result = await page.evaluate(() => {
      const persp = Array.from(document.querySelectorAll<HTMLElement>('[aa-stack]')).find((s) =>
        (s.getAttribute('aa-stack-out') ?? '').includes('perspective'),
      )
      if (!persp) return { found: false } as const
      const cards = Array.from(persp.querySelectorAll<HTMLElement>('[aa-stack-card]'))
      const last = cards[cards.length - 1]
      const expectedLift = (last.offsetHeight * 3.5) / 100
      // Margin runway is computed px from offsetHeight.
      const marginBottom = parseFloat(getComputedStyle(last).marginBottom) || 0
      // Root padding must stay untouched (author-owned, often responsive vh).
      const rootInlinePad = persp.style.paddingBottom
      return { found: true, expectedLift, marginBottom, rootInlinePad } as const
    })
    expect(result.found).toBe(true)
    if (!result.found) return
    // The margin runway equals the lift distance, proving the cover path armed.
    expect(result.marginBottom).toBeGreaterThan(0)
    expect(Math.abs(result.marginBottom - result.expectedLift)).toBeLessThan(0.5)
    // The author's root padding is never overwritten with an absolute px.
    expect(result.rootInlinePad).toBe('')

    // Scroll to the very end of the perspective stack and assert the last card
    // has a negative translateY applied (the cover lift), which it never had
    // before — previously the last card held its settled state untouched.
    const translateY = await page.evaluate(async () => {
      const persp = Array.from(document.querySelectorAll<HTMLElement>('[aa-stack]')).find((s) =>
        (s.getAttribute('aa-stack-out') ?? '').includes('perspective'),
      )!
      const cards = Array.from(persp.querySelectorAll<HTMLElement>('[aa-stack-card]'))
      const last = cards[cards.length - 1]
      const first = cards[0]
      const stickyTop = parseFloat(getComputedStyle(first).top) || 0
      const lockPoint = last.getBoundingClientRect().top + window.scrollY - stickyTop
      const lift = (last.offsetHeight * 3.5) / 100
      const w = window as unknown as {
        lenis?: { scrollTo: (y: number, o?: object) => void }
        ScrollTrigger?: { update: () => void }
      }
      // Scroll comfortably past the lift window so the tween reaches its end.
      if (w.lenis) w.lenis.scrollTo(lockPoint + lift + 40, { immediate: true })
      else window.scrollTo(0, lockPoint + lift + 40)
      await new Promise((r) => setTimeout(r, 150))
      w.ScrollTrigger?.update()
      await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
      return new DOMMatrixReadOnly(getComputedStyle(last).transform).m42
    })
    expect(translateY).toBeLessThan(-1)
  })

  test('stack-in fade completes at the midpoint of the entry travel, not at lock', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    // The responsive demo (#aa-stack-responsive) is `aa-stack-in="fade"`, active
    // at desktop width. The card's own opacity should reach 1 by the halfway
    // point between entry-start and lock — and still be mid-fade at a quarter.
    const result = await page.evaluate(async () => {
      const sec = document.getElementById('aa-stack-responsive')!
      const cards = Array.from(sec.querySelectorAll<HTMLElement>('[aa-stack-card]'))
      const card = cards[1]
      const stickyTop = parseFloat(getComputedStyle(cards[0]).top) || 0
      const naturalTop = card.getBoundingClientRect().top + window.scrollY
      const entryStart = naturalTop - window.innerHeight
      const lockPoint = naturalTop - stickyTop
      const w = window as unknown as {
        lenis?: { scrollTo: (y: number, o?: object) => void }
        ScrollTrigger?: { update: () => void }
      }
      const opacityAt = async (frac: number): Promise<number> => {
        const y = entryStart + (lockPoint - entryStart) * frac
        if (w.lenis) w.lenis.scrollTo(y, { immediate: true })
        else window.scrollTo(0, y)
        await new Promise((r) => setTimeout(r, 120))
        w.ScrollTrigger?.update()
        await new Promise((r) => requestAnimationFrame(() => requestAnimationFrame(r)))
        return parseFloat(getComputedStyle(card).opacity)
      }
      return { quarter: await opacityAt(0.25), mid: await opacityAt(0.5) }
    })
    // Mid-fade at the quarter point, fully opaque by the midpoint.
    expect(result.quarter).toBeGreaterThan(0)
    expect(result.quarter).toBeLessThan(1)
    expect(result.mid).toBeGreaterThan(0.99)
  })

  test('below md (aa-stack="|none") in-card animations fall back to scroll, not the never-emitted card-active', async ({ page }) => {
    // Mobile width: the responsive demo's `aa-stack="|none"` disables the stack
    // JS here, so it never emits `card-active`. The in-card text-fade-up must
    // infer `scroll` instead and play on scroll — the regression being that it
    // used to inherit `card-active` and sit paused at opacity:0 forever.
    await page.setViewportSize({ width: 390, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/components/stack/')
    await initLog
    await page.waitForTimeout(300)

    const section = page.locator('#aa-stack-responsive')
    const headline = section.locator('[aa-stack-card]').first().locator('h3').first()

    // Start a recorder for any card-active dispatched within this section.
    await page.evaluate(() => {
      const sec = document.getElementById('aa-stack-responsive')
      const w = window as unknown as { __respCardActive: boolean }
      w.__respCardActive = false
      document.addEventListener('aa:trigger', (e) => {
        const d = (e as CustomEvent).detail as { name?: string }
        if (d?.name === 'card-active' && sec?.contains(e.target as Node)) w.__respCardActive = true
      })
    })

    // Paused at opacity:0 before scrolling (split lines carry the from-state).
    const initialHidden = await headline.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line, .aa-word, .aa-char')
      let hidden = 0
      lines.forEach((l) => {
        if (parseFloat(getComputedStyle(l as HTMLElement).opacity) < 0.2) hidden++
      })
      return { total: lines.length, hidden }
    })
    expect(initialHidden.total).toBeGreaterThan(0)
    expect(initialHidden.hidden).toBe(initialHidden.total)

    await section.locator('[aa-stack-card]').first().scrollIntoViewIfNeeded()
    await page.waitForTimeout(900)

    const played = await headline.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line, .aa-word, .aa-char')
      let visible = 0
      lines.forEach((l) => {
        if (parseFloat(getComputedStyle(l as HTMLElement).opacity) > 0.85) visible++
      })
      return { total: lines.length, visible }
    })
    expect(played.visible).toBe(played.total)

    // It played via scroll, not via a card-active event (which never fires here).
    const sawCardActive = await page.evaluate(
      () => (window as unknown as { __respCardActive: boolean }).__respCardActive,
    )
    expect(sawCardActive).toBe(false)
  })
})
