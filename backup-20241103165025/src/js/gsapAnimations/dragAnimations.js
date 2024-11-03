export function createDragAnimations(gsap, Draggable) {
    return {
        createDraggable: (element, options = {}) => {
            const defaults = {
                type: 'x,y',
                inertia: true,
                bounds: null,
                resistance: 1000,
                throwResistance: 3500,
                onDragStart: () => {},
                onDrag: () => {},
                onDragEnd: () => {},
                snap: null
            };

            const config = { ...defaults, ...options };
            return Draggable.create(element, config)[0];
        }
    };
} 