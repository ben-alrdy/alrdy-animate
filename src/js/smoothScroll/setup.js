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

    // Initialize scroll-to functionality
    function initScrollToAnchors() {
        document.querySelectorAll("[aa-scroll-target]").forEach(element => {
            element.addEventListener("click", function(e) {
                e.preventDefault();
                
                const targetSelector = this.getAttribute("aa-scroll-target");
                const duration = parseFloat(this.getAttribute("aa-duration")) || 1.2;
                const offset = parseFloat(this.getAttribute("aa-distance")) || 0;

                lenis.scrollTo(targetSelector, {
                    offset,
                    duration,
                    // Quartic easing function for smooth acceleration and deceleration
                    easing: (x) => (x < 0.5 ? 8 * x * x * x * x : 1 - Math.pow(-2 * x + 2, 4) / 2)
                });
            });
        });
    }

    initScrollToAnchors();

    return lenis;
} 