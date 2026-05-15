import { parseNum } from '../../core/parse'

export type TabMode = 'default' | 'single' | 'multi' | 'autoplay' | 'scroll'

export interface ParsedTabsConfig {
  mode: TabMode
  isNone: boolean
}

/**
 * Mode tokens recognised on `aa-tabs`. Autoplay is no longer a token here —
 * presence of `aa-autoplay` on the root activates autoplay mode (handled in
 * setupOne after parseAutoplay).
 */
export function parseTabsValue(raw: string | undefined): ParsedTabsConfig {
  const tokens = (raw ?? '')
    .trim()
    .split(/\s+/)
    .filter(Boolean)
  const isNone = tokens.includes('none')
  let mode: TabMode = 'default'
  if (tokens.includes('scroll')) mode = 'scroll'
  else if (tokens.includes('multi')) mode = 'multi'
  else if (tokens.includes('single')) mode = 'single'
  return { mode, isNone }
}

export interface TabEntry {
  id: string
  index: number
  toggle: HTMLElement
  content: HTMLElement | null
  visual: HTMLElement | null
  wrapper: HTMLElement | null
  progress: HTMLElement | null
  /** Toggle-level (or root-level) duration — used for the height tween. */
  contentDuration: number
  /** Visual cross-fade duration. */
  visualDuration: number
  /** Per-tab dwell for autoplay; only meaningful when mode === 'autoplay'. */
  interval: number
  ease: string
}

export interface TabStateDefaults {
  duration: number
  /** Default autoplay interval (seconds) inherited from root or init.autoplay.interval. */
  interval: number
  ease: string
}

export interface TabState {
  root: HTMLElement
  entries: TabEntry[]
  byId: Map<string, TabEntry>
  useWrapperPattern: boolean
  hasContent: boolean
  hasVisualOnly: boolean
  /** Status host for an entry — wrapper if present, else toggle. */
  statusEl: (entry: TabEntry) => HTMLElement
  isActive: (entry: TabEntry) => boolean
  setStatus: (entry: TabEntry, status: 'active' | 'inactive') => void
  activeEntry: () => TabEntry | null
  initialEntry: () => TabEntry | null
}

const STATUS_ATTR = 'aa-tabs-status'

function autoAssignIds(root: HTMLElement): void {
  const wrappers = root.querySelectorAll<HTMLElement>('[aa-tabs-wrapper]')
  const useWrapper = wrappers.length > 0

  if (useWrapper) {
    wrappers.forEach((wrapper, i) => {
      let id = wrapper.getAttribute('aa-tabs-wrapper')
      if (!id) {
        id = `aa-tabs-${i}`
        wrapper.setAttribute('aa-tabs-wrapper', id)
      }
      const toggle = wrapper.querySelector<HTMLElement>('[aa-tabs-toggle]')
      const content = wrapper.querySelector<HTMLElement>('[aa-tabs-content]')
      if (toggle && !toggle.getAttribute('aa-tabs-toggle')) {
        toggle.setAttribute('aa-tabs-toggle', id)
      }
      if (content && !content.getAttribute('aa-tabs-content')) {
        content.setAttribute('aa-tabs-content', id)
      }
    })
    root.querySelectorAll<HTMLElement>('[aa-tabs-visual]').forEach((visual, i) => {
      if (!visual.getAttribute('aa-tabs-visual')) {
        visual.setAttribute('aa-tabs-visual', `aa-tabs-${i}`)
      }
    })
    return
  }

  root.querySelectorAll<HTMLElement>('[aa-tabs-toggle]').forEach((el, i) => {
    if (!el.getAttribute('aa-tabs-toggle')) el.setAttribute('aa-tabs-toggle', `aa-tabs-${i}`)
  })
  root.querySelectorAll<HTMLElement>('[aa-tabs-content]').forEach((el, i) => {
    if (!el.getAttribute('aa-tabs-content')) el.setAttribute('aa-tabs-content', `aa-tabs-${i}`)
  })
  root.querySelectorAll<HTMLElement>('[aa-tabs-visual]').forEach((el, i) => {
    if (!el.getAttribute('aa-tabs-visual')) el.setAttribute('aa-tabs-visual', `aa-tabs-${i}`)
  })
}

function readDuration(el: HTMLElement | null, fallback: number): number {
  if (!el) return fallback
  return parseNum(el.getAttribute('aa-duration'), fallback)
}

function readEase(el: HTMLElement | null, fallback: string): string {
  if (!el) return fallback
  const v = el.getAttribute('aa-ease')
  return v && v.length > 0 ? v : fallback
}

/**
 * Read the autoplay interval declared on an element via `aa-autoplay`. The
 * attribute syntax matches the global parser: a numeric token sets the
 * interval; `hover-pause` is a flag the global parser handles (we ignore it
 * per-tab). Absent attribute or no usable number → returns fallback.
 */
