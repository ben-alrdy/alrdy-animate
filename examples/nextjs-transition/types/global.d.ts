import 'alrdy-animate/jsx'

declare global {
  interface Window {
    gsap: typeof import('gsap').gsap
    ScrollTrigger: typeof import('gsap/ScrollTrigger').ScrollTrigger
    SplitText: typeof import('gsap/SplitText').SplitText
    CustomEase: typeof import('gsap/CustomEase').CustomEase
    Flip: typeof import('gsap/Flip').Flip
    Draggable: typeof import('gsap/Draggable').Draggable
    InertiaPlugin: typeof import('gsap/InertiaPlugin').InertiaPlugin
    Lenis: typeof import('lenis').default
    lenis?: InstanceType<typeof import('lenis').default>
  }
}

export {}
