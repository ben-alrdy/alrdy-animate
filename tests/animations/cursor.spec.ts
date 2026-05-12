import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

test.describe('hover cursor page', () => {
  test('lib initializes with cursor feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/cursor/')
    await initLog

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*cursor/)
  })

  test('cursor element starts hidden, shows on trigger hover, hides on leave', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/cursor/')
    await initLog

    const cursor = page.locator('[aa-cursor]').first()
    await expect(cursor).toHaveCount(1)

    // Park the mouse off any trigger so the cursor settles hidden after init.
    await page.mouse.move(0, 0)
    await page.waitForTimeout(500)
    const startOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(startOpacity).toBeLessThan(0.2)

    const firstTrigger = page.locator('[aa-cursor-trigger]').first()
    await firstTrigger.scrollIntoViewIfNeeded()
    const expectedTitle = await firstTrigger.getAttribute('aa-cursor-title')
    const expectedText = await firstTrigger.getAttribute('aa-cursor-text')

    await firstTrigger.hover()
    await page.waitForTimeout(500)

    const hoverOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(hoverOpacity).toBeGreaterThan(0.5)

    const titleText = await cursor.locator('[aa-cursor-title]').textContent()
    const textText = await cursor.locator('[aa-cursor-text]').textContent()
    expect(titleText).toBe(expectedTitle)
    expect(textText).toBe(expectedText)

    await page.mouse.move(0, 0)
    await page.waitForTimeout(700)
    const endOpacity = await cursor.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(endOpacity).toBeLessThan(0.2)
  })

  test('aa-cursor-offset overrides xPercent / yPercent', async ({ page }) => {
    await page.setViewportSize({ width: 1280, height: 800 })
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/hover/cursor/')
    await initLog

    // Override the default cursor's offset to "centered on mouse" (-50 -50) and re-init.
    await page.evaluate(() => {
      const cursor = document.querySelector<HTMLElement>('[aa-cursor=""]')!
      cursor.setAttribute('aa-cursor-offset', '-50 -50')
      // @ts-expect-error library is exposed on window via UMD
      window.AlrdyAnimate.destroy()
      // @ts-expect-error library is exposed on window via UMD
      window.AlrdyAnimate.init({ debug: false })
    })

    const trigger = page.locator('[aa-cursor-trigger=""]').first()
    await trigger.scrollIntoViewIfNeeded()
    // Hover via real mouse so the cursor positions track the pointer.
    const box = await trigger.boundingBox()
    if (!box) throw new Error('trigger has no bounding box')
    await page.mouse.move(box.x + box.width / 2, box.y + box.height / 2)
    await page.waitForTimeout(700)

    const transform = await page
      .locator('[aa-cursor=""]')
      .first()
      .evaluate((el) => getComputedStyle(el).transform)
    // matrix(a, b, c, d, tx, ty) — tx/ty include the xPercent/yPercent offset
    // (negative half of the cursor's own width/height for "-50 -50").
    expect(transform.startsWith('matrix(')).toBe(true)
    const parts = transform
      .slice(transform.indexOf('(') + 1, transform.lastIndexOf(')'))
      .split(',')
      .map((s) => parseFloat(s.trim()))
    const cursorBox = await page.locator('[aa-cursor=""]').first().boundingBox()
    if (!cursorBox) throw new Error('cursor has no bounding box')
    const mouseX = box.x + box.width / 2
    const mouseY = box.y + box.height / 2
    // Cursor center should sit near the mouse pointer.
    const centerX = cursorBox.x + cursorBox.width / 2
    const centerY = cursorBox.y + cursorBox.height / 2
    expect(Math.abs(centerX - mouseX)).toBeLessThan(20)
    expect(Math.abs(centerY - mouseY)).toBeLessThan(20)
    // Sanity-check we read a matrix value (silences unused-vars).
    expect(parts.length).toBeGreaterThanOrEqual(6)
  })
})
