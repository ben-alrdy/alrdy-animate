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
    expect(initLine).toMatch(/Plugins:.*SplitText/)

    const wordCount = await page.locator('.split-demo .aa-word').count()
    expect(wordCount).toBeGreaterThanOrEqual(5)
  })

  test('lines + mask produces clipped wrappers', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-split/')
    await initLog

    const heading = page.locator('h2.split-mask-demo')
    await expect(heading).toBeVisible()
    await expect(heading.locator('.aa-line')).not.toHaveCount(0, { timeout: 5000 })

    const sample = await heading.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line')
      const masks = el.querySelectorAll('.aa-line-mask')
      const firstMask = masks[0] as HTMLElement | undefined
      return {
        lineCount: lines.length,
        maskCount: masks.length,
        overflow: firstMask ? getComputedStyle(firstMask).overflow : null,
      }
    })
    expect(sample.lineCount).toBeGreaterThan(0)
    expect(sample.maskCount).toBe(sample.lineCount)
    // SplitText sets overflow: clip on the mask wrapper.
    expect(sample.overflow).toMatch(/clip|hidden/)
  })

  test('split target with a focusable descendant is not aria-hidden (keeps the link reachable)', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-split/')
    await initLog

    const result = await page.evaluate(async () => {
      const host = document.createElement('div')
      host.id = 'aa-a11y-fixture'
      host.innerHTML =
        '<p id="fx-link" aa-animate="text-slide-up" aa-split="lines">Read more in our <a href="https://example.com">help center</a> for details.</p>' +
        '<p id="fx-plain" aa-animate="text-slide-up" aa-split="lines">A plain paragraph with no interactive content.</p>'
      document.querySelector('main')?.appendChild(host)

      await (window as unknown as { AlrdyAnimate: { refresh: () => Promise<void> } }).AlrdyAnimate.refresh()
      await new Promise((r) => setTimeout(r, 300))

      const linkP = document.getElementById('fx-link') as HTMLElement
      const plainP = document.getElementById('fx-plain') as HTMLElement
      const link = linkP.querySelector('a') as HTMLAnchorElement

      return {
        // Focusable-descendant path: left in the accessibility tree.
        linkParagraphAriaHidden: linkP.getAttribute('aria-hidden'),
        linkParagraphSplit: linkP.querySelectorAll('.aa-line').length,
        linkInsideAriaHidden: !!link.closest('[aria-hidden="true"]'),
        linkTabbable: link.getAttribute('tabindex') !== '-1',
        // Plain-prose path: unchanged (hidden + sr-only clone).
        plainParagraphAriaHidden: plainP.getAttribute('aria-hidden'),
        plainCloneInserted:
          plainP.previousElementSibling?.classList.contains('aa-sr-only') ?? false,
      }
    })

    expect(result.linkParagraphAriaHidden).toBeNull()
    expect(result.linkParagraphSplit).toBeGreaterThan(0)
    expect(result.linkInsideAriaHidden).toBe(false)
    expect(result.linkTabbable).toBe(true)
    // Prose without interactive content still uses the hide + sr-only-clone path.
    expect(result.plainParagraphAriaHidden).toBe('true')
    expect(result.plainCloneInserted).toBe(true)
  })

  test('lines-chars produces both .aa-line and .aa-char and lines settle to opacity 1', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/utilities/aa-split/')
    await initLog

    const heading = page
      .locator('h2.split-fade-h[aa-split="lines-chars"]')
      .first()
    await heading.scrollIntoViewIfNeeded()
    await page.waitForTimeout(2200)

    const sample = await heading.evaluate((el) => {
      const lines = el.querySelectorAll('.aa-line')
      const chars = el.querySelectorAll('.aa-char')
      const lastChar = chars[chars.length - 1] as HTMLElement | undefined
      return {
        lineCount: lines.length,
        charCount: chars.length,
        lastCharOpacity: lastChar ? parseFloat(getComputedStyle(lastChar).opacity) : 0,
      }
    })
    expect(sample.lineCount).toBeGreaterThanOrEqual(2)
    expect(sample.charCount).toBeGreaterThan(20)
    expect(sample.lastCharOpacity).toBeGreaterThan(0.95)
  })
})
