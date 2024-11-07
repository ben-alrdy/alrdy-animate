// Store gsap at module level
let gsap = null;
let ScrollTrigger = null;

// Helper function to get scroll trigger values
const getScrollTriggerValues = (isMobile) => {
    return {
        start: isMobile ? "top 40%" : "top 80%",
        end: isMobile ? "top 20%" : "top 40%"
    };
};

// Helper function to create the base timeline with all attributes from the element
function baseTimeline(element, splitResult, splitType, duration, stagger, delay, ease, scroll, start, end) {
    const tl = gsap.timeline();

    const baseProps = {
        duration,
        stagger,
        ease,
        delay,
        ...(scroll && {
            scrollTrigger: {
                trigger: element,
                start,
                end,
                scrub: scroll.includes('smooth') ? 2 :
                    scroll.includes('snap') ? { snap: 0.2 } :
                        true
            }
        }),
        onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
    };

    let animationTarget;

    if (splitType === 'lines&words') {
        animationTarget = (animationProps) => {
            splitResult.lines.forEach((line, index) => {
                const wordsInLine = splitResult.words.filter(word => line.contains(word));
                tl.from(wordsInLine, {
                    ...baseProps,
                    ...animationProps,
                }, index * stagger * 3); // Delay each line
            });
        };
    } else {
        animationTarget = splitResult[splitType];
    }

    return { tl, baseProps, animationTarget };
}

// Helper function to create the timeline with the specific animation properties
function createTimeline(animationProps) {
    return (element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll) => {
        const { start, end } = getScrollTriggerValues(isMobile);
        const { tl, baseProps, animationTarget } = baseTimeline(element, splitResult, splitType, duration, stagger, delay, ease, scroll, start, end);

        // Check if this is a fade animation (opacity is defined and greater than 0)
        const isFadeAnimation = 'opacity' in animationProps && animationProps.opacity > 0;

        if (!isFadeAnimation) {
            // Set initial opacity of the whole element only for non-fade animations
            tl.set(element, { autoAlpha: 0 });
        }

        // If the animationTarget is a function (i.e. lines&words split type), call it with the animationProps
        if (typeof animationTarget === 'function') {
            animationTarget(animationProps);
        }
        // Otherwise, add the animationProps to the baseProps and add them to the timeline 
        else {
            tl.from(animationTarget, {
                ...baseProps,
                ...animationProps
            }, ">"); // Starts the animation after the previous animation
        }

        return tl;
    };
}

// Function to create all the animations
export function createTextAnimations(gsapInstance, ScrollTriggerInstance) {
    gsap = gsapInstance; // Store gsap instance
    ScrollTrigger = ScrollTriggerInstance; // Store ScrollTrigger instance

    return {
        textSlideUp: createTimeline({
            y: "110%",
            opacity: 0,
        }),
        textSlideDown: createTimeline({
            y: "-110%",
            opacity: 0,
        }),
        textTiltUp: createTimeline({
            y: "110%",
            opacity: 0,
            rotation: 10,
        }),
        textTiltDown: createTimeline({
            y: "-110%",
            opacity: 0,
            rotation: -10,
        }),
        textFadeSoft: createTimeline({
            opacity: 0.3
        }),
        textFade: createTimeline({
            opacity: 0
        }),
        textRotateSoft: (element, splitResult, splitType, duration, stagger, delay, ease, isMobile, scroll) => {

            const animationTarget = splitResult[splitType] || splitResult.lines;       // Determine the animation target based on the split type or defaulting to lines
            const tl = gsap.timeline();

            const { start, end } = getScrollTriggerValues(isMobile);

            // Calculate perspective in pixels based on font size
            const computedStyle = window.getComputedStyle(element);
            const fontSize = parseFloat(computedStyle.fontSize);
            const perspectiveInPixels = fontSize * 5; // 3em

            // Add perspective wrapper around each line
            animationTarget.forEach(line => {
                const wrapper = document.createElement('div');
                wrapper.classList.add('line-perspective-wrapper');
                line.parentNode.insertBefore(wrapper, line); // insert the wrapper before the line  
                wrapper.appendChild(line); // append the line to the wrapper
            });


            // Set initial opacity of the whole element
            tl.set(element, {
                autoAlpha: 0
            });

            tl.set('.line-perspective-wrapper', {
                transformStyle: 'preserve-3d',
                perspective: perspectiveInPixels
            });

            tl.set(animationTarget, {
                transformOrigin: '50% 0%'
            });

            // Animate each split element
            tl.from(animationTarget, {
                autoAlpha: 0,
                rotateX: -90,
                y: '100%',
                scaleX: 0.75,
                duration,
                stagger,
                ease,
                delay,
                ...(scroll && { // if scroll is not null
                    scrollTrigger: {
                        trigger: element,
                        start,
                        end,
                        scrub: scroll.includes('smooth') ? 2 :
                            scroll.includes('snap') ? { snap: 0.2 } :
                                true
                    }
                }),
                onStart: () => gsap.set(element, { autoAlpha: 1 }) // Make the whole element visible when animation starts
            });

            return tl;
        }
    };
}