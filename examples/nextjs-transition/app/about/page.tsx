import { DemoNav } from '@/components/DemoNav'

export const metadata = { title: 'About — Next.js Transition Demo' }

export default function AboutPage() {
  return (
    <main data-transition-container data-page="about">
      <DemoNav current="about" />

      <section className="page">
        <h1 className="page__hero" aa-animate="text-slide-up" aa-split="lines mask" aa-trigger="load-once">
          Built for v8 page transitions.
        </h1>
        <p
          className="page__lede"
          aa-animate="text-slide-up"
          aa-split="lines mask"
          aa-trigger="load-once"
          aa-delay="0.2"
        >
          The lib stays out of the transition itself and exposes the lifecycle hooks you need to
          integrate any page-change library.
        </p>

        <div className="card-grid" aa-animate="fade-up" aa-stagger="0.1" aa-trigger="load-once event:enter">
          <article className="card">
            <span className="card__num">01</span>
            <h2 className="card__title">Init / destroy / refresh</h2>
            <p className="card__body">
              Three lifecycle calls — destroy in <code>useEffect</code>, init scoped to the new
              container, on every <code>usePathname()</code> change.
            </p>
          </article>
          <article className="card">
            <span className="card__num">02</span>
            <h2 className="card__title">Scoped scan</h2>
            <p className="card__body">
              Pass <code>{`{ root: newMain }`}</code> to <code>init()</code>. The cloned overlay
              of the leaving page is left alone.
            </p>
          </article>
          <article className="card">
            <span className="card__num">03</span>
            <h2 className="card__title">Event-triggered animations</h2>
            <p className="card__body">
              <code>aa-trigger=&quot;event:enter&quot;</code> waits for an <code>aa:trigger</code>
              event so timing is in your hands.
            </p>
          </article>
        </div>
      </section>

      {/* Looping marquee from v8's aa-marquee feature. `hover-pause` pauses
          on cursor; `right` would reverse direction; `aa-duration` tunes the
          cycle length. */}
      <section className="ribbon">
        <span className="ribbon__eyebrow" aa-animate="fade-up" aa-trigger="load-once event:enter">
          Stack
        </span>
        <h2
          className="ribbon__title"
          aa-animate="text-slide-up"
          aa-split="lines mask"
          aa-trigger="load-once event:enter"
        >
          Built on tools the lib doesn&apos;t bundle.
        </h2>

        <div className="ribbon-marquee" aa-marquee="hover-pause" aa-duration="28">
          <div className="ribbon-marquee__scroller" aa-marquee-scroller="">
            <div className="ribbon-marquee__track" aa-marquee-track="">
              <div className="ribbon-marquee__list" aa-marquee-list="">
                <span className="ribbon-marquee__item">GSAP</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">ScrollTrigger</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">SplitText</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">CustomEase</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">Flip</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">Lenis</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">Next.js</span>
                <span className="ribbon-marquee__sep">●</span>
                <span className="ribbon-marquee__item">alrdy-animate</span>
                <span className="ribbon-marquee__sep">●</span>
              </div>
            </div>
          </div>
        </div>
      </section>
    </main>
  )
}
