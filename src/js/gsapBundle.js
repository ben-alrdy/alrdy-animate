import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';

export const animationModules = {
  text: {
    animations: () => import(/* webpackChunkName: "gsap-text" */ './gsapAnimations/textAnimations'),
    dependencies: () => import(/* webpackChunkName: "gsap-text" */ './textSplitter')
  },
  scroll: {
    animations: () => import(/* webpackChunkName: "gsap-scroll" */ './gsapAnimations/scrollAnimations')
  },
  draggable: {
    // Load both plugins in parallel
    plugins: () => Promise.all([
      import(/* webpackChunkName: "gsap-draggable" */ 'gsap/Draggable'),
      import(/* webpackChunkName: "gsap-draggable" */ 'gsap/InertiaPlugin')
    ]),
    animations: () => import(/* webpackChunkName: "gsap-draggable" */ './gsapAnimations/draggableAnimations')
  }
};

export { gsap, ScrollTrigger };
