/**
 * Reference-counted scroll lock. Two simultaneously-open modals (e.g. one in
 * each of two separate groups, however unusual) only release the lock when
 * both have closed. Lenis is preferred when present so its momentum and
 * data-lenis-prevent honoring keep working; otherwise we fall back to a body
 * class that pins overflow.
 */

const LOCK_CLASS = 'aa-modal-locked'
let lockCount = 0

export function lockBodyScroll(): void {
  lockCount += 1
  if (lockCount > 1) return
  if (typeof window !== 'undefined' && window.lenis) {
    try {
      window.lenis.stop()
    } catch {
      // ignore — fallback to body class below
    }
  }
  if (typeof document !== 'undefined') {
    document.body.classList.add(LOCK_CLASS)
  }
}

export function unlockBodyScroll(): void {
  if (lockCount === 0) return
  lockCount -= 1
  if (lockCount > 0) return
  if (typeof window !== 'undefined' && window.lenis) {
    try {
      window.lenis.start()
    } catch {
      // ignore
    }
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove(LOCK_CLASS)
  }
}

export function resetScrollLock(): void {
  if (lockCount === 0) return
  lockCount = 0
  if (typeof window !== 'undefined' && window.lenis) {
    try {
      window.lenis.start()
    } catch {
      // ignore
    }
  }
  if (typeof document !== 'undefined') {
    document.body.classList.remove(LOCK_CLASS)
  }
}
