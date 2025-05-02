document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing AlrdyAnimate...');
    
    AlrdyAnimate.init({
        ease: 'power2.inOut',
        duration: 1,
        again: true,
        gsapFeatures: ['scroll', 'text', 'slider', 'hover'],
        debug: true,
        modals: true,
        smoothScroll: {
            enabled: true,
            options: {
                lerp: 0.12
            }
        }
    }).then(() => {
        console.log('AlrdyAnimate initialized successfully');
        if (lenis) {
            console.log('Lenis options:', lenis.options);
        }
    }).catch(error => {
        console.error('Error during AlrdyAnimate initialization:', error);
    });
});
