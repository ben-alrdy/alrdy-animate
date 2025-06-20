document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing AlrdyAnimate...');
    
    AlrdyAnimate.init({
        ease: 'power2.inOut',
        duration: 1,
        again: true,
        gsapFeatures: ['section', 'appear', 'marquee', 'text', 'slider', 'hover', 'nav', 'modal'],
        debug: false,
        modals: false,
        includeGSAP: true,
        templates: {
            theme: 'tilt',
            custom: {
                'heading-style-h2': {
                animationType: 'text-tilt-up-lines',
                split: 'lines',
                ease: 'power4.out',
                duration: 0.9,
                stagger: 0.1,
                },
                'heading-style-h3': {
                animationType: 'text-tilt-up-lines',
                split: 'lines',
                ease: 'power4.out',
                duration: 0.7,
                stagger: 0.1,
                },
                'text-size-medium': {
                animationType: 'text-slide-up-lines',
                split: 'lines',
                ease: 'power4.out',
                duration: 0.5,
                stagger: 0.02,
                }
            }
        },
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
