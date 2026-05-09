import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover background page', () => {
  test('lib initializes with hover feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/background/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*hover/)
  })

  test('block injects a positioned bg span and slides on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/background/')
    await initLog

    const tile = page.locator('a.hover-tile[aa-hover="block"]').first()
    await tile.scrollIntoViewIfNeeded()
    const bg = tile.locator('[aa-hover-bg="block"]')
    await expect(bg).toHaveCount(1)
    const beforeTransform = await bg.evaluate((el) => getComputedStyle(el).transform)

    await tile.hover()
    await page.waitForTimeout(1000)

    const afterTransform = await bg.evaluate((el) => getComputedStyle(el).transform)
    expect(afterTransform).not.toEqual(beforeTransform)
    // After settling at "fully entered", transform is the identity matrix.
    expect(afterTransform).toMatch(/matrix\(1, 0, 0, 1, 0, 0\)|none/)
  })

  test('curve injects an SVG path that morphs on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/background/')
    await initLog

    const tile = page.locator('a.hover-tile[aa-hover="curve"]').first()
    await tile.scrollIntoViewIfNeeded()
    const path = tile.locator('[aa-hover-bg="curve"] path')
    await expect(path).toHaveCount(1)
    const beforeD = await path.getAttribute('d')

    await tile.hover()
    await page.waitForTimeout(1000)

    const afterD = await path.getAttribute('d')
    expect(afterD).not.toEqual(beforeD)
  })
})

test.describe('hover icon page', () => {
  test('icon wraps the svg, clones it, and animates on hover', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/icon/')
    await initLog

    const cta = page.locator('a.hover-cta[aa-hover="icon-up-right"]').first()
    await cta.scrollIntoViewIfNeeded()
    // Wrapper injected, two SVGs inside (original + clone)
    const wrap = cta.locator('[aa-hover-icon-clip]')
    await expect(wrap).toHaveCount(1)
    await expect(wrap.locator('svg')).toHaveCount(2)

    const original = wrap.locator('svg').first()
    const beforeTransform = await original.evaluate((el) => getComputedStyle(el).transform)

    await cta.hover()
    await page.waitForTimeout(1000)

    const afterTransform = await original.evaluate((el) => getComputedStyle(el).transform)
    expect(afterTransform).not.toEqual(beforeTransform)
  })
})
