import { TransitionLink } from './TransitionLink'

type Props = { current: 'home' | 'about' | 'work' }

const links: Array<{ href: string; label: string; key: Props['current'] }> = [
  { href: '/', label: 'Home', key: 'home' },
  { href: '/about', label: 'About', key: 'about' },
  { href: '/work', label: 'Work', key: 'work' },
]

export function DemoNav({ current }: Props) {
  return (
    <nav className="demo-nav">
      <span className="demo-nav__brand">alrdy/example</span>
      <div className="demo-nav__links">
        {links.map((l) => (
          <TransitionLink
            key={l.key}
            href={l.href}
            className="demo-nav__link"
            {...(l.key === current ? { 'aria-current': 'page' } : {})}
          >
            {l.label}
          </TransitionLink>
        ))}
      </div>
    </nav>
  )
}
