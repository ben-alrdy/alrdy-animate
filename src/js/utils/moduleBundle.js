import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { TextPlugin } from 'gsap/TextPlugin';
import { SplitText } from 'gsap/SplitText';
import { Flip } from 'gsap/Flip';

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
            import(/* webpackChunkName: "gsap-draggable" */ 'gsap/Draggable'),
            import(/* webpackChunkName: "gsap-draggable" */ 'gsap/InertiaPlugin')
        ]),
        animations: () => import(/* webpackChunkName: "gsap-draggable" */ '../gsapAnimations/sliderAnimations')
    },
    hover: {
        animations: () => import(/* webpackChunkName: "gsap-hover" */ '../gsapAnimations/hoverAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    flip: {
        plugins: () => Promise.resolve([{ Flip }]),
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

export { gsap, ScrollTrigger, TextPlugin, SplitText, Flip }; 