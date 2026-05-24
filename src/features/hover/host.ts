/**
 * Hover hosts need `position: relative` + `overflow: hidden` so the injected
 * background/curve sits inside the element's box and is clipped to it, and
 * `isolation: isolate` so the injected element's `z-index: -1` resolves
 * inside the host's stacking context — placing it behind the host's own
 * content without falling through to the page background. We only touch
 * styles the host doesn't already provide, and remember what we set so
 * `restoreHost()` can put it back exactly on dispose.
 */
export interface HostRestore {
  position?: string
  overflow?: string
  isolation?: string
}

export function prepareHost(host: HTMLElement): HostRestore {
  const restore: HostRestore = {}
  const computed = getComputedStyle(host)

  if (computed.position === 'static') {
    restore.position = host.style.position
    host.style.position = 'relative'
  }
  if (computed.overflow !== 'hidden' && computed.overflow !== 'clip') {
    restore.overflow = host.style.overflow
    host.style.overflow = 'hidden'
  }
  if (computed.isolation === 'auto') {
    restore.isolation = host.style.isolation
    host.style.isolation = 'isolate'
  }
  return restore
}

export function restoreHost(host: HTMLElement, restore: HostRestore): void {
  if (restore.position !== undefined) host.style.position = restore.position
  if (restore.overflow !== undefined) host.style.overflow = restore.overflow
  if (restore.isolation !== undefined) host.style.isolation = restore.isolation
}

/**
 * Like `prepareHost` but only ensures a positioning context, never touches
 * overflow. Also forces `isolation: isolate` so the host owns its stacking
 * context — letting the injected underline bar use `z-index: -1` to paint
 * behind the host's own text without falling through to the page background.
 * Used by effects that inject absolutely-positioned children but must coexist
 * with the author's own overflow value (e.g. underline bars inside hosts that
 * may already use overflow for other reasons).
 */
export function ensurePositioned(host: HTMLElement): HostRestore {
  const restore: HostRestore = {}
  const computed = getComputedStyle(host)
  if (computed.position === 'static') {
    restore.position = host.style.position
    host.style.position = 'relative'
  }
  if (computed.isolation === 'auto') {
    restore.isolation = host.style.isolation
    host.style.isolation = 'isolate'
  }
  return restore
}