function readInterval(el: HTMLElement | null, fallback: number): number {
  if (!el || !el.hasAttribute('aa-autoplay')) return fallback
  const raw = el.getAttribute('aa-autoplay') ?? ''
  for (const t of raw.trim().split(/\s+/)) {
    const n = parseFloat(t)
    if (Number.isFinite(n) && n > 0) return n
  }
  return fallback
}

export function createTabState(root: HTMLElement, defaults: TabStateDefaults): TabState {
  autoAssignIds(root)

  const wrappers = Array.from(root.querySelectorAll<HTMLElement>('[aa-tabs-wrapper]'))
  const useWrapperPattern = wrappers.length > 0

  const toggles = Array.from(root.querySelectorAll<HTMLElement>('[aa-tabs-toggle]'))
  const entries: TabEntry[] = []
  const byId = new Map<string, TabEntry>()

  // Root-level overrides waterfall down to toggle/content/visual. Per-tab
  // autoplay interval comes from each toggle's `aa-autoplay` (numeric token
  // only); the root `aa-autoplay` is the per-tabset baseline; init.autoplay
  // is the global default.
  const rootDuration = readDuration(root, defaults.duration)
  const rootEase = readEase(root, defaults.ease)
  const rootInterval = readInterval(root, defaults.interval)

  toggles.forEach((toggle, i) => {
    const id = toggle.getAttribute('aa-tabs-toggle') ?? `aa-tabs-${i}`
    const content = root.querySelector<HTMLElement>(`[aa-tabs-content="${CSS.escape(id)}"]`)
    const visual = root.querySelector<HTMLElement>(`[aa-tabs-visual="${CSS.escape(id)}"]`)
    const wrapper = useWrapperPattern ? toggle.closest<HTMLElement>('[aa-tabs-wrapper]') : null
    const progress = toggle.querySelector<HTMLElement>('[aa-tabs-progress]')

    const toggleDuration = readDuration(toggle, rootDuration)
    const toggleEase = readEase(toggle, rootEase)
    const toggleInterval = readInterval(toggle, rootInterval)

    const contentDuration = readDuration(content, toggleDuration)
    const visualDuration = readDuration(visual, toggleDuration)

    const entry: TabEntry = {
      id,
      index: i,
      toggle,
      content,
      visual,
      wrapper,
      progress,
      contentDuration,
      visualDuration,
      interval: toggleInterval,
      ease: toggleEase,
    }
    entries.push(entry)
    byId.set(id, entry)
  })

  const hasContent = entries.some((e) => !!e.content)
  const hasVisualOnly = !hasContent && entries.some((e) => !!e.visual)

  const statusEl = (entry: TabEntry): HTMLElement => entry.wrapper ?? entry.toggle
  const isActive = (entry: TabEntry): boolean => statusEl(entry).getAttribute(STATUS_ATTR) === 'active'
  const setStatus = (entry: TabEntry, status: 'active' | 'inactive'): void => {
    statusEl(entry).setAttribute(STATUS_ATTR, status)
    // When not using wrapper pattern, also tag content/visual so authors can
    // style them off [aa-tabs-content][aa-tabs-status="active"] etc.
    if (!entry.wrapper) {
      if (entry.content) entry.content.setAttribute(STATUS_ATTR, status)
    }
    if (entry.visual) entry.visual.setAttribute(STATUS_ATTR, status)
  }
  const activeEntry = (): TabEntry | null => entries.find(isActive) ?? null

  const initialEntry = (): TabEntry | null => {
    const explicit = root.querySelector<HTMLElement>('[aa-tabs-initial]')
    if (explicit) {
      const matchingToggle = explicit.matches('[aa-tabs-toggle]')
        ? explicit
        : explicit.querySelector<HTMLElement>('[aa-tabs-toggle]')
      if (matchingToggle) {
        const id = matchingToggle.getAttribute('aa-tabs-toggle')
        if (id) return byId.get(id) ?? null
      }
      // Wrapper-based: aa-tabs-initial on the wrapper → use the toggle inside it
      const wrapperToggle = explicit.querySelector<HTMLElement>('[aa-tabs-toggle]')
      if (wrapperToggle) {
        const id = wrapperToggle.getAttribute('aa-tabs-toggle')
        if (id) return byId.get(id) ?? null
      }
    }
    return null
  }

  return {
    root,
    entries,
    byId,
    useWrapperPattern,
    hasContent,
    hasVisualOnly,
    statusEl,
    isActive,
    setStatus,
    activeEntry,
    initialEntry,
  }
}

export const TABS_STATUS_ATTR = STATUS_ATTR
