export function initializeSmoothScroll(Lenis, gsap, ScrollTrigger, options = {}) {
    const defaultOptions = {
        lerp: 0.12,
        orientation: 'vertical',
        gestureOrientation: 'vertical',
        smoothWheel: true,
        wheelMultiplier: 1,
        touchMultiplier: 2,
        infinite: false
    };

    const lenis = new Lenis({ ...defaultOptions, ...options });

    // Connect with GSAP if available
    if (gsap && ScrollTrigger) {
        lenis.on('scroll', ScrollTrigger.update);
        
        gsap.ticker.add((time) => {
            lenis.raf(time * 1000);
        });
        
        gsap.ticker.lagSmoothing(0);
    } else {
        // Fallback to requestAnimationFrame
        function raf(time) {
            lenis.raf(time);
            requestAnimationFrame(raf);
        }
        requestAnimationFrame(raf);
    }

    return lenis;
} 