import { ScrollTrigger } from 'gsap/ScrollTrigger';
import { createTextAnimations } from '../gsapAnimations/textAnimations';
import { createScrollAnimations } from '../gsapAnimations/scrollAnimations';
import { splitText } from '../textSplitter';

const initScrollTextBundle = (gsapInstance) => {
    console.log('Initializing scroll text bundle');
    
    // Register ScrollTrigger with the passed gsap instance
    console.log('Registering ScrollTrigger...');
    gsapInstance.registerPlugin(ScrollTrigger);
    
    // Verify registration by checking if ScrollTrigger is attached to gsap instance
    console.log('ScrollTrigger on GSAP instance?', !!gsapInstance.ScrollTrigger);
    
    // Create animations
    const textAnimations = createTextAnimations(gsapInstance, ScrollTrigger, splitText);
    const scrollAnimations = createScrollAnimations(gsapInstance, ScrollTrigger);
    
    const bundle = {
        plugins: { 
            ScrollTrigger: gsapInstance.ScrollTrigger || ScrollTrigger 
        },
        animations: {
            ...textAnimations,
            ...scrollAnimations
        },
        utils: { splitText }
    };
    
    return bundle;
};

export { initScrollTextBundle }; 