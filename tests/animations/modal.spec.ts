import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

const MODAL_PATH = '/animations/components/modal/'

test.describe('modal demo page', () => {
  test('lib initializes with modal feature', async ({ page }) => {
    const messages: string[] = []
    page.on('console', (m) => messages.push(m.text()))

    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog

    expect(messages.find((m) => m.includes('Missing GSAP plugins'))).toBeUndefined()

    const initLine = messages.find((m) => m.includes('[alrdy-animate] initialized'))
    expect(initLine).toMatch(/Features:.*modal/)
  })

  test('clicking trigger sets active status and reveals card', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    const card = page.locator('[aa-modal-name="modal-center"]')
    const group = card.locator('xpath=ancestor::*[@aa-modal-group]')

    // Closed state.
    expect(await card.getAttribute('aa-modal-status')).toBe('not-active')
    expect(await group.getAttribute('aa-modal-group-status')).toBe('not-active')
    const initialVisibility = await card.evaluate((el) => getComputedStyle(el).visibility)
    expect(initialVisibility).toBe('hidden')

    await trigger.click()
    await page.waitForTimeout(700)

    expect(await card.getAttribute('aa-modal-status')).toBe('active')
    expect(await group.getAttribute('aa-modal-group-status')).toBe('active')
    const openVisibility = await card.evaluate((el) => getComputedStyle(el).visibility)
    expect(openVisibility).toBe('visible')
  })

  test('inner aa-animate elements play forward then reverse on close', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    // First .aa-char inside the heading — the text-blur target.
    const firstChar = page
      .locator('[aa-modal-name="modal-center"] h2 .aa-char')
      .first()

    const beforeOpen = await firstChar.evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity),
    )
    expect(beforeOpen).toBeLessThan(0.1)

    await trigger.click()
    await page.waitForTimeout(900)

    const afterOpen = await firstChar.evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity),
    )
    expect(afterOpen).toBeGreaterThan(0.9)

    // Close via Escape — should reverse the inner animation.
    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)

    const afterClose = await firstChar.evaluate((el) =>
      parseFloat(getComputedStyle(el).opacity),
    )
    expect(afterClose).toBeLessThan(0.1)
  })

  test('inner aa-animate inside an orphaned aa-stack-card still plays on open', async ({
    page,
  }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    // This element sits inside an `aa-stack-card` with no `aa-stack` ancestor.
    // Trigger inference must skip the orphaned container and fall through to
    // `modal-active`; before the orphan-skip fix it inferred `card-active` and
    // sat paused at opacity 0 forever.
    const probe = page.locator('[aa-modal-name="modal-center"] [data-orphan-probe]')

    const beforeOpen = await probe.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(beforeOpen).toBeLessThan(0.1)

    await trigger.click()
    await page.waitForTimeout(900)

    const afterOpen = await probe.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(afterOpen).toBeGreaterThan(0.9)
  })

  test('inner aa-animate honours aa-delay on open (event-triggered)', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    // aa-delay="0.5", aa-duration="0.4". The inner animation must stay at its
    // from-state through the delay window, then complete. Before the fix the
    // event forward used play(0), which skips GSAP's delay — the element would
    // already be animating at 250ms.
    const probe = page.locator('[aa-modal-name="modal-center"] [data-delay-probe]')

    await trigger.click()

    // Still inside the 0.5s delay — should be hidden (from-state).
    await page.waitForTimeout(250)
    const duringDelay = await probe.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(duringDelay).toBeLessThan(0.1)

    // Past delay + duration (0.5 + 0.4 = 0.9s) — should be fully visible.
    await page.waitForTimeout(800)
    const afterDone = await probe.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(afterDone).toBeGreaterThan(0.9)
  })

  test('Escape key closes the active modal', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    const card = page.locator('[aa-modal-name="modal-center"]')

    await trigger.click()
    await page.waitForTimeout(700)
    expect(await card.getAttribute('aa-modal-status')).toBe('active')

    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)
    expect(await card.getAttribute('aa-modal-status')).toBe('not-active')
  })

  test('backdrop click closes the modal', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')
    const card = page.locator('[aa-modal-name="modal-center"]')
    // Backdrop sibling of the centered card — scoped to the same group.
    const group = card.locator('xpath=ancestor::*[@aa-modal-group]')
    const backdrop = group.locator('[aa-modal-backdrop]').first()

    await trigger.click()
    await page.waitForTimeout(700)
    expect(await card.getAttribute('aa-modal-status')).toBe('active')

    // Dispatch the click event directly on the backdrop element. A real
    // Playwright click would route through browser hit-testing, which inside
    // the Starlight docs frame can land on page chrome instead of the
    // backdrop. dispatchEvent fires the click on the backdrop itself, which
    // is what we're testing (the modal feature's [aa-modal-close] handler).
    await backdrop.dispatchEvent('click')
    await page.waitForTimeout(700)
    expect(await card.getAttribute('aa-modal-status')).toBe('not-active')
  })

  test('body scroll is locked while open and released on close', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-center"]')

    expect(
      await page.evaluate(() => document.body.classList.contains('aa-modal-locked')),
    ).toBe(false)

    await trigger.click()
    await page.waitForTimeout(700)
    expect(
      await page.evaluate(() => document.body.classList.contains('aa-modal-locked')),
    ).toBe(true)

    await page.keyboard.press('Escape')
    await page.waitForTimeout(700)
    expect(
      await page.evaluate(() => document.body.classList.contains('aa-modal-locked')),
    ).toBe(false)
  })

  test('side panel opens with slide-left', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-side"]')
    const card = page.locator('[aa-modal-name="modal-side"]')

    await trigger.click()
    await page.waitForTimeout(800)

    expect(await card.getAttribute('aa-modal-status')).toBe('active')
    const opacity = await card.evaluate((el) => parseFloat(getComputedStyle(el).opacity))
    expect(opacity).toBeGreaterThan(0.9)
  })

  test('form modal auto-focuses the first input after open', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto(MODAL_PATH)
    await initLog
    await page.waitForTimeout(300)

    const trigger = page.locator('[aa-modal-target="modal-form"]')
    const emailInput = page.locator('[aa-modal-name="modal-form"] input[name="email"]')

    await trigger.click()
    // The auto-focus fires once the open animation finishes (cardDuration =
    // 0.5s). Wait a bit longer than that to give the delayedCall room.
    await page.waitForTimeout(800)

    const focusedName = await page.evaluate(
      () => (document.activeElement as HTMLInputElement | null)?.getAttribute('name'),
    )
    expect(focusedName).toBe('email')

    // Sanity-check the input is the same one we expect.
    expect(await emailInput.evaluate((el) => el === document.activeElement)).toBe(true)
  })
})
