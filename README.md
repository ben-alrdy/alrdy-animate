# AlrdyAnimate Library

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
  - [Using CDN](#using-cdn)
  - [Using NPM](#using-npm)
  - [Configuration Options](#configuration-options)
- [CSS Animations triggered on scroll (via JS)](#css-animations-triggered-on-scroll-via-js)
- [CSS Animations triggered on load (CSS only)](#css-animations-triggered-on-load-css-only)
- [Animation Types](#animation-types)
  - [Fade Animations](#fade-animations)
  - [Float Animations](#float-animations)
  - [Zoom Animations](#zoom-animations)
  - [Slide Animations](#slide-animations)
  - [Blurred Slide Animations](#blurred-slide-animations)
  - [Rotate Animations](#rotate-animations)
  - [3D Animations](#3d-animations)
  - [Pseudo Overlay Reveal](#pseudo-overlay-reveal)
- [GSAP Features](#gsap-features)
  - [Text Animations](#text-animations)
  - [Slider Animations](#slider-animations)
  - [Scroll Animations](#scroll-animations)
  - [Hover Animations](#hover-animations)
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
    AlrdyAnimate.init({
      ease: 'ease-in-out',
      again: false,
      viewportPercentage: 0.9,
      duration: 2,
      delay: 0.5,
      gsapFeatures: ['text', 'slider', 'scroll', 'hover']  // Specify which GSAP features to load
    }).then(() => {
      // GSAP features are now available globally
      console.log('GSAP features loaded successfully');
      
      // You can now use:
      // - gsap
      // - ScrollTrigger
      // - Draggable (if 'slider' feature was loaded)
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
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#trigger"` on the element to be animated combined with `<div id="trigger">Headline</div>`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.
- **aa-distance**: The distance multiplier for the animation. Example: `aa-distance="1.5"`.

## CSS Animations triggered on load (CSS only)
Add the `aa-load` attribute to the element you want to animate. The animation will be triggered immediately. You can also add optional attributes (see [on load element attributes](#on-load-element-attributes) below) to customize the animation for individual elements.

- **aa-load**: The animation type to apply. Example: `aa-load="fade-up"`.

### On Load Element Attributes
- **aa-ease**: Overwrites the global easing function for this element. Example: `aa-ease="ease-in-out"`.
- **aa-duration**: Set the animation duration for this element, in seconds. Example: `aa-duration="2"`. Available range: 0.1s - 3s in increments of 0.1s
- **aa-delay**: Set the animation delay for this element, in seconds. Example: `aa-delay="0.5"`. Available range: 0.05s - 1.5s in increments of 0.05s
- **aa-stagger**: Set a staggered animation delay for up to 10 child elements, in seconds. Example: `aa-stagger="0.5"`. Available range: 0.05s - 0.5s in increments of 0.05s. Still requires the `aa-load` attribute to be set on each child element.

## CSS Animation Types

AlrdyAnimate provides a wide variety of CSS animations that can be applied using the `aa-animate` attribute.

### Fade Animations
Simple fade animations with optional directional movement:
- `fade` (available for aa-load)
- `fade-up`, `fade-down`, `fade-left`, `fade-right` (available for aa-load)
- `fade-up-right`, `fade-up-left`, `fade-down-right`, `fade-down-left`

### Float Animations
Fade animations with a smooth back-bounce effect:
- `float-up`, `float-down`, `float-left`, `float-right` (available for aa-load)

### Zoom Animations
Scale animations with optional directional movement:
- `zoom-in`, `zoom-out` (available for aa-load)
- `zoom-in-up`, `zoom-in-down`, `zoom-in-left`, `zoom-in-right` (available for aa-load)
- `zoom-out-up`, `zoom-out-down`, `zoom-out-left`, `zoom-out-right` (available for aa-load)

### Slide Animations
Pure sliding movements without opacity change:
- `slide-up`, `slide-down`, `slide-left`, `slide-right` (available for aa-load)

### Blurred Slide Animations
Sliding with a blur effect:
- `slide-in-blurred-bottom`, `slide-in-blurred-top` (available for aa-load)
- `slide-in-blurred-left`, `slide-in-blurred-right` (available for aa-load)


### Rotate Animations
Rotate animations from bottom right (br) and bottom left (bl) corners, clockwise (cw) and counter-clockwise (ccw). You can define the rotation degree by changing the numeric value at the end, e.g. `rotate-br-cw-15`. Available degrees are 5, 15, 25, 35, 45.
- `rotate-br-cw-45`, `rotate-br-ccw-45` (available for aa-load)
- `rotate-bl-cw-45`, `rotate-bl-ccw-45` (available for aa-load)

### 3D Animations

#### Flip Animations
3D flip effects:
- `flip-left`, `flip-right`, `flip-up`, `flip-down`

#### Swing Animations
Requires a parent element to have a perspective set, e.g. `perspective: 1000px;`.
3D swing effects (anchored to top):
- `swing-fwd`, `swing-bwd` (available for aa-load)

#### Forward Turn Animations
Requires a parent element to have a perspective set, e.g. `perspective: 1000px;`.
3D rotation effects (available for aa-load):
- `turn-3d-soft`: Soft rotation around X axis
- `turn-3d-soft-3em`: Same as rotate-soft but with built-in perspective
- `turn-3d-elliptic`: Stronger elliptic rotation around X axis


### Pseudo Overlay Reveal
Creates a pseudo element on top of the content and reveals it. Use `aa-bg-color-initial` to set the color of the pseudo element.
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
  - Optionally, you can add `-clip` to wrap each line in a clip wrapper and prevent overflow, resulting in a clipping effect during the animation. Example: `aa-animate="text-slide-up-clip"`.
- Pair with `aa-split` to define how to split the text for animation:
  - There are 4 split types: `lines`, `words`, `chars` or `lines&words` (i.e. both lines and words will be animated simultaneously). 
- Use `aa-scrub` to make the animation scroll-driven. There are two options: `aa-scrub="snap"` and `aa-scrub="smooth"`.
- Use `aa-stagger` to set the stagger effect for split text animations, in seconds. Example: `aa-stagger="0.05"`.

#### Available Text Animations

- `text-slide-up`: Slides the text up from the bottom.
- `text-slide-down`: Slides the text down from the top.
- `text-tilt-up`: Slides and rotates the text up from the bottom.
- `text-tilt-down`: Slides and rotates the text down from the top.
- `text-rotate-soft`: Rotates the text softly around the X axis. Best works with `aa-split="lines"`
- `text-fade-soft`: Fades the text in, starts with 30% opacity.
- `text-fade`: Fades the text in, starts with 0% opacity.
- `text-fade-up`: Fades the text in, starts with 0% opacity and slides up.
- `text-blur`: Blurs the text in, starts with 0% opacity.
- `text-blur-left`: Blurs the text in, starts with 0% opacity and slides left.
- `text-blur-right`: Blurs the text in, starts with 0% opacity and slides right.
- `text-blur-up`: Blurs the text in, starts with 0% opacity and slides up.
- `text-blur-down`: Blurs the text in, starts with 0% opacity and slides down.


### Slider Animations 
(`gsapFeatures: ['slider']`)

Creates infinite scrolling, snapping, or static slider animations. To use:

1. Add `aa-animate="slider"` to the container element. (By default, the slider will animate horizontally, but you can add `-vertical` to animate vertically.)
2. Add `aa-slider-item` attribute to each element that should be animated

#### Basic Setup

```html
<div aa-animate="slider">
  <div class="slider-container">
    <div class="slider-item" aa-slider-item>
      <div class="slider-item-content">Item 1</div>
    </div>
    <div class="slider-item" aa-slider-item>
      <div class="slider-item-content">Item 2</div>
    </div>
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

1. **Slider Animations** (`slider`)
   - Static slider that requires navigation
   - Combine with:
     - Interaction: `-draggable` or `-snap`
     - Position: `-center` (defaults to left aligned)
   - Example: `slider-draggable-snap`

2. **Loop Animations** (`slider-loop`)
   - Continuous infinite scrolling
   - `aa-duration`: Inversely affects speed (1 is slower than 2)
   - Combine with:
     - Direction: defaults to left, add `-reverse` to animate right
     - Interaction: `-draggable`
     - Position: `-center` (defaults to left aligned)
   - Example: `slider-loop-left-draggable`

3. **Snap Animations** (`slider-snap`)
   - Snaps from one item to the next
   - `aa-duration`: Duration of each snap animation
   - `aa-delay`: Pause duration between snaps
   - Combine with:
     - Direction: defaults to left, add `-reverse` to animate right
     - Interaction: `-draggable`
     - Position: `-center` (defaults to left aligned)
   - Example: `slider-snap-right-draggable`



#### CSS Requirements
- Container needs `display: flex` and `gap` set
- Items need fixed width (percentage or pixels) and `flex-shrink: 0`
- Important: The items cannot have a border or padding; if you need such styles, nest another div inside the item and apply the styles to that nested div.
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

#### Navigation Controls

- Optionally, add navigation controls for the slider (These elements need to located inside the element with `aa-animate="slider"`):
  - `aa-slider-prev` and `aa-slider-next` for navigation buttons to show previous and next slide
  - `aa-slider-current` and `aa-slider-total` to display the current and total number of slides
  - `aa-slider-button` for specific buttons to jump to a certain slide
    - the number of buttons needs to match the number of slides
    - the slide that is active and the corresponding button get the class `is-active` so you can style them accordingly
    - optionally, if the buttons don't live in the same wrapper as `aa-animate = slider`, you can add `aa-slider-target=id_of_slider` to each button to control a specific slider



### Scroll Animations 
(`gsapFeatures: ['scroll']`)
Enables scroll-driven animations and effects. 

#### Sticky Navigation
- Your nav element needs to have `position: fixed` set so it is sticky.
- Use `aa-nav="change"` to add the class `is-scrolled` to the nav element when scrolling down and remove it when scrolling up. 
- Use `aa-nav="hide"` to create a sticky navigation bar that slides out of view when scrolling down and slides back in when scrolling up
  - Use `aa-ease` to set the easing. Defaults to `back.inOut`
  - Use `aa-duration` to set the duration. Defaults to `0.4s`
  - Use `aa-distance` to set the distance multiplier that the nav element will move. Example: `aa-distance="1.5"`.
- Use `aa-nav="hide-change"` to combine both effects
- Add an integer to `aa-nav` to define after how many pixels the the effect should be triggered. Example: `aa-nav="hide-change-50"`. Defaults to `100px`.

#### Background Color Transitions
- Use `aa-animate="background"` on a wrapper element you want to animate when sections inside the wrapper scroll into view
  - Optionally set `aa-duration` to define the duration of the animation and `aa-ease` to define the easing.
- Set `aa-viewport` to 0.5 to trigger the animation when the section is 50% in view.
- Set `aa-scrub` to `smooth`, `snap` or `smoother` to make the animation scroll driven.
- Use `aa-wrapper-colors` with `bg` and `text` to define the background and text colors for the wrapper once the section is scrolled into view, e.g. `aa-wrapper-colors="bg:#f0f0f0;text:#000"`.
- Use `aa-item-colors` with `bg` and `text` to change the background and text colors for child elements when they scroll into view, e.g. `aa-item-colors="bg:#ff0000;text:#fff"`.

- Example:
```html
<div class="wrapper" aa-animate="background" aa-viewport="0.5" aa-duration="0.8">
  <div class="section" aa-wrapper-colors="bg:#f0f0f0;text:#000">
    Changes wrapper background to light gray and text to black
  </div>
  <div class="section" aa-wrapper-colors="bg:#000;text:#fff" aa-item-colors="bg:#ff0000;text:#fff">
    Changes wrapper background to dark theme and self to red
    <div class="item" aa-item-colors="bg:#ff0000;text:#fff">Changes item background to red and text to white</div>
  </div>
</div>
```

#### Marquee Animations
- Use `aa-animate="marquee-left"` or `aa-animate="marquee-right"` to create a left- or right-moving marquee
- Important: Each item inside the `aa-marquee-items` wrapper needs to be spaced with `margin` (not `gap` of flexbox)
- Add `-hover` to the animation type to create a marquee that slows down on hover, e.g. `aa-animate="marquee-left-hover"`
- Use `aa-duration` to set the duration of the animation
- Use `aa-marquee-scroller` to mark the element that increases in speed on scroll; accepts integer to set the speed multiplier, e.g. `aa-marquee-scroller="10"` (defaults to 10, set to 1 for no scroll speed increase)
- Use `aa-marquee-items` to mark the element that contains the items to duplicate in the marquee; accepts integer to set the number of duplicates, e.g. `aa-marquee-items="3"` (defaults to 2)

Example:
```html
<div aa-animate="marquee-left-hover" aa-duration="15" class="marquee">
  <div aa-marquee-scroller="10">
    <div aa-marquee-items>
      <div class="marquee__item">
        <p>Scroll Effects & Animations</p> 
      </div>
    </div>
  </div>
</div>
```

#### Parallax Scrolling
- Use `aa-animate="parallax-40"` on an image to create a parallax scroll effect
- The number (40) represents the movement distance in pixels
- Add direction with `aa-animate="parallax-down-40"` (moves down while scrolling) or `parallax-up-40` (default, moves up)
- Add `half` to end the parallax when the element reaches the middle of the page: `parallax-down-half-40`
- Control smoothness with `aa-scrub`:
  - `"smoother"`: Very lazy, smooth following (scrub: 5)
  - `"smooth"`: Regular smooth following (scrub: 2)
  - `"snap"`: Snaps to 20% increments
  - No value: Direct 1:1 following
- If the parent element has `overflow: hidden`, the image will be scaled to fit the parent's height
```html
<div style="height: 60vh; overflow: hidden">
  <img 
    src="image.jpg" 
    aa-animate="parallax-down-40" 
    aa-scrub="smooth"
  >
</div>
```

#### Reveal & Appear Animations
- Use `aa-animate="reveal-..."` for reveal animations that use a clip path to mask the content
- Use `aa-animate="appear-..."` for appear animations that fade/slide in content
- Optionally, add `aa-scrub` with the values `smooth`, `snap`, `smoother` or `true` to make the animation scroll-driven

Available animations:
1. Reveal Animations (by animating a clip path)
   - `reveal-up`: Reveals content with clip path sliding up
   - `reveal-down`: Reveals content with clip path sliding down
   - `reveal-left`: Reveals content with clip path sliding left
   - `reveal-right`: Reveals content with clip path sliding right
   - `reveal-center`: Reveals content with clip path splitting from center in a circle shape

2. Appear Animations (clean transitions)
   - `appear`: Simple fade in
   - `appear-up`: Fades in while sliding up
   - `appear-down`: Fades in while sliding down
   - `appear-left`: Fades in while sliding left
   - `appear-right`: Fades in while sliding right

Example usage:
```html
<!-- Reveal animation -->
<div>
  <img src="image.jpg" aa-animate="reveal-up" aa-duration="1.2" aa-ease="power2.inOut">
</div>

<!-- Appear animation -->
<div aa-animate="appear" aa-scrub="smooth">
  Content fades while scrolling
</div>
```

#### Counter Animations
Animate a number from 0 to the value of the element (it needs to be a number and can include a comma or dot as thousand separator).

- Use `aa-animate="counter"` to animate a number from 0 to the target number
- Use `aa-animate="counter-10"` to animate a number from 10 to the target number
- Optionally, add `aa-scrub` to make the animation scroll-driven

### Hover Animations

The AlrdyAnimate library includes powerful hover animations using GSAP. These animations can be applied to elements by adding the `aa-hover` attribute. Generally, you can use `aa-delay` and `aa-duration` to set the delay and duration of the animation.

#### Available Hover Animations


1. **Text Animations** (`aa-hover="text-..."`) 
  - Animate text elements with sliding or fading effects. 
  - Mark the text you want to animate with `aa-hover-text`.
  - Requires a wrapper element around the `aa-hover-text` that has position set to `relative` or `absolute` and overflow set to `hidden`.
  - Requires `aa-split` attribute to be set (e.g. `aa-split="words"`), optionally add `aa-stagger` 
  - use `aa-distance` to set distance/delay between the original and the clone.
  - Available animations:
    - Text Sliding: `text-slide-up`, `text-slide-down`, `text-slide-left`, `text-slide-right`
    - Text Fading: `text-fade-up`, `text-fade-down`, `text-fade-left`, `text-fade-right`
      - For fading effects, the element with `aa-hover-text` should include padding to make room for the fade effect.
    - add `-reverse` to the animation type to play the animation in reverse when hovering out, e.g. `aa-hover="text-slide-up-reverse"`.

2. **Background Circle Animation** (`aa-hover="bg-circle"`)
  - Expands a circle from the hover point.
  - Requires a circle SVG path in the background, tagged with `aa-hover-bg`.
  - Optionally, you can define the hover direction with `aa-hover-direction` (possible values: `all`, `top`, `bottom`, `left`, `right`, `vertical`, `horizontal`).

3. **Background Curve Animation** (`aa-hover="bg-curve"`)
  - Animates an SVG path to create a wave effect.
  - Requires an SVG path in the background, tagged with `aa-hover-bg`.
  - Optionally, you can define the hover direction with `aa-hover-direction` (possible values: `all`, `top`, `bottom`, `left`, `right`, `vertical`, `horizontal`).

4. **Background Expand Animation** (`aa-hover="bg-expand"`)
  - Expands a shape inside the elment to fill the element.
  - Requires a div nested inside the element, tagged with `aa-hover-bg`, that will expand to fill the element.
  - Optionally, you can add `-reverse` to `aa-hover` to play the animation in reverse when hovering out, e.g. `aa-hover="bg-expand-reverse"`.
  - Optionally, you can add a tag with `aa-hover-icon` to animate an icon on hover (usually set on the svg element inside the embed; the embed div itself needs to be set to `position: relative` and `overflow: hidden`). Use `aa-distance` to set distance/delay between the original and cloned icon.
    - Optionally, you can define direction of the icon animation with `aa-hover-direction` on the aa-hover element (possible values: `right`, `up-right`, `down-right`).

For all hover animations, you can optionally add `aa-hover-text-color` or `aa-hover-bg-color` to any element inside the aa-hover element to animate the text or background color. The text elements will be positioned relative with z-index set to 1.

To set content above the background, add `aa-hover-content` to the respective element (or position it via CSS).


#### HTML Examples

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
      element.setAttribute('aa-split', 'words'); 
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

If you want a page refresh to always start from the top, you can add this script to the head tag, so it runs before the page loads:
```javascript
if ('scrollRestoration' in history) {
  history.scrollRestoration = 'manual';
}
window.scrollTo(0, 0);
```

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.



