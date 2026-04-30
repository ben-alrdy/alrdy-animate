declare namespace JSX {
  interface AlrdyAnimateAttributes {
    'aa-animate'?: string
    'aa-animate-sm'?: string
    'aa-animate-md'?: string
    'aa-animate-lg'?: string
    'aa-animate-xl'?: string
    'aa-trigger'?: string
    'aa-trigger-sm'?: string
    'aa-trigger-md'?: string
    'aa-trigger-lg'?: string
    'aa-trigger-xl'?: string
    'aa-split'?: string
    'aa-split-sm'?: string
    'aa-split-md'?: string
    'aa-split-lg'?: string
    'aa-split-xl'?: string
    'aa-stagger'?: string | number
    'aa-stagger-sm'?: string | number
    'aa-stagger-md'?: string | number
    'aa-stagger-lg'?: string | number
    'aa-stagger-xl'?: string | number
    'aa-duration'?: string | number
    'aa-duration-sm'?: string | number
    'aa-duration-md'?: string | number
    'aa-duration-lg'?: string | number
    'aa-duration-xl'?: string | number
    'aa-delay'?: string | number
    'aa-delay-sm'?: string | number
    'aa-delay-md'?: string | number
    'aa-delay-lg'?: string | number
    'aa-delay-xl'?: string | number
    'aa-ease'?: string
    'aa-ease-sm'?: string
    'aa-ease-md'?: string
    'aa-ease-lg'?: string
    'aa-ease-xl'?: string
    'aa-distance'?: string | number
    'aa-distance-sm'?: string | number
    'aa-distance-md'?: string | number
    'aa-distance-lg'?: string | number
    'aa-distance-xl'?: string | number
    'aa-scroll-start'?: string
    'aa-scroll-start-sm'?: string
    'aa-scroll-start-md'?: string
    'aa-scroll-start-lg'?: string
    'aa-scroll-start-xl'?: string
    'aa-scroll-end'?: string
    'aa-scroll-end-sm'?: string
    'aa-scroll-end-md'?: string
    'aa-scroll-end-lg'?: string
    'aa-scroll-end-xl'?: string
    'aa-scrub'?: string | number
    'aa-children'?: '' | boolean
    'aa-anchor'?: string

    // Feature anchors
    'aa-accordion'?: string | boolean
    'aa-accordion-toggle'?: string
    'aa-accordion-content'?: string
    'aa-accordion-wrapper'?: string | boolean
    'aa-accordion-progress'?: string | boolean
    'aa-accordion-status'?: string
    'aa-accordion-initial'?: string
    'aa-accordion-visual'?: string

    'aa-marquee'?: string | boolean
    'aa-marquee-scroller'?: string | boolean
    'aa-marquee-items'?: string | number

    'aa-nav'?: string | boolean
    'aa-nav-section'?: string
    'aa-nav-current-indicator'?: string | boolean
    'aa-nav-hover-indicator'?: string | boolean
    'aa-scroll-target'?: string

    'aa-slider'?: string | boolean
    'aa-slider-item'?: string | boolean
    'aa-slider-prev'?: string | boolean
    'aa-slider-next'?: string | boolean
    'aa-slider-button'?: string

    'aa-modal-name'?: string
    'aa-modal-target'?: string
    'aa-modal-close'?: string | boolean
    'aa-modal-backdrop'?: string | boolean
  }

  interface IntrinsicAttributes extends AlrdyAnimateAttributes {}

  interface HTMLAttributes<T> extends AlrdyAnimateAttributes {}
}

export {}
