import { emitTrigger } from '../../core/trigger'

let sliderInstanceCounter = 0

export interface NavSetupResult {
  /** onChange callback for the horizontalLoop config — wires up class/ARIA toggles + emits events. */
  onChange: (item: Element, rawIndex: number) => void
  /** Items the slider is operating on (already queried). */
  items: HTMLElement[]
  /** Total slide count. */
  total: number
  /** Wire up click handlers; needs the slider timeline + nav-restart callback. */
  attachClickListeners: (handlers: NavClickHandlers) => () => void
}

export interface NavClickHandlers {
  next: () => void
  previous: () => void
  toIndex: (target: number) => void
  current: () => number
}

export function setupNav(root: HTMLElement): NavSetupResult {
  const items = Array.from(root.querySelectorAll<HTMLElement>('[aa-slider-item]'))
  if (items.length === 0) {
    return {
      onChange: () => {},
      items: [],
      total: 0,
      attachClickListeners: () => () => {},
    }
  }

  const total = items.length
  const sliderIdPrefix = root.id || `aa-slider-${sliderInstanceCounter++}`

  const nextButton = root.querySelector<HTMLElement>('[aa-slider-next]')
  const prevButton = root.querySelector<HTMLElement>('[aa-slider-prev]')
  const currentEl = root.querySelector<HTMLElement>('[aa-slider-current]')
  const totalEl = root.querySelector<HTMLElement>('[aa-slider-total]')

  // Slide-specific buttons: include those nested inside the slider plus any
  // external ones that target this slider's id via aa-slider-target.
  const internalThumbs = Array.from(root.querySelectorAll<HTMLElement>('[aa-slider-button]'))
  const externalThumbs = root.id
    ? Array.from(
        document.querySelectorAll<HTMLElement>(
          `[aa-slider-button][aa-slider-target="${root.id}"]`,
        ),
      )
    : []
  const thumbs = [...internalThumbs, ...externalThumbs]

  // Root ARIA. Don't override an existing role attribute (Webflow CMS lists
  // for instance). aa-slider-region role enables tablist semantics for thumbs.
  if (!root.hasAttribute('role')) root.setAttribute('role', 'region')
  root.setAttribute('aria-roledescription', 'carousel')

  // Per-slide ARIA + unique id.
  items.forEach((slide, i) => {
    const isCmsItem = slide.classList.contains('w-dyn-item')
    if (!isCmsItem && !slide.hasAttribute('role')) slide.setAttribute('role', 'group')
    slide.setAttribute('aria-roledescription', 'slide')
    slide.setAttribute('aria-label', `Slide ${i + 1} of ${total}`)
    if (!slide.id) slide.id = `${sliderIdPrefix}-slide-${i}`
  })

  if (nextButton) {
    if (!nextButton.hasAttribute('aria-label')) nextButton.setAttribute('aria-label', 'Next slide')
    if (!nextButton.hasAttribute('role')) nextButton.setAttribute('role', 'button')
  }
  if (prevButton) {
    if (!prevButton.hasAttribute('aria-label'))
      prevButton.setAttribute('aria-label', 'Previous slide')
    if (!prevButton.hasAttribute('role')) prevButton.setAttribute('role', 'button')
  }

  if (thumbs.length > 0) {
    // The first thumb's parent in the original slider becomes the tablist.
    if (internalThumbs.length > 0) {
      const tablist = internalThumbs[0].parentElement
      if (tablist && !tablist.hasAttribute('role')) tablist.setAttribute('role', 'tablist')
    }
    thumbs.forEach((btn, i) => {
      if (!btn.hasAttribute('aria-label')) btn.setAttribute('aria-label', `Go to slide ${i + 1}`)
      btn.setAttribute('role', 'tab')
      btn.setAttribute('aria-controls', `${sliderIdPrefix}-slide-${i}`)
      btn.setAttribute('aria-selected', 'false')
    })
  }

  if (totalEl) {
    totalEl.textContent = total < 10 ? `0${total}` : String(total)
  }

  const formatIndex = (n: number): string => (n < 10 ? `0${n}` : String(n))

  const onChange = (_item: Element, rawIndex: number): void => {
    const index = ((rawIndex % total) + total) % total

    items.forEach((slide, i) => {
      const wasActive = slide.classList.contains('is-active')
      const isActive = i === index
      slide.classList.toggle('is-active', isActive)
      slide.setAttribute('aria-hidden', isActive ? 'false' : 'true')
      if (isActive && !wasActive) emitTrigger(slide, 'slide-active')
      else if (!isActive && wasActive) emitTrigger(slide, 'slide-inactive')
    })

    if (thumbs.length > 0) {
      thumbs.forEach((btn, i) => {
        const isActive = i === index
        btn.classList.toggle('is-active', isActive)
        btn.setAttribute('aria-selected', isActive ? 'true' : 'false')
      })
    }

    if (currentEl) {
      currentEl.textContent = formatIndex(index + 1)
    }
  }

  const attachClickListeners = (handlers: NavClickHandlers): (() => void) => {
    const cleanups: Array<() => void> = []
    const add = (el: HTMLElement, evt: string, fn: EventListener): void => {
      el.addEventListener(evt, fn)
      cleanups.push(() => el.removeEventListener(evt, fn))
    }

    if (nextButton) add(nextButton, 'click', () => handlers.next())
    if (prevButton) add(prevButton, 'click', () => handlers.previous())
    thumbs.forEach((btn, i) => {
      add(btn, 'click', () => {
        if (i === handlers.current()) return
        handlers.toIndex(i)
      })
    })

    return () => {
      for (const fn of cleanups) fn()
    }
  }

  return { onChange, items, total, attachClickListeners }
}
