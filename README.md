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
    - [1.6 Glide](#16-glide)
    - [1.7 Section Background Color](#17-section-background-color)
    - [1.8 Section Clip](#18-section-clip)
    - [1.9 Section Stack](#19-section-stack)
    - [1.10 Pin (GSAP-Powered Sticky)](#110-pin-gsap-powered-sticky)
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
<!-- AlrdyAnimate CSS (preloaded for non-blocking load) -->
<link rel="preload" 
      href="https://unpkg.com/alrdy-animate@7.0.12/dist/AlrdyAnimate.css" 
      as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet" href="https://unpkg.com/alrdy-animate@7.0.12/dist/AlrdyAnimate.css">
</noscript>

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
<!-- AlrdyAnimate CSS (preloaded for non-blocking load) -->
<link rel="preload" 
      href="https://unpkg.com/alrdy-animate@7.0.12/dist/AlrdyAnimate.css" 
      as="style" 
      onload="this.onload=null;this.rel='stylesheet'">
<noscript>
  <link rel="stylesheet" href="https://unpkg.com/alrdy-animate@7.0.12/dist/AlrdyAnimate.css">
</noscript>

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
        gsapFeatures: ['text', 'slider', 'nav', 'accordion', 'parallax'],
        
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
        gsapFeatures: ['text', 'slider', 'nav', 'accordion', 'parallax'],
        
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
| `aa-opacity` | Number (0-1) | `1` | Final opacity value, use for `css`, `appear` and `reveal` animations |
| `aa-ease` | Easing function | `ease-in-out` | Animation easing |
| `aa-scroll-start` | Position | `top 80%` | When animation starts |
| `aa-anchor` | CSS selector | - | Trigger element |

**Examples:**
```html
<div aa-animate="fade-up" aa-duration="0.8" aa-delay="0.2">Basic fade up</div>
<div aa-animate="float-left" aa-distance="2" aa-ease="back.out">Stronger float</div>
<div aa-animate="zoom-in-up" aa-scroll-start="top 90%">Zoom with slide</div>
<div aa-animate="rotate-br-cw" aa-distance="3">Rotate from bottom-right</div>
<div aa-animate="fade-up" aa-opacity="0.8">Fade to 80% opacity</div>
```


---

### 1.2 Load Animations (CSS-Only)

Animations that trigger immediately when the page loads, without JavaScript initialization.

**Setup:** Use `aa-load` attribute (no `AlrdyAnimate.init()` required)

**Available Animations:** Similar to the above CSS animations, check the code file in Webflow

**Hybrid Mode:** Combine `aa-load` with `aa-animate` for automatic fallback (see [Hybrid Load Animations](#hybrid-load-animations-css-fallback--gsap-enhancement) in Advanced Features)

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
- **Fade**: `text-fade`, `text-fade-10`, `text-fade-30`  (opacity-only animations)
- **Scale**: `text-scale-up`
- **Blur**: `text-blur`, `text-blur-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
- **Rotate**: `text-rotate-soft` (3D rotation around X-axis)
- **Block**: `text-block-[direction]` where `[direction]` = `up`, `down`, `left`, `right`
  - Use `aa-color` to define block background and optional text color
  - Format: `aa-color="bg:#hex"` or `aa-color="bg:#hex text:#hex"`
- **Oval**: `text-oval-[direction]` where `[direction]` = `up`, `down`
  - Uses ellipse clip-path to reveal text line by line
  - Supports `aa-color` attribute for color transitions

**Color Transitions:**
All text animations support the `aa-color` attribute for smooth color transitions. Colors animate **from** the specified `aa-color` values **to** the original element colors.

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `text-[type]` | - | Text animation type |
| `aa-split` | `words`, `chars`, `lines`, `lines&words` | `words` | How to split text |
| `aa-stagger` | Number (seconds) | `0.05` | Delay between split elements |
| `aa-duration` | Number (seconds) | `0.8` | Animation duration |
| `aa-scrub` | empty or number | `true` | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |
| `aa-color` | `text:#hex bg:#hex border:#hex` | - | Color transitions (animates from these colors to original) |

**Examples:**
```html
<!-- Basic text animations -->
<h1 aa-animate="text-slide-up" aa-split="words" aa-stagger="0.05">Word by word</h1>
<p aa-animate="text-fade" aa-split="chars" aa-stagger="0.02">Character reveal</p>
<div aa-animate="text-tilt-up" aa-split="lines">Clipped lines</div>
<span aa-animate="text-blur-up" aa-split="words|random">Random order</span>

<!-- Text animations with color transitions -->
<h2 aa-animate="text-slide-up" aa-color="text:#ff0000" aa-split="words">
  Animates from red to original text color
</h2>
<p aa-animate="text-fade" aa-color="bg:#000000 text:#ffffff" aa-split="chars">
  Animates from black background and white text to original colors
</p>

<!-- Text block animations -->
<h2 aa-animate="text-block-left" aa-color="bg:#ff0000">Red block animation</h2>
<h2 aa-animate="text-block-up" aa-color="bg:#000000 text:#ffffff">
  Black block with white text
</h2>
```

---

### 1.4 Appear Animations

Smooth transitions and reveals with GSAP.

**Setup:** `gsapFeatures: ['section']`

**Available Animations:**
- **Appear**: `appear`, `appear-up/down/left/right`
- **Reveal**: `reveal-up/down/left/right/center` (clip path)
  - **Oval Reveal**: `reveal-oval-up/down/left/right` (ellipse clip path)
  - **Slices Reveal**: `reveal-slices-7`, `reveal-slices-up/down/left/right`, `reveal-slices-[direction]-[count]` (horizontal slices with staggered vertical reveal)
- **Counter**: `counter`, `counter-[startNumber]`
- **Grow**: `grow-horizontal`, `grow-vertical` (animates from 0 to auto size with optional color transitions)

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | Animation name | - | Animation type |
| `aa-duration` | Number (seconds) | `0.8` | Animation duration |
| `aa-delay` | Number (seconds) | `0` | Animation delay |
| `aa-distance` | Number | `1` | Distance multiplier (for slices: controls slice height variation) |
| `aa-stagger` | Number (seconds) | `0.02` | Stagger delay between slices (slices reveal only) |
| `aa-scrub` | empty or number | `true` | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |
| `aa-color` | `bg:#hex text:#hex border:#hex` | - | Color transitions for grow animation |

**Examples:**
```html
<div aa-animate="appear-left" aa-duration="1.2">Smooth appear</div>
<img aa-animate="reveal-center" aa-scrub="1" src="image.jpg">
<span aa-animate="counter">1,250</span>
<span aa-animate="counter-100" aa-scrub="2">500</span>

<!-- Slices reveal animations -->
<div aa-animate="reveal-slices" aa-stagger="0.05">5 slices (default)</div>
<div aa-animate="reveal-slices-up-7" aa-stagger="0.03">7 slices, up direction</div>
<div aa-animate="reveal-slices-down" aa-distance="2" aa-stagger="0.02">Variable slice heights</div>
<img aa-animate="reveal-slices-left-10" aa-stagger="0.04" src="image.jpg">

<!-- Grow animations -->
<div aa-animate="grow-horizontal" aa-duration="1">Grows width from 0 to auto</div>
<div aa-animate="grow-vertical" aa-duration="1.2">Grows height from 0 to auto</div>
<div aa-animate="grow-horizontal" aa-color="bg:#ff0000 text:#ffffff" aa-scrub="1">
  Grows with color transition
</div>
```

---

### 1.5 Parallax

Scroll-driven movement effects.

**Setup:** `gsapFeatures: ['parallax']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `parallax`, `parallax-horizontal` | - | Parallax type |
| `aa-parallax-target` | CSS selector | Self | Element to animate |
| `aa-parallax-start` | Number (%) | `10` | Start position |
| `aa-parallax-end` | Number (%) | `-10` | End position |
| `aa-scroll-start` | Position | `top bottom` | When to start |
| `aa-scroll-end` | Position | `bottom top` | When to end |
| `aa-scrub` | empty or number | `true` | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |

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

### 1.6 Glide

Velocity-based floating effect where elements lag behind scroll position and smoothly catch up, creating a staggered gliding appearance.

**Setup:** `gsapFeatures: ['parallax']`

**How It Works:**
- Elements drift in the opposite direction of scroll (scrolling down makes elements move up)
- Effect is continuous while element is in viewport
- Uses frame-based updates (60fps) for smooth damping and decay
- Automatically disabled on mobile (< 1080px) for better performance

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `glide` | - | Glide animation type |
| `aa-delay` | Number (0.85-0.95) | `0.9` | Damping factor - controls how quickly elements return to position. Lower = snappier (0.85), Higher = floatier (0.95) |
| `aa-distance` | Number | `1` | Float intensity multiplier - controls how far elements drift. Higher = more dramatic effect |

**Examples:**
```html
<!-- Basic glide with default settings -->
<div aa-animate="glide">
  Floats smoothly as you scroll
</div>

<!-- Light float, loose damping -->
<div aa-animate="glide" aa-distance="0.5" aa-delay="0.95">
  Subtle floating effect
</div>

<!-- Heavy float, snappy return -->
<div aa-animate="glide" aa-distance="1.5" aa-delay="0.85">
  Dramatic floating with quick return
</div>

<!-- Staggered glide on individual letters -->
<h1>
  <span aa-animate="glide" aa-distance="0.4">G</span>
  <span aa-animate="glide" aa-distance="0.6">l</span>
  <span aa-animate="glide" aa-distance="0.8">i</span>
  <span aa-animate="glide" aa-distance="1.0">d</span>
  <span aa-animate="glide" aa-distance="1.2">e</span>
</h1>
```

**Performance Notes:**
- Only runs when element is in viewport (automatic optimization)
- Uses GPU-accelerated transforms
- Frame-based updates for smooth 60fps performance
- Mobile devices automatically excluded for better performance

---

### 1.7 Section Background Color

Animated background transitions between sections.

**Setup:** `gsapFeatures: ['section']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `background` | - | Background transition |
| `aa-duration` | Number (seconds) | `0.8` | Transition duration |
| `aa-ease` | Easing function | `power2.inOut` | Transition easing |
| `aa-scrub` | empty or number | `true` | Scroll-driven animation. `true` = direct mapping, number = lag (higher = more lag) |
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

### 1.8 Section Clip

Clip path animations for sections.

**Setup:** `gsapFeatures: ['section']`

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

### 1.9 Section Stack

Stacking scroll effects.

**Setup:** `gsapFeatures: ['section']`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `stack` | - | Stack animation |
| `aa-distance` | Number | `1` | Stack distance |
| `aa-scrub` | empty or number | `true` | Scroll-driven |

**Examples:**
```html
<div aa-animate="stack" aa-distance="2">Stacking section</div>
```

---

### 1.10 Pin (GSAP-Powered Sticky)

Pin elements during scroll using GSAP's ScrollTrigger. This is **superior to CSS `position: sticky`** when working with ScrollTrigger animations because:
- ✅ ScrollTrigger is aware of pinned elements and adjusts calculations automatically
- ✅ Creates spacer elements to maintain document flow
- ✅ All ScrollTriggers coordinate seamlessly

**Setup:** `gsapFeatures: ['section']`

**Touch Device Support:** Pin and pin-stack animations are automatically disabled on touch devices for better user experience. This prevents disruption of native scrolling gestures and maintains smooth touch interactions.

#### Simple Pin

Pin a single element during scroll.

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `pin` | - | Pins element during scroll |
| `aa-pin-start` | ScrollTrigger position | `top 10%` | When pinning starts |
| `aa-pin-end` | ScrollTrigger position | `+=100%` | When pinning ends |

**Examples:**
```html
<!-- Pin at top of viewport -->
<section aa-animate="pin" aa-pin-start="top 5%" aa-pin-end="+=100%">
  <h2 aa-animate="fade-up">I stay pinned!</h2>
</section>

<!-- Pin for specific scroll distance -->
<div aa-animate="pin" aa-pin-start="top 10%" aa-pin-end="+=2000">
  <h3>Pinned for 2000px of scroll</h3>
</div>
```

#### Pin Stack - Card Reveal Animations

Create stunning card reveal effects where cards slide up and stack on top of each other. Separate control over "in" animations (how cards appear) and "out" animations (how cards react when covered).

**How It Works:**
1. Parent element gets pinned and becomes a grid container
2. Children are positioned to overlap using `grid-area`
3. Each child animates from below into stacked position
4. Gap from CSS `row-gap` is automatically respected

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-animate` | `pin-stack` | - | Enables pin-stack animation |
| `aa-pin-in` | `fade`, `scale`, `rotate`, or `null` | `null` (simple slide) | How cards appear from below |
| `aa-pin-out` | `perspective`, `scale`, `fade`, `blur`, or `null` | `null` (no effect) | How cards react when next card appears |
| `aa-pin-trigger-animation` | `0.5` | `0.7` | Percentage of viewport when aa-animate animations inside a pinned child are triggered |
| `aa-pin-start` | ScrollTrigger position | `top 10%` | When animation starts |
| `aa-pin-end` | ScrollTrigger position | `+=100%` | When animation ends |

**In-Animation Types:**
- `null` (default) - Simple slide up with no extra effects
- `fade` - Cards fade in (opacity 0 → 1) as they slide up
- `scale` - Cards scale up (0.8 → 1.0) as they appear
- `rotate` - Cards rotate (±15°) as they slide up (alternating direction)

**Out-Animation Types:**
- `null` (default) - Cards stay in final position
- `perspective` - Cards tilt back and scale down when next card appears
- `scale` - Cards scale down when next card appears
- `fade` - Cards fades out when next card appears
- `fade-scale` - Cards fades out and scales down when next card appears
- `blur` - Cards blur when next card appears
- `right` or `right` - Cards move out left/right

**Examples:**

```html
<!-- Simple stack (no in/out animations) -->
<div aa-animate="pin-stack" aa-pin-start="top 5%" aa-pin-end="+=1000">
  <div class="card">
    <h2 aa-animate="fade-up" aa-delay="0.1">Card 1 Title</h2>
    <p aa-animate="fade" aa-delay="0.2">Card 1 content</p>
  </div>
  <div class="card">
    <h2 aa-animate="fade-up" aa-delay="0.1">Card 2 Title</h2>
    <p aa-animate="fade" aa-delay="0.2">Card 2 content</p>
  </div>
  <div class="card">
    <h2 aa-animate="fade-up" aa-delay="0.1">Card 3 Title</h2>
    <p aa-animate="fade" aa-delay="0.2">Card 3 content</p>
  </div>
</div>

<!-- Combined: Fade in + Perspective out -->
<div aa-animate="pin-stack" aa-pin-in="fade" aa-pin-out="perspective" aa-pin-start="top 5%" aa-pin-end="+=1000">
  <div class="card">Card 1</div>
  <div class="card">Card 2</div>
  <div class="card">Card 3</div>
</div>

```

**Styling Tips:**
```css
/* Parent wrapper - use grid with gap for initial spacing */
.pin-stack-wrapper {
  display: grid;
  gap: 2rem; /* Gap is preserved in animation */
}

/* Cards */
.card {
  height: 90vh; /* Or any height you want */
  border-radius: 1rem;
  padding: 2rem;
}
```

**Important Notes:**
- Parent is automatically converted to `display: grid` during animation
- Children are positioned using `grid-area: 1 / 1 / 2 / 2` to overlap
- Initial `row-gap` from CSS is respected in animation calculations
- Use `aa-scroll-end` with sufficient distance (e.g., `+=1000` or `+=100%`) for smooth reveals
- Out-animations are NOT applied to the last card (it has no card appearing after it)
- You can mix and match any in-animation with any out-animation
- Inner animations are automatically triggered when cards become active
- Important: `aa-children` animations inside a child won't work

---

## 2. Hover Animations

Interactive hover effects with sophisticated animations and state management. Add `aa-hover` to an element to get started.

**Setup:** `gsapFeatures: ['hover']`

### Animation Types & Element Tags

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
- **Block**: `bg-block` - Slides a rectangular div in/out based on mouse direction
  - **Direction Control**: Include direction in animation name (e.g., `bg-block-vertical`, `bg-block-horizontal`)
  - **Options**: `all` (default), `vertical`, `horizontal`, `top`, `bottom`, `left`, `right`
  - The bg div element needs to be positioned absolutely, cover fully and have the proper z-index; you can set it to visibility:hidden in webflow.
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

Add color changes to any hover animation using the unified `aa-color` attribute on child elements.

**Unified Color Attribute:**
- `aa-color="text:#hex"` - Changes text color on hover
- `aa-color="bg:#hex"` - Changes background color on hover
- `aa-color="bg:#hex text:#hex"` - Changes multiple properties
- `aa-color="bg:#hex text:#hex border:#hex"` - All three properties

**How it works:**
- Apply `aa-color` to child elements within the hover container
- Only properties defined in `aa-color` will be animated
- Original colors are automatically stored and restored on mouse leave

### Attributes & Defaults

| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-hover` | Animation type(s) | - | Hover animation(s), combine with `&` |
| `aa-duration` | Number (seconds) | `0.3` | Animation duration |
| `aa-delay` | Number (seconds) | `0` | Animation delay |
| `aa-split` | `words`, `chars`, `lines` | `words` | Text splitting method |
| `aa-stagger` | Number (seconds) | `0.03` | Stagger between text elements |
| `aa-distance` | Number (seconds) | `0.1` | Delay between original and clone text |
| `aa-color` | `text:#hex bg:#hex border:#hex` | - | Color changes on hover (on child elements) |

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

#### Block Background Animation
```html
<a aa-hover="bg-block-horizontal" aa-duration="0.5">
  <span aa-hover-content>Sliding Block</span>
  <div aa-hover-bg class="absolute inset-0 bg-blue-500"></div>
</a>

<a aa-hover="bg-block-vertical" aa-duration="0.5">
  <span aa-hover-content>Vertical Block</span>
  <div aa-hover-bg class="absolute inset-0 bg-blue-500"></div>
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
    <span aa-hover-text aa-color="text:#ffffff">
      Multi-Effect Button
    </span>
    <svg aa-hover-icon class="w-4 h-4">
      <path d="M5 12h14m-7-7l7 7-7 7"/>
    </svg>
  </span>
  <div aa-hover-bg aa-color="bg:#000000" 
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
- `loop` - Creates continuous looping animation
- `autoplay` - Enables autoplay with snapping between slides (legacy term: `snap`)
- `hover` - Pauses autoplay on hover (only works with `autoplay` type)
- `draggable` - Enables drag/swipe functionality
- `center` - Centers the active slide
- `reverse` - Reverses the animation direction
- `vertical` - Creates vertical slider instead of horizontal
- `none` - Useful in combination with the `|` separator for responsive deactivation, e.g. `aa-slider=none|draggable-center`

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-slider` | Slider type | - | Slider animation type |
| `aa-duration` | Number (seconds) | `20` (loop), `0.8` (autoplay) | Speed/duration |
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

**Active Classes:**
The slider automatically adds/removes the following classes:
- **Slider items**: `is-active` class is added to the currently visible slide
- **Navigation buttons**: `is-active` class is added to the corresponding pagination button
- **ARIA attributes**: `aria-hidden="false"` for active slide, `aria-selected="true"` for active button

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

/* Style active states */
.slider-item.is-active .slider-item-content {
  border-color: #007bff;
  box-shadow: 0 4px 12px rgba(0, 123, 255, 0.15);
}

.slider-button.is-active {
  background-color: #007bff;
  color: white;
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

<!-- Autoplay slider with progress -->
<div aa-slider="autoplay" aa-duration="0.6" aa-delay="4">
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

**Note:** Opening/closing is animated via CSS transition of the grid `fr` unit, while inner content animations are handled by GSAP using event-based triggering.

#### Component Structure

**Main Component Attributes:**
- `aa-accordion` - Basic accordion (only one open at a time)
- `aa-accordion="single"` - Basic accordion (only one open at a time + open one cannot be closed)
- `aa-accordion="multi"` - Multi accordion (multiple can be open)
- `aa-accordion="autoplay"` - Autoplay accordion with progress indicators
  - Add `aa-duration` to define how long one autoplay cycle takes
  - Optionally add `aa-accordion-progress` to another element to visualize the progress; accepts values `width`, `height`, `circle`
- `aa-accordion="scroll"` - Scroll-driven sticky accordion
  - Accordion becomes pinned when scrolled into view
  - Opens accordions sequentially as user scrolls
  - Progress bars fill based on scroll position
  - Toggle elements are not clickable (controlled by scroll only)
  - Use `aa-distance` to define scroll distance per accordion in viewport height units (default: 100, meaning 100vh)
  - Use `aa-scroll-start` to control when pinning starts (default: "top 20%")
  - Use `aa-scrub` to control scroll scrubbing behavior (default: true; add number to set scrubbing delay)
  - Use `aa-accordion-initial` on the first accordion to have it open before reaching the trigger

**Element Attributes:**
- `aa-accordion-toggle=ID` - Marks the clickable toggle element (ID optional - auto-generated if not provided)
- `aa-accordion-content=ID` - Marks the expandable content element (ID optional - auto-generated if not provided)
- `aa-accordion-visual=ID` - Marks connected visual content element (ID optional - auto-generated if not provided)
- `aa-accordion-wrapper` - Optional wrapper for toggle and content (enables simplified styling)
- `aa-accordion-initial` - On load, activates this toggle, opens content, shows visual

**Auto-Generated IDs:**
When no IDs are provided, the accordion system automatically assigns sequential IDs:
- First toggle/content pair: `accordion-0`
- Second toggle/content pair: `accordion-1`
- Third toggle/content pair: `accordion-2`
- And so on...

Manual IDs take precedence over auto-generated ones.

#### Inner Animations

**Simplified Approach:** All inner animations now use the standard `aa-animate` attribute with event-based triggering. The system automatically detects and triggers animations when accordions open/close.

**Available Animations:**
- **All Scroll Animations**: Fade, slide, scale, appear, reveal, grow, counter, text animations

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-accordion` | Accordion type | - | Accordion behavior |
| `aa-duration` | Number (seconds) | `5` (autoplay) | Duration for autoplay |
| `aa-distance` | Number (vh units) | `30` (scroll) | Scroll distance per accordion (scroll accordion only) |
| `aa-ease` | Easing function | `power4.out` | Animation easing |
| `aa-delay` | Number (seconds) | `0.3` | Delay before inner animations |
| `aa-scroll-start` | Position | `top 20%` (scroll) | When pinning starts (scroll accordion) |
| `aa-accordion-toggle` | ID | - | Toggle element |
| `aa-accordion-content` | ID | - | Content element |
| `aa-accordion-visual` | ID | - | Connected visual |
| `aa-accordion-initial` | - | - | Initially open |
| `aa-accordion-progress` | `width`, `height`, `circle` | - | Progress type |

**Examples:**

#### Basic Accordion
```html
<div aa-accordion>
  <div aa-accordion-toggle="item-1" aa-accordion-initial>
    <h3>Accordion Item 1</h3>
  </div>
  <div aa-accordion-content="item-1" aa-animate aa-duration="0.5" aa-ease="power2.inOut">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-animate="fade-up" aa-delay="0.1">
          <p>Content for item 1</p>
        </div>
        <div aa-animate="text-slide-up" aa-split="words" aa-stagger="0.05" aa-delay="0.2">
          <p>More content with text animation</p>
        </div>
      </div>
    </div>
  </div>
  
  <div aa-accordion-toggle="item-2">
    <h3>Accordion Item 2</h3>
  </div>
  <div aa-accordion-content="item-2" aa-animate aa-duration="0.5" aa-ease="power2.inOut">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-animate="appear-up" aa-delay="0.1">
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
        <div aa-animate="fade-up" aa-delay="0.1">
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
  <div aa-accordion-content="visual-1" aa-animate aa-duration="0.5" aa-ease="power2.inOut">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-animate="fade-up" aa-delay="0.1">
          <p>This controls the visual on the right</p>
        </div>
      </div>
    </div>
  </div>
  
  <!-- Connected visual elements -->
  <div class="visual-container">
    <div aa-accordion-visual="visual-1" aa-animate="fade-left" aa-duration="0.4" aa-delay="0.2">
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
  <div aa-accordion-content="circle-1" aa-animate aa-duration="0.5" aa-ease="power2.inOut">
    <div class="content-inner">
      <div class="content-wrapper">
        <div aa-animate="text-slide-up" aa-split="words" aa-stagger="0.05" aa-delay="0.1">
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

#### Optional Wrapper Pattern

For simplified styling and state management (especially useful for FAQ-style accordions with hover states), wrap toggle and content in an `aa-accordion-wrapper` element:

```html
<div aa-accordion>
  <div aa-accordion-wrapper class="accordion-item">
    <div aa-accordion-toggle>
      <h3>Question 1</h3>
    </div>
    <div aa-accordion-content aa-animate aa-duration="0.6">
      <div class="content-inner">
        <div class="content-wrapper">
          <p>Answer 1</p>
        </div>
      </div>
    </div>
  </div>
  
  <div aa-accordion-wrapper class="accordion-item">
    <div aa-accordion-toggle>
      <h3>Question 2</h3>
    </div>
    <div aa-accordion-content aa-animate aa-duration="0.6">
      <div class="content-inner">
        <div class="content-wrapper">
          <p>Answer 2</p>
        </div>
      </div>
    </div>
  </div>
</div>
```

**Benefits:**
- Status attribute applied to wrapper instead of individual elements
- Simplified hover state styling (hover entire item, not just toggle)
- Cleaner CSS targeting for active/inactive states
- Fully backwards compatible - use only when needed

#### CSS Targeting

Use status attributes for styling:
```css
/* Standard approach */
[aa-accordion-toggle][aa-accordion-status="active"] {
  /* Active toggle styles */
}

/* With wrapper pattern */
[aa-accordion-wrapper][aa-accordion-status="active"] {
  /* Active wrapper styles */
}

[aa-accordion-wrapper]:hover {
  /* Hover entire accordion item */
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
| `aa-scrub` | empty or number | - | Scroll-driven (for paused) |

**CSS Requirements:**
- Container with `aa-marquee-items` needs `display: flex`
- **Important**: Use `margin-right` (or `margin-left`) on items for spacing, NOT `gap`
- Items should not have `flex-shrink: 0` (unlike sliders)

```css
[aa-marquee-items] {
  display: flex;
  /* Do NOT use gap - use margin on items instead */
}

[aa-marquee-items] .item {
  margin-right: 2rem; /* Use margin for spacing */
  /* Do NOT use flex-shrink: 0 */
}
```

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

**Setup:** `gsapFeatures: ['modal']` 

#### Basic Structure

- **Trigger**: Use `aa-modal-target="unique-modal-name"` on any element that should open a modal
- **Modal Container**: Wrap all modals in a container with `aa-modal-group` (add unique identifier for multiple groups)
- **Modal Element**: Each modal needs a unique `aa-modal-name="unique-modal-name"` attribute  
- **Close Elements**: Any element with `aa-modal-close` will close the modal when clicked (buttons, backdrop, etc.)
- **Scrollable Content**: Apply `data-lenis-prevent` to content areas that need independent scrolling

#### Inner Animations

**Simplified Approach:** All inner animations now use the standard `aa-animate` attribute with event-based triggering. The system automatically detects and triggers animations when modals open/close.

**Available Animations:**
- **All Scroll Animations**: Fade, slide, scale, appear, reveal, grow, counter, text animations


**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-modal-group` | Optional ID | - | Modal container (for multiple groups) |
| `aa-modal-target` | Modal name | - | Opens specified modal |
| `aa-modal-name` | Unique name | - | Modal identifier |
| `aa-modal-close` | - | - | Closes modal when clicked |
| `aa-duration` | Number (seconds) | `0.5` | Animation duration |
| `aa-ease` | Easing function | `power2.out` | Animation easing |

**Examples:**
```html
<!-- Trigger -->
<button aa-modal-target="example-modal">Open Modal</button>

<!-- Modal system -->
<div aa-modal-group>
  <div aa-modal-name="example-modal" class="modal" aa-animate aa-duration="0.6" aa-ease="power2.out">
    <!-- Backdrop closes modal -->
    <div class="modal-backdrop" aa-modal-close></div>
    
    <!-- Content with independent scrolling -->
    <div class="modal-content" data-lenis-prevent>
      <button aa-modal-close class="close-btn">×</button>
      
      <!-- Animated content -->
      <h2 aa-animate="fade-up" aa-delay="0.1">Modal Title</h2>
      <p aa-animate="fade" aa-delay="0.2">Modal content with animations</p>
      <div aa-animate="zoom-in" aa-delay="0.3">
        <img src="image.jpg" alt="Modal image">
      </div>
      
      <!-- Text animation -->
      <p aa-animate="text-slide-up" aa-split="words" aa-stagger="0.05" aa-delay="0.4">
        Text with word-by-word animation
      </p>
    </div>
  </div>
</div>

<!-- Multiple modal groups -->
<div aa-modal-group="gallery">
  <div aa-modal-name="image-1" class="modal" aa-animate aa-duration="0.6" aa-ease="power2.out">
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

Scroll-responsive navigation with animations and dynamic styling.

**Setup:** `gsapFeatures: ['nav']`

#### Nav Hide/Show & Class Change

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

#### Nav Section Classes

Add dynamic classes to your navigation based on which section is currently positioned behind it. Perfect for changing nav colors based on section backgrounds.

**Attributes & Defaults:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-nav-section` | Class name | - | Class to add to nav when section is behind it |
| `aa-scroll-start` | ScrollTrigger position | `top 0%` | When to add the class |
| `aa-scroll-end` | ScrollTrigger position | `bottom 0%` | When to remove the class |

**How It Works:**
- Only one section class is active at a time
- Previous section class is automatically removed before adding new one
- Supports both percentage (`5%`) and rem units (`5rem`) in scroll positions
- Works independently from `is-scrolled` and `is-current` classes

**Examples:**
```html
<!-- Fixed navigation -->
<nav aa-nav="hide" style="position: fixed;">
  <div class="nav-content">Navigation</div>
</nav>

<!-- Sections with nav classes -->
<section aa-nav-section="nav-dark" 
         aa-scroll-start="top 5%" 
         aa-scroll-end="bottom 2.5%">
  Light background section - adds 'nav-dark' class to nav
</section>

<section aa-nav-section="nav-light" 
         aa-scroll-start="top 5%" 
         aa-scroll-end="bottom 2.5%">
  Dark background section - adds 'nav-light' class to nav
</section>

<section aa-nav-section="nav-accent" 
         aa-scroll-start="top 10%" 
         aa-scroll-end="bottom 5%">
  Colored section - adds 'nav-accent' class to nav
</section>
```

**CSS Styling:**
```css
/* Default nav state */
nav {
  background-color: transparent;
  color: #000;
  transition: background-color 0.3s ease, color 0.3s ease;
}

/* Nav states based on sections */
nav.nav-dark {
  background-color: rgba(255, 255, 255, 0.95);
  color: #000;
}

nav.nav-light {
  background-color: rgba(0, 0, 0, 0.95);
  color: #fff;
}

nav.nav-accent {
  background-color: rgba(59, 130, 246, 0.95);
  color: #fff;
}
```

#### Nav Indicators (Current + Hover)

Animated indicators that track the active navigation item and follow hover interactions using GSAP's FLIP plugin. Perfect for creating sophisticated navigation highlighting effects.

**How It Works:**
- **Current Indicator**: Automatically follows the `.is-current` class on navigation items
- **Hover Indicator**: Follows mouse hover, returns to current indicator when mouse leaves nav
- **FLIP Animation**: Smoothly animates position and size between nav items without distortion

**Attributes & Defaults:**
| Attribute | Element | Default | Description |
|-----------|---------|---------|-------------|
| `aa-nav-current-indicator` | Indicator element | - | Tracks active navigation item |
| `aa-nav-hover-indicator` | Indicator element | - | Follows hover on nav items |
| `aa-duration` | Indicator element | `0.4` | Animation duration |
| `aa-ease` | Indicator element | `power2.out` | Animation easing |
| `aa-scroll-target` | Nav links | - | Required on nav items for tracking |

**Examples:**
```html
<!-- Navigation with both indicators -->
<nav aa-nav="hide">
  <ul class="nav-links">
    <a href="#section-1" aa-scroll-target="#section-1">Section 1</a>
    <a href="#section-2" aa-scroll-target="#section-2">Section 2</a>
    <a href="#section-3" aa-scroll-target="#section-3">Section 3</a>
    
    <!-- Current indicator (darker) -->
    <div aa-nav-current-indicator aa-duration="0.4" aa-ease="power2.out"></div>
    
    <!-- Hover indicator (lighter) -->
    <div aa-nav-hover-indicator aa-duration="0.25" aa-ease="power2.out"></div>
  </ul>
</nav>
```

**CSS Requirements:**
```css

/* Current indicator (darker, tracks active section) */
[aa-nav-current-indicator] {
  position: absolute;
  background: rgba(0, 0, 0, 0.15);
  border-radius: 0.5rem;
  pointer-events: none;
  z-index: 1;
  opacity: 0; /* Hidden until initialized */
}

/* Hover indicator (lighter, follows mouse) */
[aa-nav-hover-indicator] {
  position: absolute;
  background: rgba(0, 0, 0, 0.08);
  border-radius: 0.5rem;
  pointer-events: none;
  z-index: 0;
  opacity: 0; /* Hidden until initialized */
}
```

---

## Advanced Features

### Hybrid Load Animations (CSS Fallback + GSAP Enhancement)

Combine `aa-load` (CSS) with `aa-animate` (GSAP) for above the fold loading animations. If page load speed is too slow, animations will fallback to CSS.

**How to Use:**
```html

<div aa-load="fade-up" aa-animate="text-slide-up-lines" aa-split="chars" aa-duration="0.8">
  Enhanced content with fallback
</div>

```

**How It Works:**
  - Hybrid element hidden initially (prevents FOUC)
  - If JS loads within grace period (< 0.35s): GSAP animation plays
  - Otherwise CSS animation plays as fallback after CSS load delay variable
  - **Prevents double animation** - only one system animates per element

**Configuration:**


```css
/* In your custom CSS or Webflow's custom code */
:root {
  --load-base-delay: 0.4s; /* adjust based on your JS load time */
}
```

```javascript
AlrdyAnimate.init({
  loadGracePeriod: 0.35, // Should be slightly earlier than the --load-base-delay
  gsapFeatures: ['appear', 'text'],
  // ... other options
});
```

**Recommendations:**
- Use pure `aa-load` for critical above-the-fold content (hero, headlines, CTAs)
- Use hybrid for below-the-fold content where you want GSAP features with CSS fallback
- Match animation styles (e.g., `aa-load="fade-up"` with `aa-animate="appear-up"`)
- Test with throttled network (DevTools → Slow 3G) to verify fallback behavior

**Performance Notes:**
- **Pure `aa-load`**: 0ms to animate - no hiding, no waiting for JS
- **Hybrid elements**: Hidden until JS ready or grace period expires
- **Body attributes**: `aa-js-ready` (JS loaded), `aa-load-grace-expired` (CSS owns hybrid elements)

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

### Custom Form Submit Buttons

Replace default Webflow form submit buttons with custom styled buttons while maintaining form functionality. The custom logic only works if form data is sent to a 3rd party.

**Setup:** Automatically enabled with AlrdyAnimate initialization

**Available Attributes:**
| Attribute | Values | Default | Description |
|-----------|--------|---------|-------------|
| `aa-submit-button` | - | - | Enables custom submit button |
| `aa-submit-loading-duration` | Number (seconds) | `0.3` | How long to show loading state |
| `aa-submit-success-duration` | Number (seconds) | `1.2` | How long to show success state |
| `aa-submit-error-duration` | Number (seconds) | `1.2` | How long to show error state |
| `aa-submit-logic` | `default`, `custom` | `default` | How to handle form states and messages |
| `aa-submit-debug` | - | - | Enable detailed console logging for debugging |

**CSS Classes Applied:**
- **Button**: `is-loading`, `is-success`, `is-error`
- **Form Wrapper (.w-form)**: `is-loading`, `is-success`, `is-error`
- **Success Message (.w-form-done)**: `is-success`
- **Error Message (.w-form-fail)**: `is-error`

**Simple Example:**
```html
<div class="w-form">
  <form data-name="Contact Form">
    <input type="text" name="name" placeholder="Your Name" required>
    <input type="email" name="email" placeholder="Your Email" required>
    
    <!-- Custom submit button -->
    <button aa-submit-button>Submit</button>
  </form>
  
  <div class="w-form-done" style="display: none;">
    <div>Thank you! Your submission has been received!</div>
  </div>
  <div class="w-form-fail" style="display: none;">
    <div>Oops! Something went wrong while submitting the form.</div>
  </div>
</div>
```

**Advanced Example with Animated Loading States:**
```html
<!-- Button with smooth transitions and loading spinner -->
<button aa-submit-button 
        aa-submit-logic="custom"
        aa-submit-loading-duration="0.5"
        aa-submit-success-duration="2"
        aa-submit-error-duration="1.5"
        class="animated-submit-button">
  <span class="button-text">Send Message</span>
  <span class="button-loading">
    <span class="spinner"></span>
    Sending...
  </span>
  <span class="button-success">✓ Message Sent!</span>
  <span class="button-error">✗ Send Failed</span>
</button>
```

**CSS for Advanced Animated Button States:**
```css
.animated-submit-button {
  position: relative;
  overflow: hidden;
  transition: all 0.3s ease;
  min-width: 140px; /* Prevent button width changes */
}

.animated-submit-button > span {
  display: inline-block;
  transition: all 0.3s ease;
}

/* Default state - show only button text */
.animated-submit-button .button-text {
  opacity: 1;
  transform: translateY(0);
}

.animated-submit-button .button-loading,
.animated-submit-button .button-success,
.animated-submit-button .button-error {
  position: absolute;
  left: 50%;
  transform: translateX(-50%) translateY(100%);
  opacity: 0;
  white-space: nowrap;
}

/* Loading spinner */
.spinner {
  display: inline-block;
  width: 16px;
  height: 16px;
  border: 2px solid transparent;
  border-top: 2px solid currentColor;
  border-radius: 50%;
  animation: spin 1s linear infinite;
  margin-right: 8px;
  vertical-align: middle;
}

@keyframes spin {
  0% { transform: rotate(0deg); }
  100% { transform: rotate(360deg); }
}

/* Loading state - fade out text, fade in loading */
.animated-submit-button.is-loading {
  cursor: not-allowed;
}

.animated-submit-button.is-loading .button-text {
  opacity: 0;
  transform: translateY(-100%);
}

.animated-submit-button.is-loading .button-loading {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

.animated-submit-button.is-loading .button-success,
.animated-submit-button.is-loading .button-error {
  opacity: 0;
  transform: translateX(-50%) translateY(100%);
}

/* Success state - fade out loading, fade in success */
.animated-submit-button.is-success {
  background-color: #28a745;
  color: white;
}

.animated-submit-button.is-success .button-text,
.animated-submit-button.is-success .button-loading {
  opacity: 0;
  transform: translateY(-100%);
}

.animated-submit-button.is-success .button-success {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}

/* Error state - fade out loading, fade in error */
.animated-submit-button.is-error {
  background-color: #dc3545;
  color: white;
}

.animated-submit-button.is-error .button-text,
.animated-submit-button.is-error .button-loading {
  opacity: 0;
  transform: translateY(-100%);
}

.animated-submit-button.is-error .button-error {
  opacity: 1;
  transform: translateX(-50%) translateY(0);
}
```

**Features:**
- **Element Support**: Works with both `<button>` and `<a>` elements
- **Method Support**: Handles both GET and POST form methods
- **Accessibility**: Full keyboard support and ARIA attributes
- **Webflow Integration**: Automatic success/error message handling
- **Loading States**: Visual feedback during form submission
- **Progressive Enhancement**: Graceful fallback if JavaScript fails

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

### Image Lazy Loading Without JavaScript

For optimal performance and to prevent layout shifts with lazy-loaded images, use this CSS-only approach instead of relying on JavaScript handlers.

**The Problem:**
Lazy-loaded images can cause ScrollTrigger calculations to be incorrect because images load after ScrollTrigger initializes, changing layout heights.

**The Solution:**
Reserve space for images using `aspect-ratio` on the image element itself, combined with proper sizing constraints.

**HTML Structure:**
```html
<div class="grid-container">
  <div class="grid-column-text">
    <h2>Your heading</h2>
    <p>Your text content</p>
  </div>
  <div class="grid-column-image">
    <div class="image-wrapper">
      <img src="image.jpg" loading="lazy" alt="Description">
    </div>
  </div>
</div>
```

**CSS Setup:**
```css
/* Grid Container */
.grid-container {
  display: grid;
  grid-template-columns: 1fr 1fr;
  gap: 2rem;
  align-items: start; /* Important: prevents stretching */
}

/* Image Wrapper */
.image-wrapper {
  width: 100%;
  /* No aspect-ratio here */
}

/* Image - THIS IS THE KEY */
.image-wrapper img {
  width: 100%;
  max-width: 20rem; /* Use rem units - set to your image's actual width */
  aspect-ratio: 16 / 9; /* Set to your image's actual ratio */
  display: block;
  object-fit: contain; /* Maintains aspect ratio without cropping */
}
```

**Why This Works:**
1. **aspect-ratio on img**: Reserves space before the image loads, preventing layout shift
2. **max-width in rem**: Prevents over-scaling beyond native resolution (respects your rem scaling)
3. **object-fit: contain**: Ensures the entire image is visible without cropping
4. **No JavaScript needed**: Pure CSS solution that works instantly


### Performance Features

#### Lazy Loading Handler
```javascript
AlrdyAnimate.init({
  lazyLoadHandler: true // Optimizes images and ScrollTrigger
});
```

**Note:** If you follow the CSS-only image lazy loading approach above, you can set this to `false` for better performance.

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
  
  // Reduced motion settings
  reducedMotionDuration: 0.3, // Duration for reduced motion animations
  reducedMotionEase: "ease",  // Easing for reduced motion animations
  
  // Feature enabling
  gsapFeatures: [],         // GSAP features to load
  modals: false,            // Enable modal system
  lazyLoadHandler: false,   // Enable lazy loading optimization
  debug: false,             // Show GSAP debug markers
  
  // Advanced options
  includeGSAP: false,       // Include GSAP in bundle vs use Webflow's
  initTimeout: 3,            // Initialization timeout (seconds), shows all elements after this time
  loadGracePeriod: 0.35,     // Grace period for hybrid aa-load + aa-animate (seconds)
  
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
| `aa-scrub` | `empty or Number | Scroll-driven animation |
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

### Performance Optimization for Production

#### Bundled GSAP for Faster Loading

By default, AlrdyAnimate uses Webflow's included GSAP library (`includeGSAP: false`). However, for optimal performance and control over chunk loading, you can bundle GSAP with AlrdyAnimate:

```javascript
AlrdyAnimate.init({
  includeGSAP: true,  // Bundle GSAP with AlrdyAnimate
  gsapFeatures: ['text', 'slider', 'accordion', 'nav', 'parallax']
});
```

**Benefits of `includeGSAP: true`:**
- **Parallel chunk loading**: Features load simultaneously instead of sequentially (~150-200ms faster)
- **Optimized chunk splitting**: Better caching and load performance
- **Version control**: Ensures GSAP version compatibility
- **Resource hints support**: Enable modulepreload for even faster loading

#### Modulepreload Hints for Critical Chunks

For performance-critical landing pages, you can use modulepreload hints to start downloading GSAP chunks earlier:

**Step 1: Generate preload hints**
```bash
npm run build:hints
```

This creates `dist/preload-hints.html` with modulepreload tags for your current build.

**Step 2: Add hints to your HTML**
```html
<head>
  <!-- Preload critical chunks BEFORE main script -->
  <link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/alrdy-animate@7.0.18/dist/chunks/gsap-core.xxx.js">
  <link rel="modulepreload" href="https://cdn.jsdelivr.net/npm/alrdy-animate@7.0.18/dist/chunks/gsap-text.xxx.js">
  
  <!-- Main script -->
  <script src="https://cdn.jsdelivr.net/npm/alrdy-animate@7.0.18/dist/AlrdyAnimate.js"></script>
</head>
```

**Performance Impact:**
- Reduces JavaScript critical path by 50-100ms
- Improves Largest Contentful Paint (LCP)
- Benefits first-time visitors most
- Must be updated when upgrading AlrdyAnimate versions

**When to use modulepreload hints:**
- Performance-critical landing pages
- Pages with above-the-fold animations
- Sites targeting high Lighthouse scores
- When every millisecond counts for conversions

**When to skip them:**
- Animations are below the fold
- Using Webflow's GSAP (`includeGSAP: false`)
- Frequent version updates (maintenance overhead)
- Development/staging environments

### Accessibility Features

1. **Reduced motion support** - Automatically detects and respects `prefers-reduced-motion: reduce`
   - Replaces animations with simple fade effects
   - Preserves section animations: background, clip, stack
   - Interactive components (sliders, accordions) continue to work normally
   - Disables template system for consistent behavior
   - Configurable duration and easing via `reducedMotionDuration` and `reducedMotionEase` options
   - Test by enabling reduced motion in your system settings (macOS: System Preferences → Accessibility → Display → Reduce motion)
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
