import type { Locator } from '@playwright/test'

/** Computed `opacity` as a number — feed to `expect.poll` so it retries under load. */
export const opacityOf = (loc: Locator): Promise<number> =>
  loc.evaluate((el) => parseFloat(getComputedStyle(el).opacity))

/** A computed-style property as a string — for `expect.poll(...).not.toBe(before)` style checks. */
export const styleOf = (loc: Locator, prop: string): Promise<string> =>
  loc.evaluate((el, p) => getComputedStyle(el).getPropertyValue(p), prop)
