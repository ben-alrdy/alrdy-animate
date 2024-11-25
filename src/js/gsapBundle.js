import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

// Define shared dependencies
const sharedDependencies = {
    textSplitter: () => import(/* webpackChunkName: "gsap-text" */ './textSplitter')
};

export const gsapBundles = {
    text: {
        animations: () => import(/* webpackChunkName: "gsap-text" */ './gsapAnimations/textAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    scroll: {
        animations: () => import(/* webpackChunkName: "gsap-scroll" */ './gsapAnimations/scrollAnimations')
    },
    loop: {
        plugins: () => Promise.all([
            import(/* webpackChunkName: "gsap-draggable" */ 'gsap/Draggable'),
            import(/* webpackChunkName: "gsap-draggable" */ 'gsap/InertiaPlugin')
        ]),
        animations: () => import(/* webpackChunkName: "gsap-draggable" */ './gsapAnimations/loopAnimations')
    },
    hover: {
        animations: () => import(/* webpackChunkName: "gsap-hover" */ './gsapAnimations/hoverAnimations'),
        dependencies: sharedDependencies.textSplitter
    }
};

export { gsap, ScrollTrigger };
