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
    const bg = element.querySelector('[aa-hover-bg]');
    const bgPath = bg.querySelector('path');
    const hoverTexts = element.querySelectorAll('[aa-hover-text]');
    const hoverColor = element.getAttribute('aa-hover-color');
    const originalColors = {};
    const hoverDirection = element.getAttribute('aa-hover-direction') || 'all';

    // Store the original text colors
    if (hoverTexts.length && hoverColor) {
        hoverTexts.forEach((text, index) => {
            originalColors[index] = window.getComputedStyle(text).color;
        });
    }

    // Get animation settings directly
    const duration = element.hasAttribute('aa-duration') ?
        parseFloat(element.getAttribute('aa-duration')) : 0.5;
    const ease = element.getAttribute('aa-ease') || 'power3.out';

    function animateHover(start, end, isEnter) {
        const timeline = gsap.timeline({
            defaults: { duration, ease }
        });

        // Animate the path
        timeline.fromTo(
            bgPath,
            { attr: { d: start } },
            { attr: { d: end } }
        );

        // Add color animation if texts and hover color exist
        if (hoverTexts.length && hoverColor) {
            hoverTexts.forEach((text, index) => {
                timeline.fromTo(
                    text,
                    { color: isEnter ? originalColors[index] : hoverColor },
                    { color: isEnter ? hoverColor : originalColors[index] },
                    0 // Start at same time as path animation
                );
            });
        }

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

function initializeCircleAnimation(element, gsap) {
    const bg = element.querySelector('[aa-hover-bg]');
    const circle = bg.querySelector('circle');
    const hoverText = element.querySelector('[aa-hover-text]');
    const hoverColor = element.getAttribute('aa-hover-color');
    const hoverDirection = element.getAttribute('aa-hover-direction') || 'all';
    const rect = element.getBoundingClientRect();
    const offset = 10;
    const buttonDiagonal = Math.sqrt(Math.pow(rect.width, 2) + Math.pow(rect.height, 2));
    const finalRadius = (buttonDiagonal / rect.width) * 1.3;

    // Store the original text color
    const originalColor = hoverText ? window.getComputedStyle(hoverText).color : null;

    // Get animation settings directly
    const duration = element.hasAttribute('aa-duration') ?
        parseFloat(element.getAttribute('aa-duration')) : 1;
    const ease = element.getAttribute('aa-ease') || 'power3.out';

    function handleCircleHover(event, isEnter) {
        const mouseDirection = getMouseEnterDirection(event, element);
        const direction = getAdjustedDirection(mouseDirection, hoverDirection, isEnter);

        // Get mouse position relative to element using offsetX/Y
        let x = event.offsetX / rect.width;
        let y = event.offsetY / rect.height;

        switch (direction) {
            case 'left':
                x = -offset / rect.width;
                break;
            case 'right':
                x = 1 + offset / rect.width;
                break;
            case 'top':
                y = -offset / rect.height;
                break;
            case 'bottom':
                y = 1 + offset / rect.height;
                break;
        }

        circle.setAttribute('cx', x);
        circle.setAttribute('cy', y);

        const timeline = gsap.timeline({
            defaults: { duration, ease }
        });

        if (isEnter) {
            timeline
                .fromTo(circle,
                    { attr: { r: 0 } },
                    { attr: { r: finalRadius } },
                    0
                );

            if (hoverText && hoverColor) {
                timeline.fromTo(
                    hoverText,
                    { color: originalColor },
                    { color: hoverColor },
                    0
                );
            }
        } else {
            timeline
                .to(circle, { attr: { r: 0 } }, 0);

            if (hoverText && hoverColor) {
                timeline.to(hoverText, { color: originalColor }, 0);
            }
        }
    }

    element.addEventListener('mouseenter', event => handleCircleHover(event, true));
    element.addEventListener('mouseleave', event => handleCircleHover(event, false));
}

function initializeIconAnimation(element, gsap) {
    // Common setup
    const icon = element.querySelector('[aa-hover-icon]');
    const bg = element.querySelector('[aa-hover-bg]');
    const isReverse = element.getAttribute('aa-hover').includes('reverse');

    // Calculate optimal scale factor
    const elementRect = element.getBoundingClientRect();
    const bgRect = bg.getBoundingClientRect();
    const scaleX = Math.ceil(elementRect.width / bgRect.width * 2);
    const scaleY = Math.ceil(elementRect.height / bgRect.height * 2);
    const scale = Math.max(scaleX, scaleY);

    // Get animation settings
    const duration = element.hasAttribute('aa-duration') ?
        parseFloat(element.getAttribute('aa-duration')) : 0.5;
    const ease = element.getAttribute('aa-ease') || 'power3.inOut';
    const delay = element.hasAttribute('aa-delay') ?
        parseFloat(element.getAttribute('aa-delay')) : 0.1;
    const iconDirection = element.getAttribute('aa-hover-direction') || 'right';

    // Create and setup icon clone
    const iconClone = icon.cloneNode(true);
    iconClone.style.position = 'absolute';
    icon.after(iconClone);

    // Setup icon position based on direction
    function setupIconPosition() {
        switch (iconDirection) {
            case 'right':
                iconClone.style.left = '-100%';
                iconClone.style.top = '0';
                return {
                    icon: { xPercent: 100 },
                    clone: { xPercent: 100 }
                };
            case 'up-right':
                iconClone.style.left = '-100%';
                iconClone.style.top = '100%';
                return {
                    icon: { xPercent: 100, yPercent: -100 },
                    clone: { xPercent: 100, yPercent: -100 }
                };
            case 'down-right':
                iconClone.style.left = '-100%';
                iconClone.style.top = '-100%';
                return {
                    icon: { xPercent: 100, yPercent: 100 },
                    clone: { xPercent: 100, yPercent: 100 }
                };
        }
    }

    const iconAnimations = setupIconPosition();

    if (isReverse) {
        // Create and setup reverse animation timeline
        const timelineIn = gsap.timeline({
            defaults: { ease, duration },
            paused: true,
        });

        timelineIn
            .to(icon, iconAnimations.icon, 0)
            .to(iconClone, iconAnimations.clone, delay)
            .to(bg, { scale }, 0);

        // Add reverse animation event listeners
        element.addEventListener('mouseenter', () => timelineIn.play());
        element.addEventListener('mouseleave', () => timelineIn.reverse());

    } else {
        // Create and setup background reset clone
        const bgReset = bg.cloneNode(true);
        bgReset.style.position = 'absolute';
        bgReset.style.top = '0';
        bgReset.style.left = '0';
        bgReset.style.transform = 'scale(0)';
        bgReset.style.backgroundColor = window.getComputedStyle(element).backgroundColor;
        bg.after(bgReset);

        // Create hover in/out timelines
        const timelineIn = gsap.timeline({
            defaults: { ease, duration },
            paused: true,
        });

        const timelineOut = gsap.timeline({
            defaults: { ease, duration },
            paused: true,
        });

        // Setup hover in animation
        timelineIn
            .set(bg, { scale: 1 }, 0)
            .to(bg, { scale }, 0)
            .to(icon, iconAnimations.icon, 0)
            .to(iconClone, iconAnimations.clone, delay);

        // Setup hover out animation
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

        // Add non-reverse animation event listeners
        element.addEventListener('mouseenter', () => {
            timelineOut.pause(0);
            timelineIn.restart();
        });

        element.addEventListener('mouseleave', () => {
            timelineIn.then(() => timelineOut.restart());
        });
    }
}

function initializeTextHoverAnimation(element, gsap, splitText) {
    const textElement = element.querySelector('[aa-hover-text]');
    if (!textElement) return;
    const width = textElement.getBoundingClientRect().width;
    const height = textElement.getBoundingClientRect().height;

    // Get animation settings
    const animationType = element.getAttribute('aa-hover').replace('-reverse', '');
    const isReverse = element.getAttribute('aa-hover').includes('reverse');
    const stagger = element.hasAttribute('aa-stagger') ? parseFloat(element.getAttribute('aa-stagger')) : 0.02;
    const delay = element.hasAttribute('aa-delay') ? parseFloat(element.getAttribute('aa-delay')) : 0;
    const duration = element.hasAttribute('aa-duration') ? parseFloat(element.getAttribute('aa-duration')) : 0.3;
    const ease = element.getAttribute('aa-ease') || 'power3.inOut';
    const split = element.getAttribute('aa-split') || 'chars';
    const splitType = split.split('.')[0]; // Gets 'chars' or 'words' from potential 'chars.clip'

    // Create and position clone
    const textClone = textElement.cloneNode(true);
    textClone.style.position = 'absolute';
    textClone.style.top = '0';
    textElement.after(textClone);

    // Split both original and clone
    const { splitResult: textSplit } = splitText(textElement, split);
    const { splitResult: clonedSplit } = splitText(textClone, split);

    // Get the correct elements to animate based on split type
    const originalElements = textSplit[splitType];
    const clonedElements = clonedSplit[splitType];

    // Create timeline
    const timeline = gsap.timeline({
        defaults: { ease, duration, stagger },
        paused: true,
    });

    // Setup animation based on type
    switch (animationType) {
        case 'text-slide-up':
            textClone.style.top = `${height}px`;
            timeline
                .fromTo(originalElements,
                    { y: 0 },
                    { y: -height }
                )
                .fromTo(clonedElements,
                    { y: 0 },
                    { y: -height, delay },
                    '<'
                );
            break;

        case 'text-slide-down':
            textClone.style.top = `-${height}px`;
            timeline
                .fromTo(originalElements,
                    { y: 0 },
                    { y: height }
                )
                .fromTo(clonedElements,
                    { y: 0 },
                    { y: height, delay },
                    '<'
                );
            break;

        case 'text-slide-left':
            textClone.style.left = `${width}px`;
            timeline
                .fromTo(originalElements,
                    { x: 0 },
                    { x: -width }
                )
                .fromTo(clonedElements,
                    { x: 0 },
                    { x: -width, delay },
                    '<'
                );
            break;

        case 'text-slide-right':
            textClone.style.left = `-${width}px`;
            timeline
                .fromTo([...originalElements].reverse(),
                    { x: 0 },
                    { x: width }
                )
                .fromTo([...clonedElements].reverse(),
                    { x: 0 },
                    { x: width, delay },
                    '<'
                );
            break;

        case 'text-fade-up':
            textClone.style.top = `${height / 3}px`;
            timeline
                .fromTo(originalElements,
                    { y: 0, opacity: 1 },
                    { y: -height / 3, opacity: 0 }
                )
                .fromTo(clonedElements,
                    { y: 0, opacity: 0 },
                    { y: -height / 3, opacity: 1, delay },
                    '<'
                );
            break;

        case 'text-fade-down':
            textClone.style.top = `-${height / 3}px`;
            timeline
                .fromTo(originalElements,
                    { y: 0, opacity: 1 },
                    { y: height / 3, opacity: 0 }
                )
                .fromTo(clonedElements,
                    { y: 0, opacity: 0 },
                    { y: height / 3, opacity: 1, delay },
                    '<'
                );
            break;

        case 'text-fade-left':
            textClone.style.left = `${width / 3}px`;
            timeline
                .fromTo(originalElements,
                    { x: 0, opacity: 1 },
                    { x: -width / 3, opacity: 0 }
                )
                .fromTo(clonedElements,
                    { x: 0, opacity: 0 },
                    { x: -width / 3, opacity: 1, delay },
                    '<'
                );
            break;

        case 'text-fade-right':
            textClone.style.left = `-${width / 3}px`;
            timeline
                .fromTo([...originalElements].reverse(),
                    { x: 0, opacity: 1 },
                    { x: width / 3, opacity: 0 }
                )
                .fromTo([...clonedElements].reverse(),
                    { x: 0, opacity: 0 },
                    { x: width / 3, opacity: 1, delay },
                    '<'
                );
            break;
    }

    // Add hover events
    element.addEventListener('mouseenter', () => {
        timeline.restart();
    });

    element.addEventListener('mouseleave', () => {
        if (isReverse) {
            timeline.reverse();
        }
    });
}

function createHoverAnimations(gsap, splitText) {
    function initializeHoverAnimations() {
        const elements = document.querySelectorAll('[aa-hover]');

        elements.forEach(element => {
            const hoverType = element.getAttribute('aa-hover');

            if (hoverType.startsWith('text-')) {
                initializeTextHoverAnimation(element, gsap, splitText);
            } else {
                switch (hoverType) {
                    case 'bg-circle':
                        initializeCircleAnimation(element, gsap);
                        break;
                    case 'bg-curve':
                        initializeCurveAnimation(element, gsap);
                        break;
                    case 'bg-icon-reverse':
                        initializeIconAnimation(element, gsap);
                        break;
                    case 'bg-icon':
                        initializeIconAnimation(element, gsap);
                        break;
                }
            }
        });
    }

    return {
        initializeHoverAnimations
    };
}

export { createHoverAnimations }; 