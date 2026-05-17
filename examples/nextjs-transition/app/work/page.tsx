import { DemoNav } from '@/components/DemoNav'

export const metadata = { title: 'Work — Next.js Transition Demo' }

const slides = [
  { num: '01', title: 'Editorial brand site', meta: '2024 · Webflow · Barba' },
  { num: '02', title: 'SaaS dashboard', meta: '2025 · Next.js · GSAP' },
  { num: '03', title: 'Conference site', meta: '2026 · Webflow · ScrollTrigger' },
  { num: '04', title: 'Type foundry', meta: '2025 · Astro · SplitText' },
  { num: '05', title: 'Studio book', meta: '2024 · Webflow · Lenis' },
  { num: '06', title: 'Festival microsite', meta: '2025 · Astro · Flip' },
  { num: '07', title: 'Agency rebrand', meta: '2026 · Next.js · Barba' },
  { num: '08', title: 'Product launch reel', meta: '2025 · Webflow · ScrollTrigger' },
  { num: '09', title: 'Magazine archive', meta: '2026 · Astro · CustomEase' },
  { num: '10', title: 'Music label site', meta: '2024 · Webflow · GSAP' },
]

export default function WorkPage() {
  return (
    <main data-transition-container data-page="work">
      <DemoNav current="work" />

      <section className="page">
        <h1 className="page__hero" aa-animate="text-slide-up" aa-split="lines mask" aa-trigger="load-once">
          Selected works.
        </h1>
        <p
          className="page__lede"
          aa-animate="text-slide-up"
          aa-split="lines mask"
          aa-trigger="load-once"
          aa-delay="0.2"
        >
          A small reel of recent projects — kept short to keep the focus on the transition itself.
        </p>

        <div className="card-grid" aa-animate="fade-up" aa-stagger="0.1" aa-trigger="load-once event:enter">
          <article className="card">
            <span className="card__num">01</span>
            <h2 className="card__title">Brand site, 2024</h2>
            <p className="card__body">
              Editorial layout with type-led storytelling. Built in Webflow with Barba transitions.
            </p>
          </article>
          <article className="card">
            <span className="card__num">02</span>
            <h2 className="card__title">SaaS dashboard, 2025</h2>
            <p className="card__body">
              Data-dense UI with stable scroll-anchored animations across long pages.
            </p>
          </article>
          <article className="card">
            <span className="card__num">03</span>
            <h2 className="card__title">Conference site, 2026</h2>
            <p className="card__body">
              Programmable reveal sequences for the keynote sections. Driven by the same lib.
            </p>
          </article>
        </div>
      </section>

      {/* Project reel using v8's aa-slider. `draggable center` shows multiple
          slides with the active one centered; `aa-autoplay="4 hover-pause"`
          cycles every 4s and pauses under the cursor. */}
      <section className="reel">
        <header className="reel__head">
          <span className="reel__eyebrow" aa-animate="fade-up" aa-trigger="load-once event:enter">
            Reel
          </span>
          <h2
            className="reel__title"
            aa-animate="text-slide-up"
            aa-split="lines mask"
            aa-trigger="load-once event:enter"
          >
            Drag through the year.
          </h2>
        </header>

        <div
          className="reel-slider"
          aa-slider="draggable center"
          aa-duration="0.6"
          aa-autoplay="4 hover-pause"
        >
          <div className="reel-slider__track">
            {slides.map((s) => (
              <div key={s.num} className="reel-slide" aa-slider-item="">
                <div className="reel-slide__inner">
                  <span className="reel-slide__num">{s.num}</span>
                  <h3 className="reel-slide__title" aa-animate="text-fade-up" aa-split="lines mask">
                    {s.title}
                  </h3>
                  <p className="reel-slide__meta" aa-animate="fade-up" aa-delay="0.15">
                    {s.meta}
                  </p>
                </div>
              </div>
            ))}
          </div>

          <div className="reel-slider__controls">
            <button className="reel-slider__btn" aa-slider-prev="" aria-label="Previous slide">
              ←
            </button>
            <span className="reel-slider__count">
              <span aa-slider-current="">1</span> / <span aa-slider-total="">{slides.length}</span>
            </span>
            <button className="reel-slider__btn" aa-slider-next="" aria-label="Next slide">
              →
            </button>
          </div>

          <div className="reel-slider__thumbs">
            {slides.map((s, i) => (
              <button key={s.num} aa-slider-button="" aria-label={`Slide ${i + 1}`}>
                <span aa-slider-progress="width" />
              </button>
            ))}
          </div>
        </div>
      </section>
    </main>
  )
}
