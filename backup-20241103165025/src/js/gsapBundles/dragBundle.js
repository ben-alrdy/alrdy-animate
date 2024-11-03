import { Draggable } from 'gsap/Draggable';
import { createDragAnimations } from '../gsapAnimations/dragAnimations';

const initDragBundle = (gsap) => {
    gsap.registerPlugin(Draggable);
    const dragAnimations = createDragAnimations(gsap, Draggable);
    
    return {
        plugins: { Draggable },
        animations: dragAnimations
    };
};

export { initDragBundle }; 