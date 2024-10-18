// This file is used to bundle the gsap and ScrollTrigger modules
// It is also used to create the animations object that is used in the AlrdyAnimate.js file

import { gsap } from 'gsap';
import { ScrollTrigger } from 'gsap/ScrollTrigger';
import SplitType from 'split-type';
import { createAnimations } from './gsapAnimations';

gsap.registerPlugin(ScrollTrigger);

const animations = createAnimations(gsap, SplitType);

export { gsap, ScrollTrigger, animations };
