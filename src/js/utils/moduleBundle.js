import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { SplitText } from 'gsap/SplitText';

// Define shared dependencies
const sharedDependencies = {
    textSplitter: () => import(/* webpackChunkName: "gsap-text" */ './textSplitter')
};

// GSAP-related bundles
export const gsapBundles = {
    text: {
        plugins: () => Promise.resolve([{ TextPlugin, SplitText }]),
        animations: () => import(/* webpackChunkName: "gsap-text" */ '../gsapAnimations/textAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    scroll: {
        animations: () => import(/* webpackChunkName: "gsap-scroll" */ '../gsapAnimations/scrollAnimations')
    },
    slider: {
        plugins: () => Promise.all([
            import('gsap/Draggable').then(mod => ({ Draggable: mod.Draggable })),
            import('gsap/InertiaPlugin').then(mod => ({ InertiaPlugin: mod.InertiaPlugin }))
        ]),
        animations: () => import(/* webpackChunkName: "gsap-draggable" */ '../gsapAnimations/sliderAnimations')
    },
    hover: {
        animations: () => import(/* webpackChunkName: "gsap-hover" */ '../gsapAnimations/hoverAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    flip: {
        plugins: () => import(/* webpackChunkName: "gsap-flip" */ 'gsap/Flip').then(mod => [{ Flip: mod.Flip }]),
    },
};

// Non-GSAP bundles
export const coreBundles = {
    smoothScroll: {
        plugins: () => import(/* webpackChunkName: "lenis" */ 'lenis'),
        setup: () => import(/* webpackChunkName: "lenis" */ '../smoothScroll/setup')
    },
    modals: {
        setup: () => import(/* webpackChunkName: "modals" */ '../modals/setup')
    }
};

export { gsap, ScrollTrigger, SplitText }; 