import { expect, test, type ConsoleMessage } from '@playwright/test'
import { styleOf } from '../helpers'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover text page', () => {
  test('lib initializes with hover + split features', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/text/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*hover/)
  })

  test('text splits into chars, applies text-shadow + clip-path, lifts on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/text/')
    await initLog

    const link = page.locator('a[aa-hover="text"]').first()
    await link.scrollIntoViewIfNeeded()
    const chars = link.locator('.aa-char')
    expect(await chars.count()).toBeGreaterThan(2)

    // clip-path set inline; text-shadow applied to each char.
    const clipPath = await link.evaluate((el) => (el as HTMLElement).style.clipPath)
    expect(clipPath).toMatch(/inset\(/)
    const firstShadow = await chars.first().evaluate((el) => getComputedStyle(el).textShadow)
    expect(firstShadow).not.toBe('none')

    const beforeTransform = await styleOf(chars.first(), 'transform')
    await link.hover()
    // The lift tween must move the char off its rest transform at some point.
    await expect
      .poll(() => styleOf(chars.first(), 'transform'), { timeout: 4000 })
      .not.toBe(beforeTransform)
  })

  test('text default (no reverse) resets chars after the one-shot completes', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/text/')
    await initLog

    const link = page.locator('a[aa-hover="text"]').first()
    await link.scrollIntoViewIfNeeded()
    const firstChar = link.locator('.aa-char').first()

    await link.hover()
    // Wait until well after the IN tween completes (duration 0.5 + buffer).
    await page.waitForTimeout(900)

    // After the invisible reset, first char's transform should be back at identity.
    const settled = await firstChar.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return { a: m.a, f: m.f } // f = translateY
    })
    expect(settled.f).toBeCloseTo(0, 0)
  })

  test('text reverse stays up while hovered, returns on leave', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/text/')
    await initLog

    const link = page.locator('a[aa-hover="text reverse"]').first()
    await link.scrollIntoViewIfNeeded()
    const firstChar = link.locator('.aa-char').first()

    await link.hover()
    await page.waitForTimeout(700) // well past duration 0.5

    const hoveredY = await firstChar.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return m.f
    })
    expect(hoveredY).toBeLessThan(-1) // translated up at least ~1em

    await page.mouse.move(0, 0)
    await page.waitForTimeout(700)

    const restingY = await firstChar.evaluate((el) => {
      const m = new DOMMatrixReadOnly(getComputedStyle(el).transform)
      return m.f
    })
    expect(restingY).toBeCloseTo(0, 0)
  })
})
