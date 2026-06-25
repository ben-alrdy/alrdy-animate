import { expect, test, type ConsoleMessage } from '@playwright/test'

const initialized = (msg: ConsoleMessage): boolean =>
  msg.text().includes('[alrdy-animate] initialized')

/**
 * `aa-trigger="load-instant"` is owned by the inline CSS keyframe + the optional
 * loader, NOT by GSAP. These specs assert the library-side handoff: it builds no
 * tween, doesn't re-split loader-split text, and still flips `aa-ready` so the DOM
 * ends consistent. (The CSS entrance + loader splitter are verified separately.)
 */
test.describe('aa-trigger="load-instant"', () => {
  test('element-level: lib builds no GSAP tween, still reveals', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const result = await page.evaluate(async () => {
      const existing = document.getElementById('li-el')
      if (existing) existing.remove()
      const el = document.createElement('div')
      el.id = 'li-el'
      el.setAttribute('aa-animate', 'fade-up')
      el.setAttribute('aa-trigger', 'load-instant')
      el.style.cssText = 'position:fixed;top:0;left:0;width:80px;height:40px;background:#f00;'
      el.textContent = 'instant'
      document.body.appendChild(el)

      await window.AlrdyAnimate.refresh()

      const gsap = (window as unknown as { gsap: { getTweensOf: (t: unknown) => unknown[] } }).gsap
      return {
        ready: el.hasAttribute('aa-ready'),
        tweenCount: gsap.getTweensOf(el).length,
      }
    })

    // No GSAP tween — the CSS keyframe owns the entrance.
    expect(result.tweenCount).toBe(0)
    // Still revealed (end-of-init aa-ready flip).
    expect(result.ready).toBe(true)
  })

  test('text: lib does not re-split or tween a loader-split element', async ({ page }) => {
    const initLog = page.waitForEvent('console', { predicate: initialized, timeout: 8000 })
    await page.goto('/animations/appear/fade/')
    await initLog

    const result = await page.evaluate(async () => {
      const existing = document.getElementById('li-txt')
      if (existing) existing.remove()
      const el = document.createElement('h2')
      el.id = 'li-txt'
      el.setAttribute('aa-animate', 'text-fade-up')
      el.setAttribute('aa-trigger', 'load-instant')
      el.setAttribute('aa-instant-split', '')
      el.style.cssText = 'position:fixed;top:60px;left:0;'
      // Simulate the loader's split output: two .aa-char spans + sr-only clone.
      el.innerHTML =
        '<span aria-hidden="true"><span class="aa-word">' +
        '<span class="aa-char" style="--char:1">H</span>' +
        '<span class="aa-char" style="--char:2">i</span>' +
        '</span></span><span class="aa-sr-only">Hi</span>'
      document.body.appendChild(el)

      const charsBefore = el.querySelectorAll('.aa-char').length
      await window.AlrdyAnimate.refresh()
      const charsAfter = el.querySelectorAll('.aa-char').length

      const gsap = (window as unknown as { gsap: { getTweensOf: (t: unknown) => unknown[] } }).gsap
      return {
        ready: el.hasAttribute('aa-ready'),
        charsBefore,
        charsAfter,
        tweenCount: gsap.getTweensOf(el).length,
        charTweens: gsap.getTweensOf(el.querySelector('.aa-char')).length,
      }
    })

    // SplitText never ran — the loader's char count is untouched (no re-wrap).
    expect(result.charsAfter).toBe(result.charsBefore)
    // No GSAP tween on the element or its chars.
    expect(result.tweenCount).toBe(0)
    expect(result.charTweens).toBe(0)
    expect(result.ready).toBe(true)
  })
})
