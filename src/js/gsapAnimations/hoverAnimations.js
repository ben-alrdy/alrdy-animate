/* 
WAVE UP

start: 'M 0 100 C 15 100, 35 70, 50 70 C 65 70, 85 100, 100 100 V 100 H 0 z',    // Rounded corners moved inward
end: 'M 0 0 C 15 -20, 35 -20, 50 -20 C 65 -20, 85 -20, 100 0 V 100 H 0 z'       // Matching structure for end state
 
*/

// SVG path definitions
const svgPaths = {
    fromTop: {
        start: 'M 0 100 V 0 Q 50 0 100 0 V 0 H 0 z',
        end: 'M 0 100 V 100 Q 50 125 100 100 V 0 H 0 z'
    },
    fromBottom: {
        start: 'M 0 0 V 100 Q 50 100 100 100 V 100 H 0 z',
        end: 'M 0 0 V 0 Q 50 -25 100 0 V 100 H 0 z'
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

// Helper functions
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
            return ['top', 'bottom'].includes(mouseDirection) ? mouseDirection : 'bottom';
        case 'horizontal':
            return ['left', 'right'].includes(mouseDirection) ? mouseDirection : 'left';
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

// Helper to parse aa-color attribute
function parseColorAttribute(attribute) {
    if (!attribute) return {};
    
    return attribute.split(' ').reduce((colors, current) => {
        const [type, value] = current.split(':').map(s => s.trim());
        if (type && value) {
            const colorMap = {
                'bg': 'backgroundColor',
                'text': 'color',
                'border': 'borderColor'
            };
            if (colorMap[type]) {
                colors[colorMap[type]] = value;
            }
        }
        return colors;
    }, {});
}

function storeOriginalColors(element) {
    const colorElements = element.querySelectorAll('[aa-color]');
    
    // Store original colors for each element with aa-color
    const originalColors = Array.from(colorElements).map(el => {
        const aaColorAttr = el.getAttribute('aa-color');
        const targetColors = parseColorAttribute(aaColorAttr);
        const computedStyle = window.getComputedStyle(el);
        
        // Only store original values for properties that are defined in aa-color
        const originalValues = {};
        if (targetColors.backgroundColor !== undefined) {
            originalValues.backgroundColor = computedStyle.backgroundColor;
        }
        if (targetColors.color !== undefined) {
            originalValues.color = computedStyle.color;
        }
        if (targetColors.borderColor !== undefined) {
            originalValues.borderColor = computedStyle.borderColor;
        }
        
        return {
            element: el,
            targetColors,
            originalColors: originalValues
        };
    });

    return originalColors;
}

function setupColorAnimation(element, timeline, isEnter, settings) {
    const { hoverDelay: delay = 0 } = settings;
    const originalColors = timeline.data?.originalColors;

    if (!originalColors || originalColors.length === 0) return;

    // Animate each element with aa-color
    originalColors.forEach(({ element: el, targetColors, originalColors: origValues }) => {
        const animProps = {
            delay: isEnter ? delay : 0,
            overwrite: true
        };

        // Animate only the properties defined in aa-color
        Object.keys(targetColors).forEach(prop => {
            animProps[prop] = isEnter ? targetColors[prop] : origValues[prop];
        });

        timeline.to(el, animProps, 0); // Start at beginning of timeline
    });
}

// Main animation functions
function initializeCurveAnimation(element, gsap, settings) {
    const {
        hoverDuration: duration,
        hoverEase: ease,
        hoverDelay: delay,
        hoverDirection,
        bg        
    } = settings;

    const bgPath = bg.querySelector('path');
    const originalColors = storeOriginalColors(element);

    function animateHover(start, end, isEnter) {
        // Kill any existing timeline on the element
        if (element.timeline) {
            element.timeline.kill();
        }

        const timeline = gsap.timeline({
            defaults: { duration, ease },
            data: { originalColors }
        });

        element.timeline = timeline; // Store timeline reference

        timeline.fromTo(bgPath, 
            { attr: { d: start } },
            { 
                attr: { d: end },
                delay: isEnter ? delay : 0
            }
        );

        setupColorAnimation(element, timeline, isEnter, settings);
        return timeline;
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
        animateHover(pathDirection.start, pathDirection.end, true);
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
        animateHover(pathDirection.start, pathDirection.end, false);
    });
}

function initializeCircleAnimation(element, gsap, settings) {
    const {
        hoverDuration: duration,
        hoverEase: ease,
        hoverDelay: delay,
        hoverDirection,
        bg   
    } = settings;

    const circle = bg.querySelector('circle');
    const elementRect = element.getBoundingClientRect();
    const offset = 10;
    const elementDiagonal = Math.sqrt(Math.pow(elementRect.width, 2) + Math.pow(elementRect.height, 2));
    const finalRadius = (elementDiagonal / elementRect.width) * 1.3;
    const originalColors = storeOriginalColors(element);

    function handleCircleHover(event, isEnter) {
        const mouseDirection = getMouseEnterDirection(event, element);
        const direction = getAdjustedDirection(mouseDirection, hoverDirection, isEnter);

        // Get mouse position relative to element using offsetX/Y
        let x = event.offsetX / elementRect.width;
        let y = event.offsetY / elementRect.height;

        switch (direction) {
            case 'left':
                x = -offset / elementRect.width;
                break;
            case 'right':
                x = 1 + offset / elementRect.width;
                break;
            case 'top':
                y = -offset / elementRect.height;
                break;
            case 'bottom':
                y = 1 + offset / elementRect.height;
                break;
        }

        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        const timeline = gsap.timeline({
            defaults: { duration, ease },
            data: { originalColors }  // Store original colors in timeline data
        });

        if (isEnter) {
            timeline.fromTo(circle,
                { attr: { r: 0 } },
                { 
                    attr: { r: finalRadius },
                    delay: delay
                },
                0
            );
        } else {
            timeline.to(circle, { attr: { r: 0 } }, 0);
        }

        setupColorAnimation(element, timeline, isEnter, settings);
    }

    element.addEventListener('mouseenter', event => handleCircleHover(event, true));
    element.addEventListener('mouseleave', event => handleCircleHover(event, false));
}

function initializeIconAnimation(element, gsap, settings) {
    const {
        hoverDuration: duration,
        hoverEase: ease,
        hoverDelay: delay,
        hoverDistance: iconDelay,
        hoverType,
        isReverse
    } = settings;

    const icon = element.querySelector('[aa-hover-icon]');
    if (!icon) return;

    function setupIconPosition(direction) {
        const iconClone = icon.cloneNode(true);
        iconClone.style.position = 'absolute';
        icon.after(iconClone);

        // Default positions and animations
        let positions = {
            clone: { left: '-100%', top: '0' },
            animation: {
                icon: { xPercent: 100 },
                clone: { xPercent: 100 }
            }
        };

        switch (direction) {
            case 'icon-right':
                // Default values are already set
                break;
            case 'icon-left':
                positions.clone = { left: '100%', top: '0' };
                positions.animation = {
                    icon: { xPercent: -100 },
                    clone: { xPercent: -100 }
                };
                break;
            case 'icon-up':
                positions.clone = { left: '0', top: '100%' };
                positions.animation = {
                    icon: { yPercent: -100 },
                    clone: { yPercent: -100 }
                };
                break;
            case 'icon-down':
                positions.clone = { left: '0', top: '-100%' };
                positions.animation = {
                    icon: { yPercent: 100 },
                    clone: { yPercent: 100 }
                };
                break;
            case 'icon-up-right':
                positions.clone = { left: '-100%', top: '100%' };
                positions.animation = {
                    icon: { xPercent: 100, yPercent: -100 },
                    clone: { xPercent: 100, yPercent: -100 }
                };
                break;
            case 'icon-down-right':
                positions.clone = { left: '-100%', top: '-100%' };
                positions.animation = {
                    icon: { xPercent: 100, yPercent: 100 },
                    clone: { xPercent: 100, yPercent: 100 }
                };
                break;
            case 'icon-up-left':
                positions.clone = { left: '100%', top: '100%' };
                positions.animation = {
                    icon: { xPercent: -100, yPercent: -100 },
                    clone: { xPercent: -100, yPercent: -100 }
                };
                break;
            case 'icon-down-left':
                positions.clone = { left: '100%', top: '-100%' };
                positions.animation = {
                    icon: { xPercent: -100, yPercent: 100 },
                    clone: { xPercent: -100, yPercent: 100 }
                };
                break;
        }

        Object.assign(iconClone.style, positions.clone);
        return { iconClone, ...positions.animation };
    }

    // Get the base direction without any reverse suffix
    const baseDirection = hoverType.replace('-reverse', '');
    
    // Setup positions for both enter and leave animations
    const { iconClone, icon: iconAnim, clone: cloneAnim } = setupIconPosition(baseDirection);

    const timeline = gsap.timeline({
        defaults: { ease, duration, delay },
        paused: true
    });

    timeline
        .to(icon, iconAnim, 0)
        .to(iconClone, cloneAnim, iconDelay);

    element.addEventListener('mouseenter', () => timeline.restart());
    if (isReverse) {
        element.addEventListener('mouseleave', () => timeline.reverse());
    } 
}

function initializeExpandAnimation(element, gsap, settings) {
    const {
        hoverDuration: duration,
        hoverEase: ease,
        hoverDelay: delay,
        bg,
        isReverse
    } = settings;

    const originalColors = storeOriginalColors(element);

    // Calculate optimal scale factor only if bg exists
    let scale;
    if (bg) {
        const elementRect = element.getBoundingClientRect();
        const bgRect = bg.getBoundingClientRect();
        
        // Calculate relative center position (0 to 1)
        const centerX = (bgRect.left + bgRect.width/2 - elementRect.left) / elementRect.width;
        const centerY = (bgRect.top + bgRect.height/2 - elementRect.top) / elementRect.height;
        
        // Find the maximum distance using the largest possible distance
        // This avoids expensive sqrt calculations for each corner
        const distanceX = Math.max(centerX, 1 - centerX) * elementRect.width;
        const distanceY = Math.max(centerY, 1 - centerY) * elementRect.height;
        
        // Use the larger of the two dimensions for scaling
        // This ensures coverage without needing to calculate diagonal distances
        const maxDistance = Math.max(distanceX, distanceY) * 2;
        const bgWidth = Math.max(bgRect.width, 1);
        
        // Add 5% buffer and round up
        scale = Math.ceil((maxDistance / bgWidth) * 1.05 );
    }

    if (isReverse) {
        const timelineIn = gsap.timeline({
            defaults: { ease, duration, delay },
            paused: true,
            data: { originalColors }
        });

        setupColorAnimation(element, timelineIn, true, settings);

        if (bg) {
            timelineIn.to(bg, { scale }, 0);
        }

        element.addEventListener('mouseenter', () => timelineIn.play());
        element.addEventListener('mouseleave', () => timelineIn.reverse());
    } else {
        const timelineIn = gsap.timeline({
            defaults: { ease, duration, delay },
            paused: true,
        });

        const timelineOut = gsap.timeline({
            defaults: { ease, duration },
            paused: true,
        });

        const colorTimeline = gsap.timeline({
            defaults: { ease, duration },
            paused: true,
            data: { originalColors }
        });

        if (bg) {
            // Create and setup background reset clone
            const bgReset = bg.cloneNode(true);
            bgReset.style.position = 'absolute';
            bgReset.style.top = '0';
            bgReset.style.left = '0';
            bgReset.style.transform = 'scale(0)';
            bgReset.style.backgroundColor = window.getComputedStyle(element).backgroundColor;
            bg.after(bgReset);

            timelineIn
                .set(bg, { scale: 1 }, 0)
                .to(bg, { scale }, 0);

            timelineOut
                .to(bgReset, {
                    scale,
                    duration: duration * 0.6,
                    ease: 'power2.in'
                })
                .set([bg, bgReset], { scale: 0 })
                .to(bg, {
                    scale: 1,
                    duration: duration * 0.4,
                    ease: 'power2.out'
                });
        }

        setupColorAnimation(element, colorTimeline, true, settings);

        element.addEventListener('mouseenter', () => {
            timelineOut.pause(0);
            timelineIn.restart();
            colorTimeline.play();
        });

        element.addEventListener('mouseleave', () => {
            timelineIn.then(() => {
                timelineOut.restart();
                colorTimeline.reverse();
            });
        });
    }
}

function initializeTextHoverAnimation(element, gsap, splitText, settings) {
    const {   
        hoverDuration: duration,
        hoverEase: ease,
        hoverDelay: delay,
        hoverDistance: textDelay,
        hoverStagger: stagger,
        split,
        isReverse,
        hoverType
    } = settings;

    const textElement = element.querySelector('[aa-hover-text]');
    if (!textElement) return;

    const width = textElement.getBoundingClientRect().width;
    const height = textElement.getBoundingClientRect().height;
    const animationType = hoverType.replace('-reverse', '');

    // Create and position clone
    const textClone = textElement.cloneNode(true);
    textClone.style.position = 'absolute';
    textClone.style.top = '0';
    textElement.after(textClone);

    // Create hover animation function
    const createHoverAnimation = (self, isClone = false) => {
        const tl = gsap.timeline({
            defaults: { ease, duration, stagger },
            paused: true,
        });

        const elements = self[split.split('&')[0]];
        
        // Setup animation based on type
        switch (animationType) {
            case 'text-slide-up':
                if (isClone) textClone.style.top = `${height}px`;
                tl.fromTo(elements,
                    { y: 0 },
                    { y: isClone ? -height : -height, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-slide-down':
                if (isClone) textClone.style.top = `-${height}px`;
                tl.fromTo(elements,
                    { y: 0 },
                    { y: isClone ? height : height, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-slide-left':
                if (isClone) textClone.style.left = `${width}px`;
                tl.fromTo(elements,
                    { x: 0 },
                    { x: isClone ? -width : -width, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-slide-right':
                if (isClone) textClone.style.left = `-${width}px`;
                tl.fromTo([...elements].reverse(),
                    { x: 0 },
                    { x: isClone ? width : width, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-fade-up':
                if (isClone) textClone.style.top = `${height / 3}px`;
                tl.fromTo(elements,
                    { y: 0, opacity: isClone ? 0 : 1 },
                    { y: isClone ? -height/3 : -height/3, opacity: isClone ? 1 : 0, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-fade-down':
                if (isClone) textClone.style.top = `-${height / 3}px`;
                tl.fromTo(elements,
                    { y: 0, opacity: isClone ? 0 : 1 },
                    { y: isClone ? height/3 : height/3, opacity: isClone ? 1 : 0, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-fade-left':
                if (isClone) textClone.style.left = `${width / 3}px`;
                tl.fromTo(elements,
                    { x: 0, opacity: isClone ? 0 : 1 },
                    { x: isClone ? -width/3 : -width/3, opacity: isClone ? 1 : 0, delay: isClone ? textDelay : delay }
                );
                break;

            case 'text-fade-right':
                if (isClone) textClone.style.left = `-${width / 3}px`;
                tl.fromTo([...elements].reverse(),
                    { x: 0, opacity: isClone ? 0 : 1 },
                    { x: isClone ? width/3 : width/3, opacity: isClone ? 1 : 0, delay: isClone ? textDelay : delay }
                );
                break;
        }

        return tl;
    };

    // Split both original and clone with onSplit callbacks
    const { splitInstance: originalInstance } = splitText(
        textElement, 
        split, 
        false,
        (self) => createHoverAnimation(self, false),
        animationType
    );

    const { splitInstance: clonedInstance } = splitText(
        textClone, 
        split, 
        true,
        (self) => createHoverAnimation(self, true),
        animationType
    );

    // Store instances for cleanup
    element.splitInstances = [originalInstance, clonedInstance];

    // Setup event listeners
    element.addEventListener('mouseenter', () => {
        if (originalInstance.timeline) {
            originalInstance.timeline.restart();
        }
        if (clonedInstance.timeline) {
            clonedInstance.timeline.restart();
        }
    });

    element.addEventListener('mouseleave', () => {
        if (isReverse) {
            if (originalInstance.timeline) {
                originalInstance.timeline.reverse();
            }
            if (clonedInstance.timeline) {
                clonedInstance.timeline.reverse();
            }
        }
    });
}

function createHoverAnimations(gsap, splitText) {
    return {
        initializeTextHover: (element, settings) => {
            initializeTextHoverAnimation(element, gsap, splitText, settings);
        },

        initializeBackgroundHover: (element, settings, type) => {
            switch (type) {
                case 'circle':
                    initializeCircleAnimation(element, gsap, settings);
                    break;
                case 'curve':
                    initializeCurveAnimation(element, gsap, settings);
                    break;
                case 'expand':
                    initializeExpandAnimation(element, gsap, settings);
                    break;
            }
        },

        initializeIconHover: (element, settings) => {
            initializeIconAnimation(element, gsap, settings);
        }
    };
}

export { createHoverAnimations }; 