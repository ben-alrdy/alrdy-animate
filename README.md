# AlrdyAnimate v2 - Complete Animation Library

A powerful, lightweight JavaScript library for creating scroll-triggered and interactive animations. Built with performance in mind, featuring both CSS-only animations and advanced GSAP-powered effects.

## Table of Contents

- [Installation & Setup](#installation--setup)
- [Core Concepts](#core-concepts)
- [Animation Types](#animation-types)
  - [1. Scroll Animations](#1-scroll-animations)
    - [1.1 CSS Animations](#11-css-animations)
    - [1.2 Load Animations (CSS-Only)](#12-load-animations-css-only)
    - [1.3 Text Animations](#13-text-animations)
    - [1.4 Appear Animations](#14-appear-animations)
    - [1.5 Parallax](#15-parallax)
    - [1.6 Section Background Color](#16-section-background-color)
    - [1.7 Section Clip](#17-section-clip)
    - [1.8 Section Stack](#18-section-stack)
  - [2. Hover Animations](#2-hover-animations)
  - [3. Interactive Components](#3-interactive-components)
    - [3.1 Slider](#31-slider)
    - [3.2 Accordion](#32-accordion)
    - [3.3 Marquee](#33-marquee)
    - [3.4 Modal](#34-modal)
    - [3.5 Navigation](#35-navigation)
- [Advanced Features](#advanced-features)
- [Configuration Reference](#configuration-reference)
- [Performance & Accessibility](#performance--accessibility)
- [Contributing](#contributing)
- [License](#license)

---

## Installation & Setup

### CDN Installation 

#### UNPKG (Recommended)
```html
<!-- Latest version -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@latest/dist/AlrdyAnimate.css">
<script src="https://unpkg.com/alrdy-animate@latest/dist/AlrdyAnimate.js"></script>

<!-- Specific version (recommended for production) -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.css">
<script src="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.js"></script>
```

#### GitHub CDN (Alternative)
```html
<!-- Latest version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@latest/cdn/AlrdyAnimate.js"></script>

<!-- Specific version -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@6.12.1/cdn/v6.12.1/AlrdyAnimate.css">
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/alrdy-animate@6.12.1/cdn/v6.12.1/AlrdyAnimate.js"></script>
```


### Webflow Integration

#### Basic Setup
Perfect for simple animations and getting started quickly:

```html
<!-- In site-wide custom code (head) -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.css">

<!-- In site-wide custom code (before </body>) -->
<script src="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.js"></script>
<script>
  async function initAlrdyAnimate() {
    if (!window.alrdyInitialized) {
      await AlrdyAnimate.init({
        // Animation defaults
        ease: 'power2.inOut',
        duration: 0.8,
        scrollStart: "top 80%",
        
        // Enable GSAP features
        gsapFeatures: ['text', 'slider', 'nav', 'accordion'],
        
        // Template system for class-based animations
        templates: {
          custom: {
            'heading-style-h2': {
              animationType: 'text-blur|text-fade',
              split: 'lines&words',
              stagger: 0.05
            },
            'heading-style-h3': {
              animationType: 'fade-up'
            }
          }
        }
      });
    }
  }

  // Handle all navigation scenarios
  document.addEventListener('DOMContentLoaded', initAlrdyAnimate);
  window.addEventListener('pageshow', (e) => { if (e.persisted) initAlrdyAnimate(); });
  window.addEventListener('popstate', initAlrdyAnimate);
</script>
```

#### Complete Setup
Full-featured setup with GSAP animations, smooth scrolling, and modals:

```html
<!-- In site-wide custom code (head) -->
<link rel="stylesheet" href="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.css">

<!-- In site-wide custom code (before </body>) -->
<script src="https://unpkg.com/alrdy-animate@6.12.1/dist/AlrdyAnimate.js"></script>
<script>
  
  function initCustomFunction() {
    // Custom functions (if needed)
  }

  async function initAlrdyAnimate() {
    if (!window.alrdyInitialized) {
      await AlrdyAnimate.init({
        // Animation defaults
        ease: 'power2.inOut',
        duration: 0.8,
        scrollStart: "top 80%",
        
        // Enable GSAP features
        gsapFeatures: ['text', 'slider', 'nav', 'accordion'],
        
        // Enable smooth scroll
        smoothScroll: {
          enabled: true,
          options: {
            lerp: 0.12,
            wheelMultiplier: 1
          }
        },
        
        // Template system for class-based animations
        templates: {
          theme: 'blur',
          custom: {
            'heading-style-h2': {
              animationType: 'text-blur|text-fade',
              split: 'lines&words',
              stagger: 0.05
            },
            'heading-style-h3': {
              animationType: 'fade-up'
            }
          }
        }
      });

      // Initialize custom functions after AlrdyAnimate
      initCustomFunction();
    }
  }

  // Handle all navigation scenarios
  document.addEventListener('DOMContentLoaded', initAlrdyAnimate);
  window.addEventListener('pageshow', (e) => { if (e.persisted) initAlrdyAnimate(); });
  window.addEventListener('popstate', initAlrdyAnimate);
</script>

<!-- In page-specific custom code -->
<script>
  document.addEventListener('DOMContentLoaded', () => {
    AlrdyAnimate.initPageAnimations(() => {
      
    });
  });
</script>
```

---

## Core Concepts

### Animation Triggers

AlrdyAnimate supports multiple animation triggers:

| Trigger | Attribute | Description | Use Case |
|---------|-----------|-------------|----------|
| **Scroll** | `aa-animate` | Triggers when element enters viewport | Most common animations |
| **Load** | `aa-load` | Triggers immediately on page load | Hero sections, above-fold content |
| **Hover** | `aa-hover` | Triggers on mouse hover | Interactive elements, buttons |

### Scroll Positioning System

Control exactly when animations trigger using GSAP ScrollTrigger syntax:

```html
<!-- Basic usage -->
<div aa-animate="fade-up" aa-scroll-start="top 80%">
  Animates when element's top reaches 80% down the viewport
</div>

<!-- Advanced positioning -->
<div aa-animate="slide-left" 
     aa-scroll-start="center center" 
     aa-scroll-end="bottom top">
  Precise control over animation timing
</div>

<!-- Mobile/Desktop variants -->
<div aa-animate="fade-up" 
     aa-scroll-start="top 80%|top 60%"
     aa-delay="0.2|0.1">
  Different behavior on mobile vs desktop
</div>
```

### Attribute System

AlrdyAnimate uses a consistent attribute naming system:

| Pattern | Example | Purpose |
|---------|---------|---------|
| `aa-animate` | `aa-animate="fade-up"` | Primary animation type |
| `aa-[property]` | `aa-duration="0.8"` | Animation properties |
| `aa-[feature]` | `aa-slider="draggable"`, `aa-accordion="multi"`, `aa-marquee="left"` | Interactive component behavior |
| `aa-[feature]-[element]` | `aa-slider-item`, `aa-accordion-toggle`, `aa-marquee-scroller` | Feature-specific elements |

### Children & Anchor Animations

#### Children Animations
Apply animations to all child elements with staggering:

```html
<!-- Apply same animation to all children -->
<div aa-children="fade-up" aa-stagger="0.1" aa-delay="0.2">
  <div>Child 1 (animates at 0.2s)</div>
  <div>Child 2 (animates at 0.3s)</div>
  <div>Child 3 (animates at 0.4s)</div>
</div>
```

#### Anchor-Triggered Animations
Trigger animations based on other elements scrolling into view:

```html
<!-- Animation triggered by anchor element -->
<div aa-animate="slide-left" aa-anchor="#trigger">
  This animates when the trigger element comes into view
</div>

<!-- Trigger element (can be anywhere on page) -->
<div id="trigger">Trigger Element</div>

<!-- Works with classes too -->
<div aa-animate="fade-up" aa-anchor=".my-trigger">
  Triggered by any element with class "my-trigger"
</div>
<div class="my-trigger">Another trigger</div>
```

**Use Cases:**
- Fixed elements that should animate based on content
- Coordinated animations across different page sections
- Complex animation sequences

---

## Animation Types

## 1. Scroll Animations

### 1.1 CSS Animations

Lightweight, performant animations triggered when elements scroll into view.

**Available Animations:**
- **Fade**: `fade`, `fade-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Float**: `float-[direction]` (with bounce) where `[direction]` = `up`, `down`, `left`, `right`
- **Slide**: `slide-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Zoom**: `zoom-in`, `zoom-out`, `zoom-in-[direction]`, `zoom-out-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Rotate**: `rotate-[position]-[rotation]` where `[position]` = `br`, `bl`, `tr`, `tl`, `c` and `[rotation]` = `cw`, `ccw`
  - **Base rotation**: 5 degrees (multiply with `aa-distance` for stronger effect)
  - **Position**: `br` = bottom-right, `bl` = bottom-left, `tr` = top-right, `tl` = top-left, `c` = center
  - **Rotation**: `cw` = clockwise, `ccw` = counter clockwise
- **3D**: `swing-fwd`, `swing-bwd`, `turn-3d-soft`, `turn-3d-elliptic`, `flip-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Blur**: `blur`, `blur-in`
- **Pseudo Reveal**: `pseudo-reveal-[direction]#color` where `[direction]` = `up`, `down`, `left`, `right`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | Animation name | - | Animation type |
| `aa-duration` | Number (seconds) | `1` | Animation duration |
| `aa-delay` | Number (seconds) | `0` | Animation delay |
| `aa-delay-mobile` | Number (seconds) | - | Mobile-specific delay |
| `aa-distance` | Number | `1` | Distance multiplier |
| `aa-ease` | Easing function | `ease-in-out` | Animation easing |
| `aa-scroll-start` | Position | `top 80%` | When animation starts |
| `aa-anchor` | CSS selector | - | Trigger element |

**Examples:**
```html
<div aa-animate="fade-up" aa-duration="0.8" aa-delay="0.2">Basic fade up</div>
<div aa-animate="float-left" aa-distance="2" aa-ease="back.out">Stronger float</div>
<div aa-animate="zoom-in-up" aa-scroll-start="top 90%">Zoom with slide</div>
<div aa-animate="rotate-br-cw" aa-distance="3">Rotate from bottom-right</div>
```


---

### 1.2 Load Animations (CSS-Only)

Animations that trigger immediately when the page loads, without JavaScript initialization.

**Setup:** Use `aa-load` attribute (no `AlrdyAnimate.init()` required)

**Available Animations:** Similar to the above CSS animations, check the code file in Webflow

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-load` | Animation name | - | Animation triggered on page load |
| `aa-stagger` | Number (seconds) | - | (Parent) Stagger child animations |
| `aa-delay` | Number (seconds) | - | Delay for animation |
| `aa-duration` | Number (seconds) | - | Duration for animation |

**Examples:**
```html
<!-- Single load animation -->
<div aa-load="fade-up">
  Fades up immediately on page load
</div>

<!-- Staggered load animations (up to 10 children) -->
<div aa-load="fade-up" aa-stagger="0.2">
  <div>Item 1 (0s)</div>
  <div>Item 2 (0.2s)</div>
  <div>Item 3 (0.4s)</div>
  <div>Item 4 (0.6s)</div>
</div>
```

---

### 1.3 Text Animations

Advanced text splitting and animation effects.

**Setup:** `gsapFeatures: ['text']`

**Available Animations:**
- **Slide**: `text-slide-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Tilt**: `text-tilt-[direction]` where `[direction]` = `up`, `down`
- **Fade**: `text-fade`, `text-fade-30`, `text-fade-10` (opacity-only animations)
- **Scale**: `text-scale-up`
- **Blur**: `text-blur`, `text-blur-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Rotate**: `text-rotate-soft` (3D rotation around X-axis)
- **Block**: `text-block-[direction]` where `[direction]` = `up`, `down`, `left`, `right`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `text-[type]` | - | Text animation type |
| `aa-split` | `words`, `chars`, `lines`, `lines&words` | `words` | How to split text |
| `aa-stagger` | Number (seconds) | `0.05` | Delay between split elements |
| `aa-duration` | Number (seconds) | `0.8` | Animation duration |
| `aa-scrub` | `true`, number | - | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |
| `aa-color` | Hex color | - | Block color for text-block animation |

**Examples:**
```html
<h1 aa-animate="text-slide-up" aa-split="words" aa-stagger="0.05">Word by word</h1>
<p aa-animate="text-fade" aa-split="chars" aa-stagger="0.02">Character reveal</p>
<div aa-animate="text-tilt-up-clip" aa-split="lines">Clipped lines</div>
<span aa-animate="text-blur-up" aa-split="words|random">Random order</span>
```

---

### 1.4 Appear Animations

Smooth transitions and reveals with GSAP.

**Setup:** `gsapFeatures: ['scroll']`

**Available Animations:**
- **Appear**: `appear`, `appear-up/down/left/right`
- **Reveal**: `reveal-up/down/left/right/center` (clip path)
- **Counter**: `counter`, `counter-[startNumber]`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | Animation name | - | Animation type |
| `aa-duration` | Number (seconds) | `0.8` | Animation duration |
| `aa-delay` | Number (seconds) | `0` | Animation delay |
| `aa-distance` | Number | `1` | Distance multiplier |
| `aa-scrub` | `true`, number | - | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |

**Examples:**
```html
<div aa-animate="appear-left" aa-duration="1.2">Smooth appear</div>
<img aa-animate="reveal-center" aa-scrub="1" src="image.jpg">
<span aa-animate="counter">1,250</span>
<span aa-animate="counter-100" aa-scrub="2">500</span>
```

---

### 1.5 Parallax

Scroll-driven movement effects.

**Setup:** `gsapFeatures: ['scroll']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `parallax`, `parallax-horizontal` | - | Parallax type |
| `aa-parallax-target` | CSS selector | Self | Element to animate |
| `aa-parallax-start` | Number (%) | `20` | Start position |
| `aa-parallax-end` | Number (%) | `-20` | End position |
| `aa-scroll-start` | Position | `top bottom` | When to start |
| `aa-scroll-end` | Position | `bottom top` | When to end |
| `aa-scrub` | `true`, number | `true` | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |

**Examples:**
```html
<div aa-animate="parallax">
  <img src="bg.jpg" alt="Background">
</div>

<div aa-animate="parallax-horizontal" 
     aa-parallax-target=".inner" 
     aa-parallax-start="50" 
     aa-parallax-end="-30">
  <div class="inner">Horizontal movement</div>
</div>
```

---

### 1.6 Section Background Color

Animated background transitions between sections.

**Setup:** `gsapFeatures: ['scroll']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `background` | - | Background transition |
| `aa-duration` | Number (seconds) | `0.8` | Transition duration |
| `aa-ease` | Easing function | `power2.inOut` | Transition easing |
| `aa-scrub` | `true`, number | - | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |
| `aa-wrapper-colors` | `bg:color;text:color` | - | Wrapper colors |
| `aa-item-colors` | `bg:color;text:color` | - | Item colors |

**Examples:**
```html
<div aa-animate="background" aa-duration="0.8">
  <section aa-wrapper-colors="bg:#f0f0f0;text:#000">Light section</section>
  <section aa-wrapper-colors="bg:#000;text:#fff">Dark section</section>
</div>
```

---

### 1.7 Section Clip

Clip path animations for sections.

**Setup:** `gsapFeatures: ['scroll']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `clip` | - | Clip animation |
| `aa-scroll-start` | Position | `top bottom` | When to start |
| `aa-scroll-end` | Position | `bottom top` | When to end |

**Examples:**
```html
<div aa-animate="clip">Section with clip animation</div>
```

---

### 1.8 Section Stack

Stacking scroll effects.

**Setup:** `gsapFeatures: ['scroll']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `stack` | - | Stack animation |
| `aa-distance` | Number | `1` | Stack distance |
| `aa-scrub` | `true`, number | `true` | Scroll-driven |

**Examples:**
```html
<div aa-animate="stack" aa-distance="2">Stacking section</div>
```

---

## 2. Hover Animations

Interactive hover effects with sophisticated animations and state management.

**Setup:** `gsapFeatures: ['hover']`

### Animation Types & Element Tags

Hover animations require specific element tags to identify what should be animated:

#### Text Animations
**Available Animations:**
- **Slide**: `text-slide-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Fade**: `text-fade-[direction]` where `[direction]` = `up`, `down`, `left`, `right`

**Required Element Tags:**
- `aa-hover-text` - Marks the text element to animate

**Requirements:**
- Parent wrapper with `position: relative` and `overflow: hidden`
- Use `aa-split` to define text splitting method
- Add `-reverse` suffix for exit animation (e.g., `text-slide-up-reverse`)

#### Background Animations  
**Available Animations:**
- **Circle**: `bg-circle` - Expands circle from hover point
  - **Direction Control**: Include direction in animation name (e.g., `bg-circle-vertical`)
  - **Options**: `all` (default), `vertical`, `horizontal`, `top`, `bottom`, `left`, `right`
- **Curve**: `bg-curve` - Animates SVG path for wave effects
  - **Direction Control**: Include direction in animation name (e.g., `bg-curve-up`, `bg-curve-horizontal`)
  - **Options**: `all` (default), `vertical`, `horizontal`, `top`, `bottom`, `left`, `right`
- **Expand**: `bg-expand` - Expands shape to fill element

**Required Element Tags:**
- `aa-hover-bg` - Marks the background element (SVG or div)
- `aa-hover-content` - Optional, marks content to position above background

**Background Options:**
- Add `-reverse` suffix for exit animation (e.g., `bg-expand-reverse`)

#### Icon Animations
**Available Animations:**
- **Directional**: `icon-[direction]` where `[direction]` = `right`, `left`, `up`, `down`, `up-right`, `up-left`, `down-right`, `down-left`

**Required Element Tags:**
- `aa-hover-icon` - Marks the icon element (usually SVG)

**Icon Options:**
- Add `-reverse` suffix for exit animation (e.g., `icon-right-reverse`)

### Combining Animations

Use the `&` operator to combine multiple hover effects:

```html
<!-- Text + Icon -->
<a aa-hover="text-slide-up&icon-right">
  <span aa-hover-text>Learn More</span>
  <svg aa-hover-icon><!-- arrow icon --></svg>
</a>

<!-- Background + Text + Icon -->
<button aa-hover="bg-circle-vertical&text-fade-up&icon-right">
  <span aa-hover-content>
    <span aa-hover-text>Multi-Effect Button</span>
    <svg aa-hover-icon><!-- icon --></svg>
  </span>
  <svg aa-hover-bg viewBox="0 0 1 1">
    <circle cx="0.5" cy="0.5" r="0" fill="currentColor"></circle>
  </svg>
</button>
```

### Color Animations

Add color changes to any hover animation:

**Color Element Tags:**
- `aa-hover-text-color="color"` - Changes text color on hover
- `aa-hover-bg-color="color"` - Changes background color on hover

### Attributes & Defaults

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-hover` | Animation type(s) | - | Hover animation(s), combine with `&` |
| `aa-duration` | Number (seconds) | `0.3` | Animation duration |
| `aa-delay` | Number (seconds) | `0` | Animation delay |
| `aa-split` | `words`, `chars`, `lines` | `words` | Text splitting method |
| `aa-stagger` | Number (seconds) | `0.03` | Stagger between text elements |
| `aa-distance` | Number (seconds) | `0.1` | Delay between original and clone text |
| `aa-hover-text-color` | Color | - | Text color on hover |
| `aa-hover-bg-color` | Color | - | Background color on hover |

### Complete Examples

#### Text Slide Animation
```html
<a aa-hover="text-slide-up-reverse" aa-split="words" aa-stagger="0.02">
  <div style="position: relative; overflow: hidden;">
    <span aa-hover-text>Hover for sliding text</span>
  </div>
</a>
```

#### Circle Background Animation
```html
<button aa-hover="bg-circle-vertical" aa-duration="0.8">
  <span aa-hover-content>Circle Button</span>
  <svg aa-hover-bg viewBox="0 0 1 1" class="absolute inset-0 w-full h-full">
    <circle cx="0.5" cy="0.5" r="0" fill="currentColor"></circle>
  </svg>
</button>
```

#### Wave Background Animation
```html

<a aa-hover="bg-curve-horizontal" aa-duration="0.6">
  <span aa-hover-content>Horizontal Wave</span>
  <svg aa-hover-bg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full">
    <path d="M 0 100 V 0 Q 50 0 100 0 V 100 z" fill="currentColor"></path>
  </svg>
</a>

<a aa-hover="bg-curve-bottom" aa-duration="0.6">
  <span aa-hover-content">Bottom Wave Only</span>
  <svg aa-hover-bg viewBox="0 0 100 100" class="absolute inset-0 w-full h-full">
    <path d="M 0 100 V 0 Q 50 0 100 0 V 100 z" fill="currentColor"></path>
  </svg>
</a>
```

#### Expand Background Animation
```html
<div aa-hover="bg-expand-reverse" aa-duration="0.5">
  <span aa-hover-content>Expanding Background</span>
  <div aa-hover-bg class="absolute inset-0 bg-blue-500 scale-0"></div>
</div>
```

#### Icon Animation
```html
<a aa-hover="icon-up-right-reverse" aa-duration="0.4">
  <span>Learn More</span>
  <svg aa-hover-icon class="w-4 h-4">
    <path d="M5 12h14m-7-7l7 7-7 7"/>
  </svg>
</a>
```

#### Advanced Combined Animation
```html
<button aa-hover="bg-expand-reverse&text-slide-up&icon-right" 
        aa-split="chars" 
        aa-stagger="0.01" 
        aa-duration="0.6">
  <span aa-hover-content>
    <span aa-hover-text aa-hover-text-color="#ffffff">
      Multi-Effect Button
    </span>
    <svg aa-hover-icon class="w-4 h-4">
      <path d="M5 12h14m-7-7l7 7-7 7"/>
    </svg>
  </span>
  <div aa-hover-bg aa-hover-bg-color="#000000" 
       class="absolute inset-0 scale-0"></div>
</button>
```

#### Character-by-Character Text Animation
```html
<h2 aa-hover="text-fade-right" aa-split="chars" aa-stagger="0.01">
  <div style="position: relative; overflow: hidden; padding: 0.5em;">
    <span aa-hover-text>Character Animation</span>
  </div>
</h2>
```

### CSS Requirements

#### Text Animations
```css
.text-hover-wrapper {
  position: relative;
  overflow: hidden;
}

/* For fade effects, add padding to make room */
.text-fade-wrapper {
  padding: 0.5em;
}
```

#### Background Animations
```css
.hover-element {
  position: relative;
}

[aa-hover-bg] {
  position: absolute;
  top: 0;
  left: 0;
  width: 100%;
  height: 100%;
  pointer-events: none;
}

[aa-hover-content] {
  position: relative;
  z-index: 1;
}
```

---

## 3. Interactive Components

### 3.1 Slider

Infinite scrolling, snapping, and static slider animations.

**Setup:** `gsapFeatures: ['slider']`

**Initialization:**
Add `aa-slider` to the wrapper that contains the slider elements. Optionally, add the below features to the attribute.

**Feature Detection:**
The slider system detects features by checking for keywords in the type:
- `center` - Centers the active slide
- `draggable` - Enables drag/swipe functionality
- `loop` - Creates continuous looping animation
- `snap` - Enables autoplay with snapping between slides
- `reverse` - Reverses the animation direction
- `vertical` - Creates vertical slider instead of horizontal
- `none` - Useful in combination with the `|` separator for responsive deactivation, e.g. `aa-slider=none|draggable-center`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-slider` | Slider type | - | Slider animation type |
| `aa-duration` | Number (seconds) | `20` (loop), `0.8` (snap) | Speed/duration |
| `aa-delay` | Number (seconds) | `3` | Pause between snaps |
| `aa-slider-item` | - | - | Marks slider items |
| `aa-slider-prev` | - | - | Previous button |
| `aa-slider-next` | - | - | Next button |
| `aa-slider-current` | - | - | Current slide number |
| `aa-slider-total` | - | - | Total slide count |
| `aa-slider-button` | - | - | Pagination button |
| `aa-slider-target` | Slider ID | - | Target slider for external controls |
| `aa-slider-progress` | `width`, `height`, `circle` | - | Progress indicator type |

**CSS Requirements:**
- Container needs `display: flex` and `gap` set for spacing between slides
- Items need fixed width (percentage or pixels) and `flex-shrink: 0`
- **Important**: The slider items cannot have border or padding; if you need such styles, nest another div inside the item and apply the styles to that nested div
- Animations can be added to elements within items, but not directly on the slider items themselves

```css
.slider-container {
  display: flex;
  gap: 2rem; /* This gap is automatically detected and used for spacing */
}

.slider-item {
  width: 300px; /* Fixed width required */
  flex-shrink: 0; /* Prevents items from shrinking */
}

/* Apply styling to nested elements, not the slider item directly */
.slider-item-content {
  border: 1px solid #ccc;
  padding: 2rem;
  border-radius: 8px;
}
```

**Mobile Variants:**
Use the `|` separator to define different slider behavior for desktop and mobile:
```html
<!-- Desktop: no slider, Mobile: draggable slider -->
<div aa-slider="none|draggable">
  <div aa-slider-item>Item 1</div>
  <div aa-slider-item>Item 2</div>
</div>

<!-- Desktop: center slider, Mobile: no slider -->
<div aa-slider="center|none">
  <div aa-slider-item>Item 1</div>
  <div aa-slider-item>Item 2</div>
</div>
```

**Examples:**
```html
<!-- Static slider -->
<div aa-slider="center-draggable" id="main-slider">
  <div class="slider-container">
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 1 Content</div>
    </div>
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 2 Content</div>
    </div>
  </div>
  <button aa-slider-prev>←</button>
  <button aa-slider-next>→</button>
</div>

<!-- Loop slider -->
<div aa-slider="loop-reverse" aa-duration="25">
  <div class="slider-container">
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 1</div>
    </div>
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 2</div>
    </div>
  </div>
</div>

<!-- Snap slider with progress -->
<div aa-slider="snap" aa-duration="0.6" aa-delay="4">
  <div class="slider-container">
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 1</div>
    </div>
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 2</div>
    </div>
  </div>
  <div aa-slider-progress="width" class="progress-bar"></div>
</div>

<!-- Mobile variant slider -->
<div aa-slider="none|draggable">
  <div class="slider-container">
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 1</div>
    </div>
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 2</div>
    </div>
    <div aa-slider-item class="slider-item">
      <div class="slider-item-content">Item 3</div>
    </div>
  </div>
</div>
```

---

### 3.2 Accordion

Accessible accordion functionality with GSAP animations. Create expandable/collapsible sections with smooth height animations and inner content animations.

**Setup:** `gsapFeatures: ['accordion']`

**Note:** Opening/closing is animated via CSS transition of the grid `fr` unit, while inner content animations are handled by GSAP. This is why `aa-accordion-content` needs the `aa-animate` attribute to set `aa-duration` and `aa-ease`.

#### Component Structure

**Main Component Attributes:**
- `aa-accordion` - Single accordion (only one open at a time)
- `aa-accordion="multi"` - Multi accordion (multiple can be open)
- `aa-accordion="autoplay"` - Autoplay accordion with progress indicators

**Element Attributes:**
- `aa-accordion-toggle=ID` - Marks the clickable toggle element
- `aa-accordion-content=ID` - Marks the expandable content element
- `aa-accordion-visual=ID` - Marks connected visual content element
- `aa-accordion-initial` - On load, activates this toggle and opens content

**Progress Indicators (Autoplay):**
- `aa-accordion-progress` - Progress indicator type: `width`, `height`, `circle`

#### Available Inner Animations

**Simple Animations:**
- **Fade**: `fade`, `fade-up`, `fade-down`, `fade-left`, `fade-right`
- **Slide**: `slide-up`, `slide-down`, `slide-left`, `slide-right`
- **Scale**: `scale`

**Complex Animations (requires GSAP plugins):**
- **Appear**: All [Appear animations](#14-appear-animations) available
- **Reveal**: All [Appear animations](#14-appear-animations) available (reveal variants)
- **Counter**: All [Appear animations](#14-appear-animations) available (counter variants)

**Text Animations (requires splitText plugin):**
- **Text Animations**: All [Text animations](#13-text-animations) available

**Custom Animations:**
Use `custom-*` to animate from CSS-defined positions to zero:
```css
[aa-accordion-animate="custom-slide"] {
  transform: translateX(500px);
}
```

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-accordion` | Accordion type | - | Accordion behavior |
| `aa-duration` | Number (seconds) | `5` (autoplay), `0.2` (inner) | Duration |
| `aa-ease` | Easing function | `power4.out` | Animation easing |
| `aa-delay` | Number (seconds) | `0.3` | Delay before inner animations |
| `aa-accordion-toggle` | ID | - | Toggle element |
| `aa-accordion-content` | ID | - | Content element |
| `aa-accordion-visual` | ID | - | Connected visual |
| `aa-accordion-initial` | - | - | Initially open |
| `aa-accordion-animate` | Animation type | - | Inner animation |
| `aa-accordion-order` | Number or `number-percent` | `0` | Animation sequence |
| `aa-accordion-progress` | `width`, `height`, `circle` | - | Progress type |
| `aa-split` | `words`, `chars`, `lines` | - | Text splitting method |
| `aa-stagger` | Number (seconds) | `0.01` | Text stagger delay |
| `aa-distance` | Number | `1` | Distance for complex animations |

**Examples:**

#### Basic Accordion
```html
<div aa-accordion>
  <div aa-accordion-toggle="item-1" aa-accordion-initial>
    <h3>Accordion Item 1</h3>
  </div>
  <div aa-accordion-content="item-1" aa-animate>
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-accordion-animate="fade" aa-accordion-order="0">
          <p>Content for item 1</p>
        </div>
        <div aa-accordion-animate="text-slide-up" aa-accordion-order="1" aa-split="words">
          <p>More content with text animation</p>
        </div>
      </div>
    </div>
  </div>
  
  <div aa-accordion-toggle="item-2">
    <h3>Accordion Item 2</h3>
  </div>
  <div aa-accordion-content="item-2" aa-animate>
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-accordion-animate="appear-up" aa-accordion-order="0">
          <p>Content for item 2</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Autoplay with Progress
```html
<div aa-accordion="autoplay" aa-duration="5">
  <div aa-accordion-toggle="autoplay-1">
    <h3>Autoplay Item 1</h3>
    <div aa-accordion-progress="width"></div>
  </div>
  <div aa-accordion-content="autoplay-1" aa-animate aa-duration="0.5" aa-ease="power2.inOut">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-accordion-animate="fade" aa-accordion-order="0">
          <p>Content for autoplay item 1</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Connected Visual Elements
```html
<div aa-accordion>
  <div aa-accordion-toggle="visual-1" aa-accordion-initial>
    <h3>Visual Item 1</h3>
  </div>
  <div aa-accordion-content="visual-1" aa-delay="0.3">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-accordion-animate="fade" aa-accordion-order="0">
          <p>This controls the visual on the right</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Connected visual elements -->
  <div class="visual-container">
    <div aa-accordion-visual="visual-1" aa-accordion-animate="fade-left" aa-duration="0.4" aa-delay="0.2">
      <span>Visual 1</span>
    </div>
  </div>
</div>
```

#### Circular Progress
```html
<div aa-accordion="autoplay" aa-duration="3">
  <div aa-accordion-toggle="circle-1">
    <div>
      <span>Circular Progress Item</span>
      <div class="autoplay-progress circular-progress">
        <svg width="60" height="60" viewBox="0 0 60 60">
          <circle cx="30" cy="30" r="25" fill="none" stroke="#e0e0e0" stroke-width="4"/>
          <circle cx="30" cy="30" r="25" fill="none" stroke="#007bff" stroke-width="4" 
                  stroke-linecap="round" aa-accordion-progress="circle" aa-ease="power2.out"/>
        </svg>
      </div>
    </div>
  </div>
  <div aa-accordion-content="circle-1">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-accordion-animate="text-slide-up" aa-accordion-order="0" aa-split="words">
          <p>This uses a circular progress indicator.</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

#### Required CSS Structure

**Content Structure:**
```css
.content-inner {
  height: 100000%;
  display: flex;
  position: relative;
  overflow: hidden;
}

.content-wrapper {
  /* Contains actual content and provides padding */
}
```

**Circular Progress:**
```css
[aa-accordion-progress="circle"] {
  stroke-dasharray: 10000;
  stroke-dashoffset: 10000; /* Empty circle initially */
}
.autoplay-progress svg {
  transform: rotate(-90deg); /* Start from top */
}
```

#### Accessibility Features

- **Keyboard Navigation**: Tab to focus, Enter/Space to toggle
- **ARIA Attributes**: Automatic `aria-expanded`, `aria-controls`, `aria-labelledby`
- **Screen Reader Support**: Proper announcements and state changes
- **Focus Management**: Maintains focus during interactions

#### CSS Targeting

Use status attributes for styling:
```css
[aa-accordion-status="active"] {
  /* Active styles */
}

[aa-accordion-toggle][aa-accordion-status="active"] {
  /* Active toggle styles */
}
```

---

### 3.3 Marquee

Scrolling text and content animations.

**Setup:** `gsapFeatures: ['marquee']`

**Available Types:**
- **Basic**: `left`, `right`
- **Interactive**: `left-hover`, `right-hover`, `left-switch`, `right-switch`
- **Paused**: `left-paused`, `right-paused` (scroll-driven only)

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-marquee` | Marquee type | - | Marquee animation |
| `aa-duration` | Number (seconds) | `15` | Animation duration |
| `aa-marquee-scroller` | Number | `0` | Scroll speed multiplier |
| `aa-marquee-items` | Number | `2` | Number of duplicates |
| `aa-scrub` | `true`, number | - | Scroll-driven (for paused) |

**Examples:**
```html
<!-- Basic marquee -->
<div aa-marquee="left" aa-duration="20">
  <div aa-marquee-scroller="10">
    <div aa-marquee-items="3">
      <div class="item">Text 1</div>
      <div class="item">Text 2</div>
    </div>
  </div>
</div>

<!-- Interactive marquee -->
<div aa-marquee="right-hover-switch" aa-duration="15">
  <div aa-marquee-scroller="5">
    <div aa-marquee-items="4">
      <div class="item">Hover slows, scroll changes direction</div>
    </div>
  </div>
</div>
```

---

### 3.4 Modal

Accessible, attribute-driven modals that work seamlessly with or without smooth scrolling (Lenis).

**Setup:** `gsapFeatures: ['modal']` and `modals: true`

#### Basic Structure

- **Trigger**: Use `aa-modal-target="unique-modal-name"` on any element that should open a modal
- **Modal Container**: Wrap all modals in a container with `aa-modal-group` (add unique identifier for multiple groups)
- **Modal Element**: Each modal needs a unique `aa-modal-name="unique-modal-name"` attribute  
- **Close Elements**: Any element with `aa-modal-close` will close the modal when clicked (buttons, backdrop, etc.)
- **Scrollable Content**: Apply `data-lenis-prevent` to content areas that need independent scrolling

#### Available Animations

**Simple Animations:**
- **Fade**: `fade`, `fade-up`, `fade-down`, `fade-left`, `fade-right`
- **Slide**: `slide-up`, `slide-down`, `slide-left`, `slide-right`
- **Scale**: `scale`

**Complex Animations (requires GSAP plugins):**
- **Appear**: All [Appear animations](#14-appear-animations) available
- **Reveal**: All [Appear animations](#14-appear-animations) available (reveal variants)
- **Counter**: All [Appear animations](#14-appear-animations) available (counter variants)

**Text Animations (requires splitText plugin):**
- **Text Animations**: All [Text animations](#13-text-animations) available

**Custom Animations:**
Use `custom-*` to animate from CSS-defined positions to zero:
```css
[aa-modal-animate="custom-slide"] {
  transform: translateX(500px);
}
```

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-modal-group` | Optional ID | - | Modal container (for multiple groups) |
| `aa-modal-target` | Modal name | - | Opens specified modal |
| `aa-modal-name` | Unique name | - | Modal identifier |
| `aa-modal-close` | - | - | Closes modal when clicked |
| `aa-modal-animate` | Animation type | - | Element animation |
| `aa-modal-order` | Number or `number-percent` | `0` | Animation sequence |
| `aa-duration` | Number (seconds) | `0.5` | Animation duration |
| `aa-ease` | Easing function | `power2.out` | Animation easing |

#### Animation Sequencing

- **Basic order**: `aa-modal-order="1"` (elements animate in numeric order)
- **Overlapping**: `aa-modal-order="1-30"` (starts at 30% of previous animation)

**Examples:**
```html
<!-- Trigger -->
<button aa-modal-target="example-modal">Open Modal</button>

<!-- Modal system -->
<div aa-modal-group>
  <div aa-modal-name="example-modal" class="modal">
    <!-- Backdrop closes modal -->
    <div class="modal-backdrop" aa-modal-close></div>
    
    <!-- Content with independent scrolling -->
    <div class="modal-content" data-lenis-prevent>
      <button aa-modal-close class="close-btn">×</button>
      
      <!-- Animated content -->
      <h2 aa-modal-animate="fade-up" aa-modal-order="0">Modal Title</h2>
      <p aa-modal-animate="fade" aa-modal-order="1">Modal content with animations</p>
      <div aa-modal-animate="scale" aa-modal-order="2">
        <img src="image.jpg" alt="Modal image">
      </div>
      
      <!-- Text animation -->
      <p aa-modal-animate="text-slide-up" aa-modal-order="1-50" aa-split="words">
        Text with word-by-word animation
      </p>
    </div>
  </div>
</div>

<!-- Multiple modal groups -->
<div aa-modal-group="gallery">
  <div aa-modal-name="image-1" class="modal">
    <div class="modal-content" data-lenis-prevent>
      <!-- Gallery modal content -->
    </div>
  </div>
</div>
```

#### Important Notes

- **Lenis Integration**: Use `data-lenis-prevent` on modal content to allow independent scrolling
- **Accessibility**: Built-in keyboard navigation (Escape to close) and focus management
- **Multiple Groups**: Use `aa-modal-group="group-name"` for organizing different modal groups
- **Custom Animations**: Define starting positions in CSS for `custom-*` animations

---

### 3.5 Navigation

Scroll-responsive navigation with animations.

**Setup:** `gsapFeatures: ['nav']`

**Available Types:**
- **Hide**: `hide` (hide on scroll down, show on scroll up)
- **Change**: `change` (adds `is-scrolled` class after threshold)
- **Combined**: `hide-change` (both effects)
- **Threshold**: Add number for pixel threshold when to trigger `change` effect (e.g., `change-100`, `hide-change-50`); defaults to 100px

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-nav` | Navigation type | - | Navigation behavior |
| `aa-duration` | Number (seconds) | `0.4` | Animation duration |
| `aa-ease` | Easing function | `back.inOut` | Animation easing |
| `aa-distance` | Number | `1` | Movement multiplier |

**Examples:**
```html
<!-- Hide/show navigation -->
<nav aa-nav="hide" aa-duration="0.4" aa-ease="back.inOut" style="position: fixed;">
  Navigation content
</nav>

<!-- Class change navigation -->
<nav aa-nav="change-100" style="position: fixed;">
  Adds 'is-scrolled' class after 100px scroll
</nav>

<!-- Combined effects -->
<nav aa-nav="hide-change-50" aa-distance="2" style="position: fixed;">
  Hide/show + 'is-scrolled' class after 50px
</nav>

<!-- Default threshold -->
<nav aa-nav="change" style="position: fixed;">
  Adds 'is-scrolled' class after 100px scroll (default)
</nav>
```

---

## Advanced Features

### Template System
Define animations for CSS classes instead of individual elements.

```javascript
AlrdyAnimate.init({
  templates: {
    theme: 'blur', // Use predefined theme
    custom: {
      'hero-title': {
        animationType: 'text-slide-up-clip',
        split: 'lines',
        stagger: 0.1,
        duration: 0.8,
        ease: 'back.out'
      },
      'card-item': {
        animationType: 'fade-up',
        duration: 0.6,
        delay: 0.2
      }
    }
  }
});
```

```html
<!-- No attributes needed - animations applied by class -->
<h1 class="hero-title">Automatically animated</h1>
<div class="card-item">Also animated</div>
```

**Available Themes:**
- `blur` - Blur-based text animations
- `tilt` - Tilt and slide animations

### Smooth Scrolling (Lenis)
```javascript
AlrdyAnimate.init({
  smoothScroll: {
    enabled: true,
    options: {
      lerp: 0.12,        // Smoothness (0.01-1)
      wheelMultiplier: 1, // Mouse wheel speed
      touchMultiplier: 2, // Touch scroll speed
      smoothWheel: true   // Enable smooth wheel
    }
  }
});
```

#### Navigation Tracking with `is-current`

When using scroll-to functionality with Lenis, AlrdyAnimate automatically tracks which sections are in view and adds the `is-current` class to corresponding navigation elements.

```html
<!-- Navigation links -->
<nav>
  <a href="#section1" aa-scroll-target="#section1">Section 1</a>
  <a href="#section2" aa-scroll-target="#section2">Section 2</a>
  <a href="#section3" aa-scroll-target="#section3">Section 3</a>
</nav>

<!-- Sections -->
<section id="section1">Content 1</section>
<section id="section2">Content 2</section>
<section id="section3">Content 3</section>
```

**How it works:**
- Triggers when section reaches 50% of viewport
- Automatically adds `is-current` class to corresponding nav link
- Removes class when section leaves view

**CSS Example:**
```css
nav a.is-current {
  color: #007bff;
  font-weight: bold;
}
```

#### Lenis Control & Features

**Prevent Smooth Scrolling:**
```html
<div data-lenis-prevent>
  <!-- Native scrolling within this element -->
</div>
```

**Programmatic Control:**
```javascript
// Stop/start scrolling
window.lenis.stop();
window.lenis.start();

// Scroll to element
window.lenis.scrollTo('#target', {
  duration: 1.5,
  easing: t => 1 - Math.pow(1 - t, 3)
});
```

### CSS Animation Playstate Control

Control CSS animation playback based on element visibility.

```html
<!-- Pause/play animations based on visibility -->
<div aa-toggle-playstate>
  <div class="play-icon-pulse">Child 1</div>
  <div class="play-icon-blink">Child 2</div>
</div>
```

**How it works:**
- Adds `aa-toggle-playstate` to parent element
- All first-level children with animations will be controlled
- `animation-play-state: running` when parent is in view
- `animation-play-state: paused` when parent is out of view
- Only affects CSS animations (not GSAP animations)

### Mobile Responsive Features

AlrdyAnimate provides comprehensive mobile support with automatic detection and responsive behavior.

#### Mobile Detection
- **Breakpoint**: `768px` (mobile = `< 768px`)
- **Automatic**: Detects on initialization and window resize
- **Rebuilds**: Animations automatically rebuild when crossing breakpoint

#### Mobile Variants (Desktop|Mobile)

Use the `|` separator to define different values for desktop and mobile, available for `aa-animate` and `aa-scroll-start/end`:

**Animation Types:**
```html
<!-- Different animations for desktop vs mobile -->
<div aa-animate="text-slide-up|fade-up">
  Desktop: text slides up, Mobile: simple fade up
</div>

<div aa-animate="zoom-in-left|slide-up">
  Desktop: zoom with slide, Mobile: slide only
</div>
```

**Scroll Positioning:**
```html
<!-- Different scroll triggers -->
<div aa-animate="fade-up" 
     aa-scroll-start="top 80%|top 60%"
     aa-scroll-end="bottom 70%|bottom 50%">
  Desktop: 80%/70%, Mobile: 60%/50%
</div>

<!-- Center positioning variants -->
<div aa-animate="parallax" 
     aa-scroll-start="center center|top bottom">
  Desktop: center trigger, Mobile: top trigger
</div>
```

**Mobile Delay Override:**
```html
<!-- Use aa-delay-mobile to override delay on mobile only -->
<div aa-animate="slide-up" 
     aa-delay="0.8" 
     aa-delay-mobile="0.3">
  Desktop: 0.8s delay, Mobile: 0.3s delay
</div>

<!-- Disable delay on mobile -->
<div aa-animate="fade-up" 
     aa-delay="0.5" 
     aa-delay-mobile="0">
  Desktop: 0.5s delay, Mobile: no delay
</div>
```

### Performance Features

#### Lazy Loading Handler
```javascript
AlrdyAnimate.init({
  lazyLoadHandler: true // Optimizes images and ScrollTrigger
});
```

#### Resize Optimization
Automatic handling of window resize events for optimal performance.

#### Animation Cleanup
Automatic cleanup of animations and ScrollTriggers when elements are removed.

---

## Configuration Reference

### Initialization Options

```javascript
AlrdyAnimate.init({
  // Animation defaults
  duration: 1,              // Default animation duration (seconds)
  delay: 0,                 // Default animation delay (seconds)
  ease: "ease-in-out",      // Default easing function
  distance: 1,              // Distance multiplier for animations
  again: true,              // Remove 'in-view' when out of view
  
  // Scroll positioning
  scrollStart: "top 80%",   // Default scroll start position
  scrollEnd: "bottom 70%",  // Default scroll end position
  
  // Hover animations
  hoverDuration: 0.3,       // Hover animation duration
  hoverDelay: 0,            // Hover animation delay
  hoverEase: "power3.out",  // Hover easing function
  hoverDistance: 0.1,       // Hover distance multiplier
  
  // Feature enabling
  gsapFeatures: [],         // GSAP features to load
  modals: false,            // Enable modal system
  lazyLoadHandler: false,   // Enable lazy loading optimization
  debug: false,             // Show GSAP debug markers
  
  // Advanced options
  includeGSAP: false,       // Include GSAP in bundle vs use Webflow's
  initTimeout: 3000,        // Initialization timeout (ms)
  
  // Smooth scrolling
  smoothScroll: {
    enabled: false,
    options: {
      lerp: 0.12,
      wheelMultiplier: 1,
      touchMultiplier: 2,
      smoothWheel: true
    }
  },
  
  // Template system
  templates: {
    theme: null,            // Predefined theme name
    custom: {}              // Custom class animations
  }
});
```

### Common Attributes Reference

| Attribute | Values | Description |
|-----------|--------|-------------|
| `aa-animate` | Animation name | Primary animation type |
| `aa-duration` | Number (seconds) | Animation duration |
| `aa-delay` | Number (seconds) | Animation delay |
| `aa-delay-mobile` | Number (seconds) | Mobile-specific delay override |
| `aa-ease` | Easing function | Animation easing |
| `aa-distance` | Number | Distance multiplier |
| `aa-scroll-start` | ScrollTrigger position | When animation starts |
| `aa-scroll-end` | ScrollTrigger position | When animation ends (for scrub) |
| `aa-scrub` | `true` or Number | Scroll-driven animation |
| `aa-children` | Animation name | Apply animation to all children |
| `aa-stagger` | Number (seconds) | Stagger delay between children |
| `aa-anchor` | CSS selector | Element that triggers this animation |
| `aa-toggle-playstate` | - | Pause/play CSS animations based on visibility |

### Text-Specific Attributes

| Attribute | Values | Description |
|-----------|--------|-------------|
| `aa-split` | `words`, `chars`, `lines`, `lines&words` | Text splitting method |
| `aa-stagger` | Number (seconds) | Delay between split elements |

### Mobile/Desktop Variants
Many attributes support mobile/desktop variants using the `|` separator:

```html
<div aa-animate="fade-up|slide-up" 
     aa-duration="0.8|0.6" 
     aa-delay="0.2|0.1">
  Different animations for mobile vs desktop
</div>
```

---

## Performance & Accessibility

### Performance Best Practices

1. **Use CSS animations for simple effects** - Better performance than JavaScript
2. **Enable lazy loading** - `lazyLoadHandler: true` for image optimization
3. **Limit simultaneous animations** - Use staggering for multiple elements
4. **Optimize scroll triggers** - Use appropriate `aa-scroll-start` values
5. **Clean up on navigation** - Library handles this automatically

### Accessibility Features

1. **Reduced motion support** - Respects `prefers-reduced-motion`
2. **Keyboard navigation** - Full keyboard support for interactive components
3. **Screen reader friendly** - Proper ARIA attributes on components
4. **Focus management** - Maintains focus during animations
5. **Semantic HTML** - Works with any HTML structure

### Browser Support

- **Modern browsers**: Full feature support
- **IE11+**: Basic CSS animations only
- **Mobile**: Optimized for touch interactions
- **Progressive enhancement**: Graceful fallbacks

---

## Contributing

We welcome contributions! Please see our [Contributing Guide](CONTRIBUTING.md) for details.

### Development Setup
```bash
git clone https://github.com/ben-alrdy/alrdy-animate.git
cd alrdy-animate
npm install
npm run dev
```

### Testing
```bash
npm run test
npm run test:accessibility
npm run test:performance
```

---

## License

MIT License - see [LICENSE](LICENSE) file for details.


---

*Made with ❤️ by the Alrdy team*
