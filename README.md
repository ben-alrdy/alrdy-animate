# AlrdyAnimate Library

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
  - [CDN Links](#cdn-links)
  - [Initialization Scripts](#initialization-scripts)
  - [Configuration Options](#configuration-options)
- [CSS Animations triggered on scroll (via JS)](#css-animations-triggered-on-scroll-via-js)
- [CSS Animations triggered on load (CSS only)](#css-animations-triggered-on-load-css-only)
- [Animation Types](#animation-types)
  - [Fade Animations](#fade-animations)
  - [Float Animations](#float-animations)
  - [Zoom Animations](#zoom-animations)
  - [Slide Animations](#slide-animations)
  - [Blurred Animations](#blur-animations)
  - [Rotate Animations](#rotate-animations)
  - [3D Animations](#3d-animations)
  - [Pseudo Overlay Reveal](#pseudo-overlay-reveal)
- [GSAP Features](#gsap-features)
  - [Text Animations](#text-animations)
  - [Slider Animations](#slider-animations)
  - [Scroll Animations](#scroll-animations)
  - [Hover Animations](#hover-animations)
- [Smooth Scrolling (Lenis)](#smooth-scrolling-lenis)
- [Modals](#modals)
- [Easing Functions](#easing-functions)
- [Setting attributes via JavaScript](#setting-attributes-via-javascript)
- [Templates](#templates)
- [Contributing](#contributing)
- [License](#license)



## Overview

AlrdyAnimate is a lightweight JavaScript library for adding scroll-triggered animations to your web pages. It provides easy-to-use options for customizing animation behavior and supports IntersectionObserver for efficient performance. With version 2.0.0, it now includes optional GSAP integration for more powerful animations.

## Installation

You can include AlrdyAnimate in your project using either CDN or npm.

### CDN Links

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
<script defer src="https://unpkg.com/alrdy-animate/dist/AlrdyAnimate.js"></script>

<!-- Or specific version -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.css">
<script defer src="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.js"></script>
```

### Initialization Scripts

#### Webflow Implementation

For Webflow projects, add these scripts to your custom code section:

```html
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.css">
<script defer src="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.js"></script>

<!-- SCRIPT FOR MAIN CUSTOM CODE-->
<script defer>
  // Function to initialize AlrdyAnimate with consistent options
  function initAlrdyAnimate() {
    if (!window.alrdyInitialized) {
      AlrdyAnimate.init({
        ease: 'ease-in-out',
        duration: 0.8,
        modals: true,
        gsapFeatures: ['text', 'slider', 'scroll'],
        templates: {
          theme: 'floaty', 
          custom: {         
            'heading-style-h2': {
              animationType: 'text-blur|text-fade',
              split: 'lines&words',
              stagger: 0.05
            },
            'heading-style-h3': {
              animationType: 'aa-fade'
            }
          }
        }
      });
    }
  }

  // 1. Initial page load
  document.addEventListener('DOMContentLoaded', initAlrdyAnimate);
  // 2. Handle prefetched pages
  window.addEventListener('pageshow', (event) => { if (event.persisted) {initAlrdyAnimate();} });
  // 3. Handle browser back/forward navigation
  window.addEventListener('popstate', initAlrdyAnimate);
</script>

<!-- SCRIPT FOR PAGE CUSTOM CODE-->
<script defer>
  document.addEventListener('DOMContentLoaded', () => {
    AlrdyAnimate.initPageAnimations(() => {
      // Your page-specific GSAP code here
    });
  });
</script>
```

#### Standard HTML/JavaScript Implementation

For non-Webflow projects, you can initialize AlrdyAnimate in several ways:

1. **Using CDN with DOMContentLoaded**:
```html
<!-- Add these in your HTML head -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.css">

<!-- Add these in your HTML end of body -->
<script defer src="https://unpkg.com/alrdy-animate@2.1.3/dist/AlrdyAnimate.js"></script>

<script>
  // Function to initialize AlrdyAnimate with consistent options
  function initAlrdyAnimate() {
    if (!window.alrdyInitialized) {
      AlrdyAnimate.init({
        ease: 'ease-in-out',
        duration: 0.8,
        hoverDuration: 0.6,
        gsapFeatures: ['text', 'slider', 'scroll', 'hover'],
        templates: {
          theme: 'floaty',
          custom: {
            'my-headline': {
              animationType: 'text-slide-up',
              split: 'words',
              ease: 'power2.out',
              duration: 0.8,
              stagger: 0.05
            }
          }
        }
      });
    }
  }

  // 1. Initial page load
  document.addEventListener('DOMContentLoaded', initAlrdyAnimate);
  // 2. Handle prefetched pages
  window.addEventListener('pageshow', (event) => { if (event.persisted) {initAlrdyAnimate();} });
  // 3. Handle browser back/forward navigation
  window.addEventListener('popstate', initAlrdyAnimate);
</script>
```

2. **Using async/await with window load**:
```html
<script>
  // Function to initialize AlrdyAnimate with consistent options
  async function initAlrdyAnimate() {
    if (!window.alrdyInitialized) {
      await AlrdyAnimate.init({
        ease: 'ease-in-out',
        duration: 0.8,
        hoverDuration: 0.6,
        gsapFeatures: ['text', 'slider', 'scroll', 'hover']
      });
    }
  }

  // 1. Initial page load
  window.addEventListener('load', initAlrdyAnimate);
  // 2. Handle prefetched pages
  window.addEventListener('pageshow', (event) => { if (event.persisted) {initAlrdyAnimate();} });
  // 3. Handle browser back/forward navigation
  window.addEventListener('popstate', initAlrdyAnimate);
</script>
```

3. **Using a Module Bundler (like Webpack or Vite)**:
```javascript
import { AlrdyAnimate } from 'alrdy-animate';
import 'alrdy-animate/dist/AlrdyAnimate.css';

// Function to initialize AlrdyAnimate with consistent options
async function initAlrdyAnimate() {
  if (!window.alrdyInitialized) {
    await AlrdyAnimate.init({
      ease: 'ease-in-out',
      duration: 0.8,
      hoverDuration: 0.6,
      gsapFeatures: ['text', 'slider', 'scroll', 'hover']
    });
  }
}

// 1. Initial page load
if (document.readyState === 'loading') {
  document.addEventListener('DOMContentLoaded', initAlrdyAnimate);
} else {
  initAlrdyAnimate();
}
// 2. Handle prefetched pages
window.addEventListener('pageshow', (event) => { if (event.persisted) {initAlrdyAnimate();} });
// 3. Handle browser back/forward navigation
window.addEventListener('popstate', initAlrdyAnimate);
```


### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `duration` | number | 1 | Animation duration in seconds |
| `delay` | number | 0 | Animation delay in seconds |
| `ease` | string | "ease-in-out" | Default easing function for animations |
| `again` | boolean | true | Remove 'in-view' class when element is out of view |
| `viewportPercentage` | number | 0.8 | Percentage of viewport height to trigger animation |
| `distance` | number | 1 | Distance factor for animations |
| `gsapFeatures` | array | [] | GSAP features to load: ['text', 'loop', 'scroll'] |
| `debug` | boolean | false | Enable GSAP debug info |
| `lazyLoadHandler` | boolean | false | Enable lazy loading handler for images |
| `modals` | boolean | false | Enable modal functionality |
| `smoothScroll` | object | { enabled: false, options: {} } | Configure smooth scrolling with Lenis |
| `templates` | object | null | Template configuration for class-based animations |

#### Hover Animation Options
| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `hoverDuration` | number | 0.3 | Duration for hover animations in seconds |
| `hoverDelay` | number | 0 | Delay for hover animations in seconds |
| `hoverEase` | string | "power3.out" | Easing function for hover animations |
| `hoverDistance` | number | 0.1 | Distance factor for hover animations |

## CSS Animations triggered on scroll (via JS)
Add the `aa-animate` attribute to the element you want to animate. Once it scrolls into view, JS will add an `in-view` class to the element and the animation will be triggered. You can also add optional attributes (see element attributes below) to customize the animation for individual elements.

- **aa-animate**: The animation type to apply. Example: `aa-animate="float-up"`.

### Element Attributes

- **aa-children**: Accepts same values as `aa-animate`, but applies animation to all children if set. Use in conjunction with `aa-stagger` to set a staggered animation and `aa-delay` to set the starting point for all children. Example: `aa-children="fade-up"`.
- **aa-ease**: Overwrites the global easing function for this element. Example: `aa-ease="ease-in-out"`.
- **aa-duration**: The animation duration for this element, in seconds. Example: `aa-duration="2"`.
- **aa-delay**: The animation delay for this element, in seconds. Example: `aa-delay="0.5"`.
- **aa-delay-mobile**: If set, overwrites the delay on mobile devices. Example: `aa-delay-mobile="0.5s"`.
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#trigger"` on the element to be animated combined with `<div id="trigger">Headline</div>`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.
- **aa-distance**: The distance multiplier for the animation. Example: `aa-distance="1.5"`.

### Toggle Playstate Function
By adding the attriute `aa-toggle-playstate` to an element, all first level children of that element that have animations will be set to `animation-playstate = running` when the element is in view, or to `paused` when out of view.

## CSS Animations triggered on load (CSS only)
Add the `aa-load` attribute to the element you want to animate. The animation will be triggered immediately when the page loads. For best performance, use the CSS directly in Webflow.

- **aa-load**: The animation type to apply. Example: `aa-load="fade-up"`.

### Staggering
- You can combine the `aa-load` attribute with the `aa-stagger` attribute on a parent element to stagger the animation for up to 10 child elements. Example: `aa-stagger="0.5"`.

## CSS Animation Types

AlrdyAnimate provides a wide variety of CSS animations that can be applied using the `aa-load` attribute.

### Fade Animations
Simple fade animations with optional directional movement:
- `fade` (available for aa-load)
- `fade-up`, `fade-down`, `fade-left`, `fade-right` (available for aa-load)

### Float Animations
Fade animations with a smooth back-bounce effect:
- `float-up`, `float-down`, `float-left`, `float-right` (available for aa-load)

### Zoom Animations
Scale animations with optional directional movement:
- `zoom-in`, `zoom-out` (available for aa-load)
- `zoom-in-up`, `zoom-in-down`, `zoom-in-left`, `zoom-in-right` 
- `zoom-out-up`, `zoom-out-down`, `zoom-out-left`, `zoom-out-right` 

### Slide Animations
Pure sliding movements without opacity change:
- `slide-up`, `slide-down`, `slide-left`, `slide-right` (available for aa-load)

### Blur Animations
Blur in the element
- `blur`, `blur-in`


### Rotate Animations
Rotate animations from bottom right (br) and bottom left (bl) corners, clockwise (cw) and counter-clockwise (ccw).The base roation degree is 5 which you can multiply with the aa-distance attribute. 
- `rotate-br-cw`, `rotate-br-ccw` (available for aa-load)
- `rotate-bl-cw`, `rotate-bl-ccw` (available for aa-load)

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
Creates a pseudo element on top of the content and reveals it. Add the color you want to use as a pseudo color to the animation type, e.g. `aa-animate="pseudo-reveal-up-#cccccc"`. Defaults to `var(--background-color--background-primary)` or black.
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
  - Optionally, you can add `-clip` (or `-lines`, `-words`, `-chars`) to wrap each line in a clip wrapper and prevent overflow, resulting in a clipping effect during the animation. Example: `aa-animate="text-slide-up-clip"`.
- Pair with `aa-split` to define how to split the text for animation:
  - There are 4 split types: `lines`, `words`, `chars` or `lines&words` (i.e. both lines and words will be animated simultaneously). 
- Use `aa-scrub` to make the animation scroll-driven. There are two options: `aa-scrub="snap"` and `aa-scrub="smooth"`.
- Use `aa-stagger` to set the stagger effect for split text animations, in seconds. Example: `aa-stagger="0.05"`.

#### Available Text Animations

- `text-slide-up/down/left`: Slides the text in.
- `text-tilt-up/down`: Slides and rotates the text in.
- `text-rotate-soft`: Rotates the text softly around the X axis. Best works with `aa-split="lines"`
- `text-fade-30`: Fades the text in, starts with 30% opacity.
- `text-fade-10`: Fades the text in, starts with 30% opacity.
- `text-fade`: Fades the text in, starts with 0% opacity.
- `text-scale-up`: Fades and scales the text up.
- `text-blur`: Blurs the text in.
- `text-blur-left/right/up/down`: Blurs the text in with direction.


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
- Set `aa-animate="marquee-left"` or `aa-animate="marquee-right"` to the parent element to create a left- or right-moving marquee
  - Use `aa-duration` to set the duration of the animation
- Set `aa-marquee-scroller` to mark the element that increases in speed on scroll; accepts integer to set the speed multiplier, e.g. `aa-marquee-scroller="10"` (defaults to 0, i.e. no speed increase on scroll)
- Set `aa-marquee-items` to mark the wrapper that contains the items to duplicate in the marquee; accepts integer to set the number of duplicates, e.g. `aa-marquee-items="3"` (defaults to 2)
  - Important: Each item inside the `aa-marquee-items` wrapper needs to be spaced with `margin` (not `gap` of flexbox)
- Options:
  - Add `-switch` to change marquee direction on scroll
  - Add `-hover` to the animation type to create a marquee that slows down on hover, e.g. `aa-animate="marquee-left-hover"`
  - Add `-paused` to disabe the animation, e.g. `aa-animate="marquee-left-paused"` - use to only animate on scroll
    - Add `aa-scrub` with possible values snap, smooth, or smoother



Example:
```html
<div aa-animate="marquee-left-hover" aa-duration="15" class="marquee">
  <div aa-marquee-scroller="10">
    <div aa-marquee-items>
      <div class="marquee__item">
        <p>Scroll Effects & Animations</p> 
      </div>
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
  - Expands a shape inside the element to fill the element.
  - Requires a div nested inside the element, tagged with `aa-hover-bg`, that will expand to fill the element.
  - Optionally, you can add `-reverse` to `aa-hover` to play the animation in reverse when hovering out, e.g. `aa-hover="bg-expand-reverse"`.

5. **Icon Animations** (`aa-hover="icon-..."`)
  - Animates an icon on hover.
  - Requires an svg element nested inside the element, tagged with `aa-hover-icon`.
  - Define direction of the icon animation by adding a direction, e.g. `aa-hover="icon-right"` (possible values: `right`, `up-right`, `down-right`, `left`, `up-left`, `down-left`, `up`, `down`).
  - Optionally, you can add `-reverse` to `aa-hover` to play the animation in reverse when hovering out, e.g. `aa-hover="icon-right-reverse"`.

For all hover animations, you can optionally add `aa-hover-text-color` or `aa-hover-bg-color` to any element inside the aa-hover element to animate the text or background color. The text elements will be positioned relative with z-index set to 1.

You can combine hover animations with the `&` operator, e.g. `aa-hover="bg-expand&icon-right"`.

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


## Smooth Scrolling (Lenis)

AlrdyAnimate includes optional smooth scrolling powered by Lenis. To enable it, add the `smoothScroll` option to your initialization:

```javascript
AlrdyAnimate.init({
  gsapFeatures: ['scroll', 'text'], // your features
  smoothScroll: {
    enabled: true,
    options: {
      lerp: 0.12,           // Lower = smoother scrolling
      wheelMultiplier: 1,   // Adjust scroll speed (default = 1)
      touchMultiplier: 2,   // Adjust touch speed (default = 2)
      smoothWheel: true     // Enable smooth scrolling on mouse wheel
    }
  }
});
```

### Configuration Options

| Option | Type | Default | Description |
|--------|------|---------|-------------|
| `lerp` | number | 0.12 | Controls smoothness (0.01 to 1) |
| `wheelMultiplier` | number | 1 | Mouse wheel scroll speed |
| `touchMultiplier` | number | 2 | Touch/trackpad scroll speed |
| `smoothWheel` | boolean | true | Enable wheel smoothing |
| `infinite` | boolean | false | Enable infinite scrolling |

### Scroll To
The Scroll To feature allows you to create smooth scrolling animations to specific elements on your page. 

- Add  `aa-scroll-target` attribute to any clickable element (like buttons or links) and include the ID of the target section, e.g. `aa-scroll-target="#my-section"`
- Customize the scroll behavior with these optional attributes:
   - `aa-duration`: Animation duration in seconds (default: 1.2)
   - `aa-distance`: Offset distance in pixels (default: 0)

### Important Considerations

#### Modals and Popups
To prevent smooth scrolling within modals or other scrollable elements:

```html
<!-- Add data-lenis-prevent attribute -->
<div class="modal" data-lenis-prevent>
  <!-- Modal content -->
</div>
```

#### Stop/Start Scrolling
To disable scrolling (e.g., when opening a modal):

```javascript
// Stop scrolling
window.lenis.stop();

// Resume scrolling
window.lenis.start();
```

#### Nested Scrolling Elements
For elements that need their own native scrolling (like carousels or code editors):

```html
<!-- Add data-lenis-prevent to keep native scrolling -->
<div class="scrollable-element" data-lenis-prevent>
  <!-- Scrollable content -->
</div>
```

### Browser Support
Lenis works in all modern browsers. For older browsers, it gracefully falls back to native scrolling.

### GSAP Integration
When enabled, Lenis automatically integrates with GSAP ScrollTrigger animations. No additional configuration is needed for your existing GSAP animations to work with smooth scrolling.

### Performance Tips
- Use `data-lenis-prevent` on heavy scroll containers
- Adjust `lerp` value for balance between smoothness and performance
- Consider increasing `wheelMultiplier` on longer pages
- Use `immediate: true` with `scrollTo` for instant jumps

### Troubleshooting
If animations feel out of sync:
1. Ensure ScrollTrigger is properly initialized
2. Check for conflicting scroll libraries
3. Try adjusting the `lerp` value
4. Verify `data-lenis-prevent` on appropriate elements

## Modals
AlrdyAnimate supports accessible, attribute-driven modals that work seamlessly with or without smooth scrolling (Lenis).

- Trigger: 
  - Use `aa-modal-target="unique-modal-name"` on any element that should open a modal.
- Modal set up:
  - Wrap all your modals in a container with `aa-modal-group`
  - Each modal must have a unique `aa-modal-name="unique-modal-name"` attribute
  - Any element inside the modal with `aa-modal-close` will close the modal when clicked (e.g., a close button or the backdrop).
  - Apply `data-lenis-prevent`to the content div inside a modal to allow it to scroll

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

## Templates

AlrdyAnimate supports class-based animation templates, allowing you to define animations for specific classes without adding attributes to each element. This is particularly useful for consistent animations across multiple elements.

### Basic Usage

1. Define your templates in the init options:
```javascript
AlrdyAnimate.init({
  templates: {
    theme: 'floaty',  // Use a predefined theme
    custom: {         // Add custom class animations
      'my-headline': {
        animationType: 'text-slide-up',
        split: 'words',
        ease: 'power2.out',
        duration: 0.8,
        stagger: 0.05
      }
    }
  }
});
```

2. Add the corresponding classes to your HTML elements:
```html
<h1 class="my-headline">This will animate automatically</h1>
```

### Predefined Themes

AlrdyAnimate comes with predefined themes that you can use:
- `floaty`: Smooth, floating animations
- `bouncy`: Playful, bouncy animations

### Template Settings

Each template can include any animation settings that you would normally set via attributes:
- `animationType`: The type of animation (e.g., 'text-slide-up', 'fade-up')
- `split`: How to split text ('words', 'chars', 'lines')
- `ease`: Easing function
- `duration`: Animation duration
- `delay`: Animation delay
- `stagger`: Stagger timing for split text
- `distance`: Animation distance multiplier

### Mobile/Desktop Variants

You can define different animations for mobile and desktop using the `|` separator:
```javascript
templates: {
  custom: {
    '.my-headline': {
      animationType: 'text-slide-up|text-slide-down',  // desktop|mobile
      split: 'words'
    }
  }
}
```

### Priority

Template animations have lower priority than attribute-based animations. If an element has both a template class and animation attributes, the attributes will take precedence.


## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.




