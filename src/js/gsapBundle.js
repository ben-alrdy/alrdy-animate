// This file is used to bundle the gsap and ScrollTrigger modules
// It is also used to create the animations object that is used in the AlrdyAnimate.js file

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createScrollAnimations } from './gsapAnimations/scrollAnimations';
import { createTextAnimations } from './gsapAnimations/textAnimations';
import { splitText } from './textSplitter';

gsap.registerPlugin(ScrollTrigger);

const animations = {
  ...createTextAnimations(gsap, ScrollTrigger),
  ...createScrollAnimations(gsap, ScrollTrigger)
};

export { 
  gsap, 
  ScrollTrigger, 
  animations,
  splitText 
};
