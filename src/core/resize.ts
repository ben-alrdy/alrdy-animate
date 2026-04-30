import type { ResizeCallback, ResizeUnsubscribe } from '../types/index'

interface Subscriber {
  fn: ResizeCallback
  debounce: number
  timer: ReturnType<typeof setTimeout> | undefined
}

const subscribers = new Set<Subscriber>()
let attached = false

function dispatch(): void {
  for (const sub of subscribers) {
    if (sub.timer) clearTimeout(sub.timer)
    sub.timer = setTimeout(sub.fn, sub.debounce)
  }
}

function attach(): void {
  if (attached) return
  if (typeof window === 'undefined') return
  window.addEventListener('resize', dispatch, { passive: true })
  attached = true
}

function detachIfEmpty(): void {
  if (subscribers.size === 0 && attached) {
    window.removeEventListener('resize', dispatch)
    attached = false
  }
}

export function subscribe(fn: ResizeCallback, debounce = 150): ResizeUnsubscribe {
  const sub: Subscriber = { fn, debounce, timer: undefined }
  subscribers.add(sub)
  attach()
  return () => {
    if (sub.timer) clearTimeout(sub.timer)
    subscribers.delete(sub)
    detachIfEmpty()
  }
}

export function clearAll(): void {
  for (const sub of subscribers) {
    if (sub.timer) clearTimeout(sub.timer)
  }
  subscribers.clear()
  detachIfEmpty()
}
