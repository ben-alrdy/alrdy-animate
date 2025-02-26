document.addEventListener('DOMContentLoaded', function() {
    console.log('Initializing AlrdyAnimate...');
    
    AlrdyAnimate.init({
        ease: 'back.inOut',
        duration: 1,
        again: true,
        gsapFeatures: ['scroll', 'text', 'slider', 'hover'],
        debug: true
    }).then(() => {
        console.log('AlrdyAnimate initialized successfully');
    }).catch(error => {
        console.error('Error during AlrdyAnimate initialization:', error);
    });
});
