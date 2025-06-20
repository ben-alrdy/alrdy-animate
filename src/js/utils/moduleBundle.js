// Define shared dependencies
const sharedDependencies = {
    textSplitter: () => import(/* webpackChunkName: "gsap-text" */ './textSplitter'),
    splitTextPlugin: (includeGSAP) => includeGSAP ? 
        import(/* webpackChunkName: "gsap-text" */ 'gsap/SplitText').then(mod => [{ SplitText: mod.SplitText }]) :
        Promise.resolve([{ SplitText: window.SplitText }])
};

// Function to get GSAP modules
export const getGSAPModules = async (includeGSAP = true) => {
    if (includeGSAP) {
        // Import GSAP from our bundle
        const { gsap } = await import(/* webpackChunkName: "gsap-core" */ 'gsap');
        const { ScrollTrigger } = await import(/* webpackChunkName: "gsap-core" */ 'gsap/ScrollTrigger');
        return { gsap, ScrollTrigger };
    } else {
        // Use GSAP from Webflow
        return {
            gsap: window.gsap,
            ScrollTrigger: window.ScrollTrigger
        };
    }
};

// GSAP-related bundles
export const gsapBundles = {
    text: {
        plugins: (includeGSAP) => sharedDependencies.splitTextPlugin(includeGSAP),
        animations: () => import(/* webpackChunkName: "gsap-text" */ '../gsapAnimations/textAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    section: {
        animations: () => import(/* webpackChunkName: "gsap-section" */ '../gsapAnimations/sectionAnimations')
    },
    appear: {
        animations: () => import(/* webpackChunkName: "gsap-appear" */ '../gsapAnimations/appearAnimations')
    },
    marquee: {
        animations: () => import(/* webpackChunkName: "gsap-marquee" */ '../gsapAnimations/marqueeAnimations')
    },
    slider: {
        plugins: (includeGSAP) => includeGSAP ? 
            Promise.all([
                import(/* webpackChunkName: "gsap-draggable" */ 'gsap/Draggable').then(mod => ({ Draggable: mod.Draggable })),
                import(/* webpackChunkName: "gsap-draggable" */ 'gsap/InertiaPlugin').then(mod => ({ InertiaPlugin: mod.InertiaPlugin }))
            ]) :
            Promise.resolve([
                { Draggable: window.Draggable },
                { InertiaPlugin: window.InertiaPlugin }
            ]),
        animations: () => import(/* webpackChunkName: "gsap-draggable" */ '../gsapAnimations/sliderAnimations')
    },
    hover: {
        plugins: (includeGSAP) => sharedDependencies.splitTextPlugin(includeGSAP),
        animations: () => import(/* webpackChunkName: "gsap-hover" */ '../gsapAnimations/hoverAnimations'),
        dependencies: sharedDependencies.textSplitter
    },
    nav: {
        animations: () => import(/* webpackChunkName: "gsap-nav" */ '../gsapAnimations/navAnimations')
    },
    flip: {
        plugins: (includeGSAP) => includeGSAP ?
            import(/* webpackChunkName: "gsap-flip" */ 'gsap/Flip').then(mod => [{ Flip: mod.Flip }]) :
            Promise.resolve([{ Flip: window.Flip }])
    },
    modal: {
        animations: () => import(/* webpackChunkName: "gsap-modal" */ '../gsapAnimations/modalAnimations')
    }
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