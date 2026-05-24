import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover utility page (aa-hover-trigger)', () => {
  test('lib initializes', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/utility/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*hover/)
  })

  test('aa-hover-trigger ancestor drives descendant effects on a single hover event', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/utility/')
    await initLog

    const root = page.locator('[aa-hover-trigger][aa-hover="curve"]').first()
    await root.scrollIntoViewIfNeeded()
    const label = root.locator('[aa-hover="text reverse"]')
    const labelChar = label.locator('.aa-char').first()
    const iconHost = root.locator('[aa-hover="icon-right reverse"]')
    await expect(iconHost.locator('[aa-hover-icon-clip]')).toHaveCount(1)
    const iconSvg = iconHost.locator('[aa-hover-icon-clip] svg').first()
    const curvePath = root.locator('[aa-hover-bg="curve"] path')
    await expect(curvePath).toHaveCount(1)

    const iconBefore = await iconSvg.evaluate((el) => getComputedStyle(el).transform)
    const curveBefore = await curvePath.getAttribute('d')

    // Hover the root; verify all three descendant effects fire from this
    // single event source via the trigger map.
    await root.hover()
    await page.waitForTimeout(700)
    const charY = await labelChar.evaluate(
      (el) => new DOMMatrixReadOnly(getComputedStyle(el).transform).f,
    )
    // text reverse keeps chars translated up while hovered.
    expect(charY).toBeLessThan(-1)

    const iconAfter = await iconSvg.evaluate((el) => getComputedStyle(el).transform)
    const curveAfter = await curvePath.getAttribute('d')
    expect(iconAfter).not.toEqual(iconBefore)
    expect(curveAfter).not.toEqual(curveBefore)
  })

  test('text + icon are horizontally aligned on a shared midline', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/utility/')
    await initLog

    const root = page.locator('[aa-hover-trigger][aa-hover="curve"]').first()
    await root.scrollIntoViewIfNeeded()
    const labelBox = await root.locator('[aa-hover="text reverse"]').boundingBox()
    const iconBox = await root.locator('[aa-hover="icon-right reverse"]').boundingBox()
    if (!labelBox || !iconBox) throw new Error('missing layout box')
    const labelMid = labelBox.y + labelBox.height / 2
    const iconMid = iconBox.y + iconBox.height / 2
    // Vertical centres should land within 1px of each other — flex
    // align-items: center over equal-height boxes (line-height: 1 label
    // matches the 1em-tall icon wrap).
    expect(Math.abs(labelMid - iconMid)).toBeLessThanOrEqual(1)
  })

  test('nested underline + text combo: both fire from the wrapper, no overflow mutation', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/utility/')
    await initLog

    const link = page.locator('a.cmp-link[aa-hover-trigger]').first()
    await link.scrollIntoViewIfNeeded()
    const underlineSpan = link.locator('[aa-hover="underline-in"]')
    const textSpan = link.locator('[aa-hover="text reverse"]')
    const bar = underlineSpan.locator('[aa-hover-underline=""]')
    await expect(bar).toHaveCount(1)

    // The wrapper <a> must not have had overflow set by JS — we never touch it
    // for these effects.
    const wrapperInlineOverflow = await link.evaluate((el) => (el as HTMLElement).style.overflow)
    expect(wrapperInlineOverflow).toBe('')

    const barBefore = await bar.evaluate((el) => getComputedStyle(el).transform)
    const firstChar = textSpan.locator('.aa-char').first()
    const charBefore = await firstChar.evaluate((el) => getComputedStyle(el).transform)

    await link.hover()
    await page.waitForTimeout(900)

    const barAfter = await bar.evaluate((el) => getComputedStyle(el).transform)
    const charAfter = await firstChar.evaluate((el) => getComputedStyle(el).transform)
    expect(barAfter).not.toEqual(barBefore)
    expect(charAfter).not.toEqual(charBefore)

    // text span has inline clip-path; underline span has inline position: relative.
    const clipPath = await textSpan.evaluate((el) => (el as HTMLElement).style.clipPath)
    expect(clipPath).toMatch(/inset\(/)
    const underlinePosition = await underlineSpan.evaluate((el) => (el as HTMLElement).style.position)
    expect(underlinePosition).toBe('relative')
  })
})
