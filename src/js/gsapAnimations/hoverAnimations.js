// SVG path definitions
const svgPaths = {
    fromTop: {
        start: 'M 0 100 V 0 Q 50 0 100 0 V 0 H 0 z',
        end: 'M 0 100 V 100 Q 50 125 100 100 V 0 H 0 z'
    },
    fromBottom: {
        start: 'M 0 100 V 100 Q 75 50 100 100 V 100 z',
        end: 'M 0 100 V 0 Q 50 0 100 0 V 100 z'
    },
    toTop: {
        start: 'M 0 100 V 100 Q 50 50 100 100 V 0 H 0 z',
        end: 'M 0 100 V 0 Q 50 0 100 0 V 0 H 0 z'
    },
    toBottom: {
        start: 'M 0 100 V 0 Q 50 50 100 0 V 100 z',
        end: 'M 0 100 V 100 Q 50 100 100 100 V 100 z'
    },
    fromLeft: {
        start: 'M 0 0 H 0 Q 0 50 0 100 H 0 V 0 z',
        end: 'M 0 0 H 100 Q 110 50 100 100 H 0 V 0 z'
    },
    fromRight: {
        start: 'M 100 0 H 100 Q 100 50 100 100 H 100 V 0 z',
        end: 'M 100 0 H 0 Q -10 50 0 100 H 100 V 0 z'
    },
    toLeft: {
        start: 'M 0 0 H 100 Q 75 50 100 100 H 0 V 0 z',
        end: 'M 0 0 H 0 Q 0 50 0 100 H 0 V 0 z'
    },
    toRight: {
        start: 'M 100 0 H 0 Q 25 50 0 100 H 100 V 0 z',
        end: 'M 100 0 H 100 Q 100 50 100 100 H 100 V 0 z'
    }
};

function getMouseEnterDirection(mouseEvent, item) {
    const rect = item.getBoundingClientRect();
    const edges = {
        top: Math.abs(rect.top - mouseEvent.clientY),
        bottom: Math.abs(rect.bottom - mouseEvent.clientY),
        left: Math.abs(rect.left - mouseEvent.clientX),
        right: Math.abs(rect.right - mouseEvent.clientX),
    };
    return Object.keys(edges).find(key => edges[key] === Math.min(...Object.values(edges)));
}

function getValidDirection(mouseDirection, allowedDirections) {
    switch (allowedDirections) {
        case 'all':
            return mouseDirection;
        case 'vertical':
            return ['top', 'bottom'].includes(mouseDirection) ? 
                mouseDirection : 
                'bottom';
        case 'horizontal':
            return ['left', 'right'].includes(mouseDirection) ? 
                mouseDirection : 
                'left';
        case 'bottom':
            return 'bottom';
        case 'top':
            return 'top';
        case 'left':
            return 'left';
        case 'right':
            return 'right';
        default:
            return 'bottom';
    }
}

function getAdjustedDirection(mouseDirection, hoverDirection, isEnter) {
    // First get the base valid direction
    let direction = getValidDirection(mouseDirection, hoverDirection);
    
    // Then adjust based on constraints and enter/exit state
    if (hoverDirection === 'horizontal' && !['left', 'right'].includes(mouseDirection)) {
        direction = isEnter ? 'left' : 'right';  // Enter from left, exit to right
    } else if (hoverDirection === 'vertical' && !['top', 'bottom'].includes(mouseDirection)) {
        direction = isEnter ? 'bottom' : 'top';  // Enter from bottom, exit to top
    }
    
    return direction;
}

function initializeCurveAnimation(element, gsap) {
    const bg = element.querySelector('svg');
    const bgPath = bg.querySelector('path');
    const hoverDirection = element.getAttribute('aa-hover-direction') || 'all';
    
    // Get animation settings directly
    const duration = element.hasAttribute('aa-duration') ? 
        parseFloat(element.getAttribute('aa-duration')) : 0.5;
    const ease = element.getAttribute('aa-ease') || 'power3.out';

    function animateHover(start, end) {
        return gsap.fromTo(
            bgPath,
            { attr: { d: start } },
            {
                attr: { d: end },
                duration,
                ease,
            }
        );
    }

    element.addEventListener('mouseenter', event => {
        const mouseDirection = getMouseEnterDirection(event, element);
        const direction = getAdjustedDirection(mouseDirection, hoverDirection, true);
        const paths = {
            top: svgPaths.fromTop,
            bottom: svgPaths.fromBottom,
            left: svgPaths.fromLeft,
            right: svgPaths.fromRight
        };
        const pathDirection = paths[direction] || paths.bottom;
        animateHover(pathDirection.start, pathDirection.end);
    });

    element.addEventListener('mouseleave', event => {
        const mouseDirection = getMouseEnterDirection(event, element);
        const direction = getAdjustedDirection(mouseDirection, hoverDirection, false);
        const paths = {
            top: svgPaths.toTop,
            bottom: svgPaths.toBottom,
            left: svgPaths.toLeft,
            right: svgPaths.toRight
        };
        const pathDirection = paths[direction] || paths.bottom;
        animateHover(pathDirection.start, pathDirection.end);
    });
}

function initializeCircleAnimation(element, gsap) {
    const bg = element.querySelector('svg');
    const circle = bg.querySelector('circle');
    const hoverDirection = element.getAttribute('aa-hover-direction') || 'all';
    const rect = element.getBoundingClientRect();
    const offset = 10;
    const buttonDiagonal = Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));
    const finalRadius = (buttonDiagonal / rect.width) * 1.3;

    // Get animation settings directly
    const duration = element.hasAttribute('aa-duration') ? 
        parseFloat(element.getAttribute('aa-duration')) : 1;
    const ease = element.getAttribute('aa-ease') || 'power3.out';

    function handleCircleHover(event, isEnter) {
        const mouseDirection = getMouseEnterDirection(event, element);
        const direction = getAdjustedDirection(mouseDirection, hoverDirection, isEnter);
        
        // Get mouse position relative to element
        let x = (event.clientX - rect.left) / rect.width;
        let y = (event.clientY - rect.top) / rect.height;

        switch (direction) {
            case 'left':
                x = -offset / rect.width;
                // Keep mouse y position
                break;
            case 'right':
                x = 1 + offset / rect.width;
                // Keep mouse y position
                break;
            case 'top':
                y = -offset / rect.height;
                // Keep mouse x position
                break;
            case 'bottom':
                y = 1 + offset / rect.height;
                // Keep mouse x position
                break;
        }

        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        if (isEnter) {
            gsap.fromTo(circle,
                { attr: { r: 0 } },
                {
                    attr: { r: finalRadius },
                    duration,
                    ease
                }
            );
        } else {
            gsap.to(circle, {
                attr: { r: 0 },
                duration,
                ease
            });
        }
    }

    element.addEventListener('mouseenter', event => handleCircleHover(event, true));
    element.addEventListener('mouseleave', event => handleCircleHover(event, false));
}

function createHoverAnimations(gsap) {
    function initializeHoverAnimations() {
        const elements = document.querySelectorAll('[aa-hover]');
        
        elements.forEach(element => {
            const hoverType = element.getAttribute('aa-hover');
            
            if (hoverType === 'bg-circle') {
                initializeCircleAnimation(element, gsap);
            } else if (hoverType === 'bg-curve') {
                initializeCurveAnimation(element, gsap);
            }
        });
    }

    return {
        initializeHoverAnimations
    };
}

export { createHoverAnimations }; 