import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('text-blur demo page', () => {
  test('lib initializes with text feature and SplitText plugin', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*text/)
    expect(initLine).toMatch(/Plugins:.*ScrollTrigger/)
    expect(initLine).toMatch(/Plugins:.*SplitText/)
  })

  test('animation plays — chars become visible after scroll', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    const heading = page.locator('h1[aa-animate="text-blur"]').first()
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(1500)

    const visibleParts = await heading.evaluate((el) => {
      const parts = el.querySelectorAll('.aa-char, .aa-word')
      let visible = 0
      parts.forEach((p) => {
        const cs = getComputedStyle(p as HTMLElement)
        if (parseFloat(cs.opacity) > 0.9) visible++
      })
      return { total: parts.length, visible }
    })
    expect(visibleParts.total).toBeGreaterThan(0)
    expect(visibleParts.visible).toBeGreaterThan(0)
  })

  // Regression: char-split keeps word wrappers so words stay atomic and can't
  // break mid-word (a Safari-only symptom). The break doesn't reproduce in
  // Chromium, so we assert the structural guarantee: every char sits in a word.
  test('char split wraps every char in an atomic .aa-word', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/text/text-blur/')
    await initLog

    const heading = page.locator('h1[aa-animate="text-blur"]').first()
    const structure = await heading.evaluate((el) => {
      const chars = [...el.querySelectorAll('.aa-char')]
      const words = [...el.querySelectorAll('.aa-word')]
      const orphanChars = chars.filter((c) => !c.closest('.aa-word')).length
      const wordDisplay = words[0] ? getComputedStyle(words[0] as HTMLElement).display : null
      return { charCount: chars.length, wordCount: words.length, orphanChars, wordDisplay }
    })
    expect(structure.charCount).toBeGreaterThan(0)
    expect(structure.wordCount).toBeGreaterThan(0)
    expect(structure.orphanChars).toBe(0)
    expect(structure.wordDisplay).toBe('inline-block')
  })
})
