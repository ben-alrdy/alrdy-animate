# AlrdyAnimate Library

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
  - [Using CDN](#using-cdn)
  - [Using NPM](#using-npm)
  - [Configuration Options](#configuration-options)
- [CSS Animations triggered on scroll (via JS)](#css-animations-triggered-on-scroll-via-js)
- [CSS Animations triggered instantly (CSS only)](#css-animations-triggered-instantly-css-only)
- [Animation Types](#animation-types)
  - [Scroll Animations](#scroll-animations)
  - [Instant Animations](#instant-animations)
  - [3D Animations](#3d-animations)
- [GSAP Features](#gsap-features)
  - [Text Animations](#text-animations)
  - [Loop & Slider Animations](#infinite-loop-and-slider-animations)
  - [Scroll Animations](#scroll-animations)
- [Easing Functions](#easing-functions)
- [Setting attributes via JavaScript](#setting-attributes-via-javascript)
- [Contributing](#contributing)
- [License](#license)

## Overview

AlrdyAnimate is a lightweight JavaScript library for adding scroll-triggered animations to your web pages. It provides easy-to-use options for customizing animation behavior and supports IntersectionObserver for efficient performance. With version 2.0.0, it now includes optional GSAP integration for more powerful animations.

## Installation

You can include AlrdyAnimate in your project using either CDN or npm.

### Using CDN

```html

<!-- From GitHub  -->
<!-- Latest version-->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.js"></script>

<!-- Or specific version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@2.1.3/cdn/v2.1.3/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@2.1.3/cdn/v2.1.3/AlrdyAnimate.js"></script>

<!-- From UNPKG -->
<!-- Latest version -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate/dist/AlrdyAnimate.css">
<script src="https://unpkg.com/alrdy-animate/dist/AlrdyAnimate.js"></script>

<!-- Or specific version -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.css">
<script src="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.js"></script>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    // Basic initialization
    AlrdyAnimate.init({
      ease: 'ease-in-out',
      again: false,
      viewportPercentage: 0.9,
      duration: 2,
      delay: 0.5
    });

    // With GSAP features
    AlrdyAnimate.init({
      ease: 'ease-in-out',
      again: false,
      viewportPercentage: 0.9,
      duration: 2,
      delay: 0.5,
      gsapFeatures: ['text', 'loop', 'scroll']  // Specify which GSAP features to load
    }).then(() => {
      // GSAP features are now available globally
      console.log('GSAP features loaded successfully');
      
      // You can now use:
      // - gsap
      // - ScrollTrigger
      // - Draggable (if 'loop' feature was loaded)
    });
  });
</script>
```

### Using NPM

1. Install the package:
```bash
npm install alrdy-animate
```

2. Import and initialize:
```javascript
import { AlrdyAnimate } from 'alrdy-animate';
import 'alrdy-animate/dist/AlrdyAnimate.css';

document.addEventListener('DOMContentLoaded', () => {
  try {
    AlrdyAnimate.init({
      ease: 'ease-in-out',
      again: false,
      viewportPercentage: 0.6,
      duration: 2,
      delay: 0.5,
      gsapFeatures: ['text', 'loop', 'scroll']  // Specify which GSAP features to load
    }).then(() => {
      // GSAP features are now available globally
      console.log('GSAP features loaded successfully');
      
      // You can now use:
      // - gsap
      // - ScrollTrigger
      // - Draggable (if 'loop' feature was loaded)
    }).catch(error => {
      console.error('Error initializing AlrdyAnimate:', error);
    });
  } catch (error) {
    console.error('Error during initialization setup:', error);
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `ease` | string | 'ease-in-out' | Animation easing function |
| `again` | boolean | false | Whether animations should replay when scrolling up |
| `viewportPercentage` | number | 0.6 | When element should start animating (0.0 - 1.0) |
| `duration` | number | 1 | Animation duration in seconds |
| `delay` | number | 0 | Animation delay in seconds |
| `gsapFeatures` | array | [] | GSAP features to load: ['text', 'loop', 'scroll'] |
| `debug` | boolean | false | Enable GSAP debug info |


## CSS Animations triggered on scroll (via JS)
Add the `aa-animate` attribute to the element you want to animate. Once it scrolls into view, JS will add an `in-view` class to the element and the animation will be triggered. You can also add optional attributes (see element attributes below) to customize the animation for individual elements.

- **aa-animate**: The animation type to apply. Example: `aa-animate="float-up"`.

### Element Attributes

- **aa-children**: Accepts same values as `aa-animate`, but applies animation to all children if set. Use in conjunction with `aa-stagger` to set a staggered animation and `aa-delay` to set the starting point for all children. Example: `aa-children="fade-up"`.
- **aa-ease**: Overwrites the global easing function for this element. Example: `aa-ease="ease-in-out"`.
- **aa-duration**: The animation duration for this element, in seconds. Example: `aa-duration="2"`.
- **aa-delay**: The animation delay for this element, in seconds. Example: `aa-delay="0.5"`.
- **aa-delay-mobile**: If set, overwrites the delay on mobile devices. Example: `aa-delay-mobile="0.5s"`.
- **aa-color-initial**: The initial background color for the animation. Example: `aa-color-initial="#d7ff64"`.
- **aa-color-final**: The final background color for the animation. Example: `aa-color-final="#d7ff64"`.
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#anchorElement"`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.
- **aa-distance**: The distance multiplier for the animation. Example: `aa-distance="1.5"`.

## CSS Animations triggered instantly (CSS only)
Add the `aa-instant` attribute to the element you want to animate. The animation will be triggered immediately. You can also add optional attributes (see element attributes below) to customize the animation for individual elements.

- **aa-instant**: The animation type to apply. Example: `aa-instant="fade-up"`.

### Element Attributes
- **aa-ease**: Overwrites the global easing function for this element. Example: `aa-ease="ease-in-out"`.
- **aa-duration**: The animation duration for this element, in seconds. Example: `aa-duration="2"`. Available range: 0.1s - 3s in increments of 0.1s
- **aa-delay**: The animation delay for this element, in seconds. Example: `aa-delay="0.5"`. Available range: 0.05s - 1.5s in increments of 0.05s
- **aa-stagger**: The stagger delay for up to 10 child elements, in seconds. Example: `aa-stagger="0.5"`. Available range: 0.1s - 0.5s in increments of 0.1s

## CSS Animation Types

AlrdyAnimate provides a wide variety of CSS animations that can be applied using the `aa-animate` attribute.

### Fade Animations
Simple fade animations with optional directional movement:
- `fade` (available for instant)
- `fade-up`, `fade-down`, `fade-left`, `fade-right` (available for instant)
- `fade-up-right`, `fade-up-left`, `fade-down-right`, `fade-down-left`

### Float Animations
Fade animations with a smooth back-bounce effect:
- `float-up`, `float-down`, `float-left`, `float-right` (available for instant)

### Zoom Animations
Scale animations with optional directional movement:
- `zoom-in`, `zoom-out` (available for instant)
- `zoom-in-up`, `zoom-in-down`, `zoom-in-left`, `zoom-in-right` (available for instant)
- `zoom-out-up`, `zoom-out-down`, `zoom-out-left`, `zoom-out-right` (available for instant)

### Slide Animations
Pure sliding movements:
- `slide-up`, `slide-down`, `slide-left`, `slide-right`

### Blurred Slide Animations
Sliding with a blur effect:
- `slide-in-blurred-bottom`, `slide-in-blurred-top` (available for instant)
- `slide-in-blurred-left`, `slide-in-blurred-right` (available for instant)



### Rotate Animations
Rotate animations from bottom right (br) and bottom left (bl) corners, clockwise (cw) and counter-clockwise (ccw). You can define the rotation degree by changing the numeric value at the end, e.g. `rotate-br-cw-15`. Available degrees are 5, 15, 25, 35, 45.
- `rotate-br-cw-45`, `rotate-br-ccw-45` (available for instant)
- `rotate-bl-cw-45`, `rotate-bl-ccw-45` (available for instant)

### 3D Animations

### Flip Animations
3D flip effects:
- `flip-left`, `flip-right`, `flip-up`, `flip-down`

The following 3D animations require a parent element to have a perspective set, e.g. `perspective: 1000px;`.

#### Swing Animations
3D swing effects (anchored to top):
- `swing-fwd`, `swing-bwd` (available for instant)

#### Forward Turn Animations
3D rotation effects (available for instant):
- `turn-3d-soft`: Soft rotation around X axis
- `turn-3d-soft-3em`: Same as rotate-soft but with built-in perspective
- `turn-3d-elliptic`: Stronger elliptic rotation around X axis

### Background Transitions
#### Pseudo Background Slide
Background color transitions with sliding reveal:
- `pseudo-bg-slide-down`, `pseudo-bg-slide-up`
- `pseudo-bg-slide-right`, `pseudo-bg-slide-left`

#### Pseudo Background Reveal
Background color transitions with scaling reveal:
- `pseudo-reveal-up`, `pseudo-reveal-down`
- `pseudo-reveal-right`, `pseudo-reveal-left`


Example usage:
```html
<div 
  aa-animate="fade-up" 
  aa-duration="0.6" 
  aa-delay="0.2" 
  aa-distance-factor="1.5"
>
  Animated content
</div>
```


## GSAP Features

AlrdyAnimate supports several GSAP-powered features that can be enabled by including them in the `gsapFeatures` array during initialization:

### Text Animations 
(`gsapFeatures: ['text']`)

- Set the animation type with `aa-animate="text-..."`.
- Pair with `aa-split` to define how to split the text for animation:
  - There are 4 split types: `lines`, `words`, `chars` or `lines&words` (i.e. both lines and words will be animated simultaneously). 
  - Optionally, you can add `clip` to wrap each line in a clip wrapper and prevent overflow, resulting in a clipping effect during the animation. Example: `aa-split="words.clip"`.
- Use `aa-scroll` to make the animation scroll-driven. There are two options: `aa-scroll="snap"` and `aa-scroll="smooth"`.
- Use `aa-stagger` to set the stagger effect for split text animations, in seconds. Example: `aa-stagger="0.05"`.

#### Available Text Animations

- `text-slide-up`: Slides the text up from the bottom.
- `text-slide-down`: Slides the text down from the top.
- `text-tilt-up`: Slides and rotates the text up from the bottom.
- `text-tilt-down`: Slides and rotates the text down from the top.
- `text-rotate-soft`: Rotates the text softly around the X axis. Best works with `aa-split="lines"` or `aa-split="lines.clip"`.
- `text-fade-soft`: Fades the text in, starts with 30% opacity.
- `text-fade`: Fades the text in, starts with 0% opacity.


### Infinite Loop and Slider Animations 
(`gsapFeatures: ['slider']`)

Creates infinite scrolling, snapping, or static slider animations. To use:

1. Add `aa-animate="[type]"` to the container element
2. Add `aa-slider-item` attribute to each element that should be animated
3. Optionally add navigation controls (`aa-slider-prev`, `aa-slider-next`) and a counter (`aa-slider-current`, `aa-slider-total`)

#### Basic Setup

```html
<div aa-animate="slider">
  <div class="slider-container">
    <div class="slider-item" aa-slider-item>Item 1</div>
    <div class="slider-item" aa-slider-item>Item 2</div>
    <!-- Add more items as needed -->
  </div>

  <!-- Navigation Controls -->
      <button aa-slider-prev>Previous</button>
      <button aa-slider-next>Next</button>

      <!-- Counter -->
      <div class="counter">
        <span aa-slider-current>01</span>
        <span>/</span>
        <span aa-slider-total>06</span>
      </div>
</div>
```


#### Animation Types

1. **Loop Animations** (`loop-...`)
   - Continuous infinite scrolling
   - `aa-duration`: Inversely affects speed (1 is slower than 2)
   - Combine with:
     - Direction: `-left` or `-right`
     - Interaction: `-draggable`
     - Position: `-center` (defaults to left aligned)
   - Example: `loop-left-draggable`

2. **Snap Animations** (`snap-...`)
   - Snaps from one item to the next
   - `aa-duration`: Duration of each snap animation
   - `aa-delay`: Pause duration between snaps
   - Combine with:
     - Direction: `-left` or `-right`
     - Interaction: `-draggable`
     - Position: `-center` (defaults to left aligned)
   - Example: `snap-right-draggable`

3. **Slider Animations** (`slider-...`)
   - Static slider that requires navigation
   - Combine with:
     - Interaction: `-draggable` or `-snap`
     - Position: `-center` (defaults to left aligned)
   - Example: `slider-draggable-snap`

#### CSS Requirements
- Container needs `display: flex` and `gap` set
- Items need fixed width (percentage or pixels) and `flex-shrink: 0`
- Animations can be added to elements within items, but not directly on items


```css
.slider-container {
  display: flex;
  gap: 2rem;
}

.slider-item {
  width: 300px;
  flex-shrink: 0;
}
```

### Scroll Animations 
(`gsapFeatures: ['scroll']`)
Enables scroll-driven animations and effects. 

Required for: Sticky navigation
- You can use the `aa-nav="sticky"` attribute to create a sticky navigation bar that slides out of view when the user scrolls down and slides back in when the user scrolls up. 
- Easing defaults to `back.inOut` 
- Duration defaults to `0.4s`
- You can overwrite both by adding `aa-ease` and `aa-duration` to the nav element.


Example usage with all features:
```javascript
AlrdyAnimate.init({
  ease: 'power1.out',
  again: true,
  gsapFeatures: ['text', 'loop', 'scroll'],
  debug: true
});
```

## GSAP Hover Animations

The AlrdyAnimate library includes powerful hover animations using GSAP. These animations can be applied to elements by adding the `aa-hover` attribute.

### Available Hover Animations


1. **Text Animations** (`aa-hover="text-..."`) 
  - Animate text elements with sliding or fading effects. 
  - Requires `aa-split` attribute to be set (e.g. `aa-split="words"`), optionally add `aa-stagger` 
  - Mark the text you want to animate with `aa-hover-text`.
  - Available animations:
    - Text Sliding: `text-slide-up`, `text-slide-down`, `text-slide-left`, `text-slide-right`
    - Text Fading: `text-fade-up`, `text-fade-down`, `text-fade-left`, `text-fade-right`
      - For fading effects, the element with `aa-hover` should include padding to make room for the fade effect.

2. **Background Circle Animation** (`aa-hover="bg-circle"`)
  - Expands a circle from the hover point.
  - Requires a circle SVG path in the background, tagged with `aa-hover-bg`.
  - Optionally, you can define the hover direction with `aa-hover-direction` (possible values: `all`, `top`, `bottom`, `left`, `right`, `vertical`, `horizontal`).

3. **Background Curve Animation** (`aa-hover="bg-curve"`)
  - Animates an SVG path to create a wave effect.
  - Requires an SVG path in the background, tagged with `aa-hover-bg`.
  - Optionally, you can define the hover direction with `aa-hover-direction` (possible values: `all`, `top`, `bottom`, `left`, `right`, `vertical`, `horizontal`).

4. **Background Expand Animation** (`aa-hover="bg-expand"`)
  - Expands the background with or without reverse animation.
  - Requires a div, tagged with `aa-hover-bg`, that will expand to fill the element.
  - Optionally, you can add a tag with `aa-hover-icon` to animate an icon on hover.
    - Optionally, you can define direction of the icon animation with `aa-hover-direction` on the aa-hover element (possible values: `right`, `up-right`, `down-right`).

For all hover animations, you can optionally change the color of the hovered text by adding `aa-hover-color` to the element with `aa-hover`. Alternatively, using CSS to transition on hover also works. To set content above the background, add `aa-hover-content` to the respective element (or position it via CSS).

For background animations, the aa-hover element needs to have position set to `relative` or `absolute` and overflow set to `hidden`.


### HTML Examples

```html
<a class="button" href="#" aa-hover="bg-circle" aa-hover-direction="all" aa-duration="1">
  <div aa-hover-text>Circle button</div>
  <svg class="bg-filler" viewBox="0 0 1 1" preserveAspectRatio="xMidYMid slice" aa-hover-bg>
    <circle cx="0.5" cy="0.5" r="0" fill="currentColor"></circle>
  </svg>
</a>

<a class="button" href="#" aa-hover="bg-curve" aa-hover-direction="vertical" aa-duration="0.8">
  <div aa-hover-text>Vertical Only</div>
  <svg class="bg-filler" viewBox="0 0 100 100" preserveAspectRatio="none" aa-hover-bg>
    <path d="M 0 100 V 0 Q 250 0 500 0 V 0 H 0 z" fill="currentColor"></path>
  </svg>
</a>
```





## Easing Functions

AlrdyAnimate supports a variety of easing functions for both CSS and GSAP animations. Here's a quick reference:

### Standard Easings
- `linear`: No easing, no acceleration
- `ease`: Slight acceleration at the beginning, then deceleration (default CSS easing)
- `ease-in`: Gradual acceleration from zero velocity
- `ease-out`: Gradual deceleration to zero velocity
- `ease-in-out`: Acceleration until halfway, then deceleration

### Power Easings (GSAP style)
- `power1.in`, `power1.out`, `power1.inOut`: Subtle easing (equivalent to Quad)
- `power2.in`, `power2.out`, `power2.inOut`: Moderate easing (equivalent to Cubic)
- `power3.in`, `power3.out`, `power3.inOut`: Strong easing (equivalent to Quart)
- `power4.in`, `power4.out`, `power4.inOut`: More pronounced easing (equivalent to Quint)

### Specific Named Easings
- `back.in`, `back.out`, `back.inOut`: Slightly overshoots, then returns
- `circ.in`, `circ.out`, `circ.inOut`: Circular motion feel
- `expo.in`, `expo.out`, `expo.inOut`: Exponential acceleration or deceleration
- `sine.in`, `sine.out`, `sine.inOut`: Sinusoidal easing, smooth and gentle

### Easing Suffixes
- `.in`: Easing starts slowly and accelerates
- `.out`: Easing starts quickly and decelerates
- `.inOut`: Easing starts slowly, accelerates in the middle, then decelerates

Note: 'Elastic' and 'Bounce' easings are available when using GSAP but not for CSS animations.

Usage example:
```html
<div aa-animate="fade-up" aa-ease="back.out">Animated content</div>
```

This will apply a fade-up animation with a 'back out' easing, which means it will slightly overshoot and then settle into place.


## Setting attributes via JavaScript

If you'd like to set the same animation on a certain class or element, you can do so via JavaScript:

```javascript
document.addEventListener('DOMContentLoaded', function() {
  document.querySelectorAll('h1').forEach((element) => {       //or querySelectorAll('.my-class')
    if (!element.hasAttribute('aa-animate')) {
      element.setAttribute('aa-animate', 'text-tilt-up');
      element.setAttribute('aa-split', 'words.clip'); 
      element.setAttribute('aa-duration', '0.5');  
    }
  });
  
  AlrdyAnimate.init({
    easing: 'power1.out',
    again: true,
    useGSAP: true  
  });
});
```

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.



