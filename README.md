# AlrdyAnimate Library

## Table of Contents
- [Overview](#overview)
- [Installation](#installation)
- [Usage](#usage)
- [Options](#options)
- [Examples](#example)


AlrdyAnimate is a lightweight JavaScript library for adding scroll-triggered animations to your web pages. It provides easy-to-use options for customizing animation behavior and supports IntersectionObserver for efficient performance.

## Installation

You can include AlrdyAnimate in your project by using a CDN or by bundling it with your build process.

### Using CDN

```html
<!-- Include the AlrdyAnimate CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.css">

<!-- Include the AlrdyAnimate JS -->
<script src="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.js"></script>

<script>
  document.addEventListener('DOMContentLoaded', function() {
    AlrdyAnimate.init({
      easing: 'ease-in-out',
      again: false,
      viewportPercentage: 0.6,
      duration: '2s',
      delay: '0.5s'
    });
  });
</script>
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
    delay: '0.5s'
  });
});
```

## Usage

### HTML

To use AlrdyAnimate, add the `aa-animate` or `aa-transition` attribute to the elements you want to animate. You can also add optional attributes to customize the animation for individual elements.

```html
<div aa-animate="fade-up" aa-duration="1.5s" aa-delay="0.3s">Your content here</div>
```

### JavaScript

Initialize the library with your desired options:

```javascript
AlrdyAnimate.init({
  easing: 'ease-in-out', // Default easing function
  again: false,          // Do not remove 'in-view' class when out of view
  viewportPercentage: 0.6, // Trigger animation when 60% of the element is in view
  duration: '2s',        // Default animation duration
  delay: '0.5s'          // Default animation delay
});
```

## Options

### Global Options

- **easing** (default: `'ease'`): The default easing function for animations and transitions. See [Supported Easing Functions](#supported-easing-functions).
- **again** (default: `true`): If set to `true`, the animation will be triggered again for elements that have scrolled out of view towards the bottom (i.e. user scrolled up).
- **viewportPercentage** (default: `0.8`): A number between `0` and `1` representing the percentage of the viewport height required to trigger the animation.
- **duration** (default: `'1s'`): The default animation duration. Can be overridden on individual elements using the `aa-duration` attribute.
- **delay** (default: `'0s'`): The default animation delay. Can be overridden on individual elements using the `aa-delay` attribute.
- **colorInitial** (default: `'var(--background-color--background-page)'`): Used for animations with colors; initial color before animation has played.
- **colorFinal** (default: `'var(--background-color--background-alternate)'`): Used for animations with colors; final color after animation has played.


### Element Attributes

- **aa-animate**: The animation type to apply. Example: `aa-animate="fade-up-slow"`.
- **aa-transition**: Similar to `aa-animate` but for transition effects.
- **aa-easing**: Overwrites the global easing function for this element. Example: `aa-easing="ease-in-out"`.
- **aa-duration**: The animation duration for this element. Example: `aa-duration="2s"`.
- **aa-delay**: The animation delay for this element. Example: `aa-delay="0.5s"`.
- **aa-delay-mobile**: If set, overwrites the delay on mobile devices. Example: `aa-delay-mobile="0.5s"`.
- **aa-color-initial**: The initial background color for the animation. Example: `aa-color-initial="#d7ff64"`.
- **aa-color-final**: The final background color for the animation. Example: `aa-color-final="#d7ff64"`.
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#anchorElement"`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.


### Supported Easing Functions

The `AlrdyAnimate` library supports a variety of easing functions to control the rate of animation, providing a more natural motion compared to linear timing functions. Below are the easing functions supported by the library, grouped by type with brief descriptions:

1. **Linear**
   - **Linear**: Moves at a constant speed.

2. **Ease**
   - **Ease**: Smooth and gradual start and end.

3. **Ease-in**
   - **Ease-in**: Starts slowly and gradually accelerates, creating a smooth entry into the animation.
   - **Ease-in-back**: Begins slowly, then slightly overshoots backwards before accelerating forward, giving a "wind-up" effect.
   - **Ease-in-sine**: Accelerates gently following a sine wave pattern, providing a soft and natural-feeling start.
   - **Ease-in-quad**: Accelerates following a quadratic curve, starting slowly but picking up speed more quickly than linear.
   - **Ease-in-cubic**: Follows a cubic curve, starting even slower than quadratic but then accelerating more dramatically.
   - **Ease-in-quart**: Uses a quartic curve, beginning very slowly and then rapidly accelerating towards the end.
   - **Ease-in-quint**: Employs a quintic curve, starting extremely slowly and then accelerating very rapidly in the latter part.
   - **Ease-in-expo**: Begins imperceptibly slow and then accelerates exponentially, creating a sudden burst of speed.
   - **Ease-in-circ**: Follows a circular arc, starting very slowly and then rapidly accelerating, giving a sense of "uncoiling".

4. **Ease-out**
   - **Ease-out**: Starts quickly, then slows down.
   - **Ease-out-back**: Ends slowly with a slight backward motion.
   - **Ease-out-sine**: Ends slowly, resembling a sine wave.
   - **Ease-out-quad**: Decelerates faster than linear.
   - **Ease-out-cubic**: Starts quickly, then slows down rapidly.
   - **Ease-out-quart**: Starts quickly, then slows down very rapidly.
   - **Ease-out-quint**: Starts quickly, then slows down very rapidly.
   - **Ease-out-expo**: Starts quickly, then slows down very rapidly.
   - **Ease-out-circ**: Starts quickly, then slows down very rapidly.

5. **Ease-in-out**
   - **Ease-in-out**: Smooth start and end with a faster middle.
   - **Ease-in-out-back**: Combines ease-in-back and ease-out-back.
   - **Ease-in-out-sine**: Smooth start and end with a sine wave motion.
   - **Ease-in-out-quad**: Combines ease-in-quad and ease-out-quad.
   - **Ease-in-out-cubic**: Combines ease-in-cubic and ease-out-cubic.
   - **Ease-in-out-quart**: Combines ease-in-quart and ease-out-quart.
   - **Ease-in-out-quint**: Combines ease-in-quint and ease-out-quint.
   - **Ease-in-out-expo**: Combines ease-in-expo and ease-out-expo.
   - **Ease-in-out-circ**: Combines ease-in-circ and ease-out-circ.

These easing functions provide a range of motion and speed characteristics, allowing for a wide variety of animation effects to be created.


## Example

Here’s a complete example using AlrdyAnimate with custom options:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlrdyAnimate Example</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.css">
</head>
<body>
  <div aa-animate="fade-up" aa-duration="1.5s" aa-delay="0.3s">Your content here</div>

  <script src="https://cdn.jsdelivr.net/gh/ben-alrdy/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.js"></script>
  <script>
    document.addEventListener('DOMContentLoaded', function() {
      AlrdyAnimate.init({
        easing: 'ease-in-out',
        again: false,
        viewportPercentage: 0.6,
        duration: '2s',
        delay: '0.5s'
      });
    });
  </script>
</body>
</html>
```

## Contributing

Contributions are welcome! Please fork the repository and submit pull requests for any improvements.

## License

This project is licensed under the MIT License. See the [LICENSE](LICENSE) file for details.
