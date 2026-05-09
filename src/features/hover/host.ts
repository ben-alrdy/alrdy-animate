/**
 * Hover hosts need `position: relative` + `overflow: hidden` so the injected
 * background/curve sits inside the element's box and is clipped to it. We only
 * touch styles the host doesn't already provide, and remember what we set so
 * `restoreHost()` can put it back exactly on dispose.
 */
export interface HostRestore {
  position?: string
  overflow?: string
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
  return restore
}

export function restoreHost(host: HTMLElement, restore: HostRestore): void {
  if (restore.position !== undefined) host.style.position = restore.position
  if (restore.overflow !== undefined) host.style.overflow = restore.overflow
}
