// This file is used to bundle the gsap and ScrollTrigger modules
// It is also used to create the animations object that is used in the AlrdyAnimate.js file

import { gsap, ScrollTrigger } from 'gsap/all';
import { createScrollAnimations } from './gsapAnimations/scrollAnimations';
import { createTextAnimations } from './gsapAnimations/textAnimations';
import { splitText } from './textSplitter';

// Debug what we have
console.log('Initial GSAP:', gsap.version);
console.log('Initial ScrollTrigger:', ScrollTrigger);

// Force registration with core GSAP
gsap.registerPlugin(ScrollTrigger);

// Verify registration
console.log('ScrollTrigger registered:', gsap.plugins.ScrollTrigger);

// Create animations after confirmed registration
const animations = {
  ...createTextAnimations(gsap, ScrollTrigger),
  ...createScrollAnimations(gsap, ScrollTrigger)
};

// Export configured instances
export { 
  gsap, 
  ScrollTrigger, 
  animations,
  splitText 
};
