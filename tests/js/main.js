document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing AlrdyAnimate...');
    
    AlrdyAnimate.init({
        ease: 'power2.inOut',
        duration: 1,
        again: true,
        gsapFeatures: ['scroll', 'text', 'slider', 'hover', 'flip'],
        debug: true,
        modals: true,
        includeGSAP: true,
        lowPowerAnimations: true,
        smoothScroll: {
            enabled: false,
            options: {
                lerp: 0.12
            }
        }
    }).then(() => {
        console.log('AlrdyAnimate initialized successfully');
    
    }).catch(error => {
        console.error('Error during AlrdyAnimate initialization:', error);
    });
});
