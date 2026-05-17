'use client'

import Link, { type LinkProps } from 'next/link'
import type { AnchorHTMLAttributes, MouseEvent, ReactNode } from 'react'
import { useTransitionNavigate } from './AlrdyProvider'

type Props = Omit<LinkProps, 'href' | 'onClick'> &
  Omit<AnchorHTMLAttributes<HTMLAnchorElement>, 'href' | 'onClick'> & {
    href: string
    children: ReactNode
    onClick?: (e: MouseEvent<HTMLAnchorElement>) => void
  }

// Built on Next's <Link> for viewport-based RSC prefetching (production):
// any link that scrolls into view has its RSC payload + chunks fetched and
// cached, so router.push() at the end of the leave timeline commits with
// zero network. Click is intercepted to run the GSAP leave timeline first;
// preventDefault short-circuits <Link>'s own router.push.
export function TransitionLink({ href, children, onClick, ...rest }: Props) {
  const navigate = useTransitionNavigate()

  const handleClick = (e: MouseEvent<HTMLAnchorElement>) => {
    // Standard escape hatches: modifier keys, middle-click, target=_blank —
    // let the browser handle them normally.
    if (
      e.metaKey ||
      e.ctrlKey ||
      e.shiftKey ||
      e.altKey ||
      e.button !== 0 ||
      (e.currentTarget.target && e.currentTarget.target !== '_self')
    ) {
      return
    }
    if (e.currentTarget.pathname === window.location.pathname) {
      e.preventDefault()
      return
    }
    onClick?.(e)
    if (e.defaultPrevented) return

    e.preventDefault()
    navigate(href)
  }

  return (
    <Link href={href} onClick={handleClick} {...rest}>
      {children}
    </Link>
  )
}
