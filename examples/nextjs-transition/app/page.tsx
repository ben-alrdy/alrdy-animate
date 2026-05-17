import { DemoNav } from '@/components/DemoNav'

export const metadata = { title: 'Home — Next.js Transition Demo' }

export default function HomePage() {
  return (
    <main data-transition-container data-page="home">
      <DemoNav current="home" />

      <section className="page">
        <h1 className="page__hero" aa-animate="text-slide-up" aa-split="lines mask" aa-trigger="load-once">
          A stacked-cards page transition.
        </h1>
        <p
          className="page__lede"
          aa-animate="text-slide-up"
          aa-split="lines mask"
          aa-trigger="load-once"
          aa-delay="0.2"
        >
          Click the nav to see the current page, an orange middle layer, and the next page scale
          down and drop one after another.
        </p>

        <div className="card-grid" aa-animate="fade-up" aa-stagger="0.1" aa-trigger="load-once event:enter">
          <article className="card">
            <span className="card__num">01</span>
            <h2 className="card__title">Verbatim Osmo</h2>
            <p className="card__body">
              The stacked-cards timeline is exactly what Osmo Supply ships — only the boilerplate
              around it changed.
            </p>
          </article>
          <article className="card">
            <span className="card__num">02</span>
            <h2 className="card__title">Lifecycle wired</h2>
            <p className="card__body">
              alrdy-animate&apos;s <code>init / destroy</code> hooks into Next&apos;s router so
              ScrollTriggers don&apos;t leak across page swaps.
            </p>
          </article>
          <article className="card">
            <span className="card__num">03</span>
            <h2 className="card__title">Built-in Lenis</h2>
            <p className="card__body">
              <code>smoothScroll: true</code> creates Lenis and exposes <code>window.lenis</code>,
              kept in sync with <code>gsap.ticker</code>.
            </p>
          </article>
        </div>
      </section>

      {/* Scroll-triggered showcase: each tile uses a different aa-animate
          recipe so the section becomes a tour of the appear catalogue. */}
      <section className="showcase">
        <header className="showcase__head">
          <span className="showcase__eyebrow" aa-animate="fade-up">
            Scroll showcase
          </span>
          <h2 className="showcase__title" aa-animate="text-slide-up" aa-split="lines mask">
            Six recipes, one scroll.
          </h2>
          <p className="showcase__lede" aa-animate="fade-up" aa-delay="0.1">
            Each tile reaches for a different <code>aa-animate</code> value. Drift past them —
            they all share the same default scroll trigger.
          </p>
        </header>

        <div className="tiles">
          <div className="tile tile--a" aa-animate="fade-up" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">fade-up</span>
            <span className="tile__glyph">↥</span>
          </div>
          <div className="tile tile--b" aa-animate="fade-left" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">fade-left</span>
            <span className="tile__glyph">↤</span>
          </div>
          <div className="tile tile--c" aa-animate="zoom-in" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">zoom-in</span>
            <span className="tile__glyph">◉</span>
          </div>
          <div className="tile tile--d" aa-animate="blur" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">blur</span>
            <span className="tile__glyph">◐</span>
          </div>
          <div className="tile tile--e" aa-animate="rotate-up-tl" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">rotate-up-tl</span>
            <span className="tile__glyph">↻</span>
          </div>
          <div className="tile tile--f" aa-animate="slide-up" aa-anchor=".tiles" aa-scroll-start="top center">
            <span className="tile__tag">slide-up</span>
            <span className="tile__glyph">▲</span>
          </div>
        </div>
      </section>

      {/* Scrubbed timeline: animations bind to scroll progress instead of
          firing once. The bars grow horizontally as the section scrolls
          through the viewport; the digits zoom in from below. */}
      <section className="scrub">
        <div
          className="scrub__veil"
          aa-animate="slices"
          aa-scrub="true"
          aa-scroll-start="top bottom"
          aa-scroll-end="bottom top"
        />
        <div className="scrub__inner">
          <span className="scrub__eyebrow" aa-animate="fade-up">
            Scrubbed
          </span>
          <h2 className="scrub__title" aa-animate="fade-up" aa-scrub="0.5" aa-distance="0.3">
            Tied to the&nbsp;scroll.
          </h2>

          <div className="bars">
            <div className="bar" aa-animate="fade-right" aa-distance="3" aa-scrub="true">
              <span className="bar__label">init</span>
            </div>
            <div className="bar" aa-animate="fade-right" aa-distance="3" aa-scrub="true">
              <span className="bar__label">scan</span>
            </div>
            <div className="bar" aa-animate="fade-right" aa-distance="3" aa-scrub="true">
              <span className="bar__label">match&nbsp;media</span>
            </div>
            <div className="bar" aa-animate="fade-right" aa-distance="3" aa-scrub="true">
              <span className="bar__label">trigger</span>
            </div>
            <div className="bar" aa-animate="fade-right" aa-distance="3" aa-scrub="true">
              <span className="bar__label">play</span>
            </div>
          </div>

          <div className="digits">
            <span className="digits__num" aa-animate="zoom-in" aa-scrub="0.8">0</span>
            <span className="digits__num" aa-animate="zoom-in" aa-scrub="0.8">8</span>
            <span className="digits__dot">.</span>
            <span className="digits__num" aa-animate="zoom-in" aa-scrub="0.8">0</span>
          </div>

          <p className="scrub__caption" aa-animate="fade-up" aa-scrub="1">
            Every element on this page rewinds and replays as you scroll up.
          </p>
        </div>
      </section>
    </main>
  )
}
