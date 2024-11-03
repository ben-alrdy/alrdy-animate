import { gsap } from 'gsap';

/** Bundle import functions mapped by type */
const bundleImports = {
    scrollText: () => import(/* webpackChunkName: "aa-scrollText" */ './scrollTextBundle').then(module => module.initScrollTextBundle),
    drag: () => import(/* webpackChunkName: "aa-drag" */ './dragBundle').then(module => module.initDragBundle)
};

/** Manages GSAP animation bundles with lazy loading and caching */
class GSAPBundleManager {
    /** Initialize manager with GSAP instance and storage */
    constructor() {
        this.gsap = gsap;
        this.loadedBundles = new Map();
        this.animations = {};
    }

    /**
     * Load and initialize an animation bundle
     * @param {string} bundleType - Bundle to load ('scrollText', 'drag')
     * @returns {Promise<Object>} Initialized bundle
     */
    async loadBundle(bundleType) {
        // Return cached bundle if already loaded
        if (this.loadedBundles.has(bundleType)) {
            return this.loadedBundles.get(bundleType);
        }

        // Validate bundle type exists
        if (!bundleImports[bundleType]) {
            throw new Error(`Unknown bundle type: ${bundleType}`);
        }

        try {
            // Dynamically import and initialize the bundle
            const initBundle = await bundleImports[bundleType]();
            const bundle = initBundle(this.gsap);
            
            // Cache the initialized bundle
            this.loadedBundles.set(bundleType, bundle);
            // Merge bundle animations into the main animations collection
            this.animations = {
                ...this.animations,
                ...bundle.animations
            };

            return bundle;
        } catch (error) {
            console.error(`Failed to load ${bundleType} bundle:`, error);
            throw error;
        }
    }

    /** Get all animations from loaded bundles */
    getAnimations() {
        return this.animations;
    }
}

export { GSAPBundleManager }; 