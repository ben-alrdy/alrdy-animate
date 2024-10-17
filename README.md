# AlrdyAnimate Library

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#examples)

## Overview

AlrdyAnimate is a lightweight JavaScript library for adding scroll-triggered animations to your web pages. It provides easy-to-use options for customizing animation behavior and supports IntersectionObserver for efficient performance. With version 2.0.0, it now includes optional GSAP integration for more powerful animations.

## Installation

You can include AlrdyAnimate in your project by using a CDN or by bundling it with your build process.

### Using CDN

```html
<!-- Include the AlrdyAnimate CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v2.0.0/AlrdyAnimate.css">

<!-- Include the AlrdyAnimate JS -->
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v2.0.0/AlrdyAnimate.js"></script>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    AlrdyAnimate.init({
      easing: 'ease-in-out',
      again: false,
      viewportPercentage: 0.6,
      duration: '2s',
      delay: '0.5s',
      useGSAP: true  // Enable GSAP animations
    });
  });
</script>
```

### Using NPM

Install the package:

```bash
npm install alrdy-animate
```

Include it in your JavaScript file:

```javascript
import { AlrdyAnimate } from 'alrdy-animate';
import 'alrdy-animate/dist/AlrdyAnimate.css';

document.addEventListener('DOMContentLoaded', () => {
  AlrdyAnimate.init({
    easing: 'ease-in-out',
    again: false,
    viewportPercentage: 0.6,
    duration: '2s',
    delay: '0.5s',
    useGSAP: true  // Enable GSAP animations
  });
});
```

## Usage

### HTML

To use AlrdyAnimate, add the `aa-animate` or `aa-transition` attribute to the elements you want to animate. You can also add optional attributes to customize the animation for individual elements.

```html
<div aa-animate="fade-up" aa-duration="1.5s" aa-delay="0.3s" aa-split="words" aa-stagger="0.05">Your content here</div>
```

### JavaScript

Initialize the library with your desired options:

```javascript
AlrdyAnimate.init({
  easing: 'ease-in-out',      // Default easing function
  again: false,               // Do not remove 'in-view' class when out of view
  viewportPercentage: 0.6,    // Trigger animation when 60% of the element is in view
  duration: 2,                // Default animation duration, in seconds, e.g. 2
  delay: 0.5,                 // Default animation delay, in seconds, e.g. 0.5
  useGSAP: true               // Enable GSAP animations
});
```

## Options

### Global Options

- **easing** (default: `'ease'`): The default easing function for animations and transitions.
- **again** (default: `true`): If set to `true`, the animation will be triggered again for elements that have scrolled out of view towards the bottom.
- **viewportPercentage** (default: `0.8`): A number between `0` and `1` representing the percentage of the viewport height required to trigger the animation.
- **duration** (default: `1`): The default animation duration.
- **delay** (default: `0`): The default animation delay.
- **useGSAP** (default: `false`): Enable GSAP animations for more advanced effects.

### Element Attributes

- **aa-animate**: The animation type to apply. Example: `aa-animate="fade-up-slow"`.
- **aa-transition**: Similar to `aa-animate` but for transition effects. Example: `aa-transition="fade"`.
- **aa-easing**: Overwrites the global easing function for this element. Example: `aa-easing="ease-in-out"`.
- **aa-duration**: The animation duration for this element, in seconds. Example: `aa-duration="2"`.
- **aa-delay**: The animation delay for this element, in seconds. Example: `aa-delay="0.5"`.
- **aa-delay-mobile**: If set, overwrites the delay on mobile devices. Example: `aa-delay-mobile="0.5s"`.
- **aa-color-initial**: The initial background color for the animation. Example: `aa-color-initial="#d7ff64"`.
- **aa-color-final**: The final background color for the animation. Example: `aa-color-final="#d7ff64"`.
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#anchorElement"`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.
- **aa-split**: Specifies how to split the text for animation. Possible values: `lines`, `words`, `chars`. Optionally, you can add `clip` to wrap each line in a clip wrapper and prevent overflow, resulting in a clipping effect during the animation. Example: `aa-split="words.clip"`.
- **aa-stagger**: Sets the stagger effect for split text animations, in seconds. Example: `aa-stagger="0.05"`.

## Examples

Here's a complete example using AlrdyAnimate with custom options and GSAP animations:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlrdyAnimate Example</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v2.0.0/AlrdyAnimate.css">
</head>
<body>
  <div aa-animate="textRotateUp" aa-duration="1.5s" aa-delay="0.3s" aa-split="words" aa-stagger="0.05">Your content here</div>

  <script src="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v2.0.0/AlrdyAnimate.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      AlrdyAnimate.init({
        easing: 'ease-in-out',
        again: false,
        viewportPercentage: 0.6,
        duration: '2s',
        delay: '0.5s',
        useGSAP: true
      });
    });
  </script>
</body>
</html>
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
<div aa-animate="fade-up" aa-easing="back.out">Animated content</div>
```

This will apply a fade-up animation with a 'back out' easing, which means it will slightly overshoot and then settle into place.


## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.