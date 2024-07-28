# AlrdyAnimate Library

AlrdyAnimate is a lightweight JavaScript library for adding scroll-triggered animations to your web pages. It provides easy-to-use options for customizing animation behavior and supports IntersectionObserver for efficient performance.

## Installation

You can include AlrdyAnimate in your project by using a CDN or by bundling it with your build process.

### Using CDN

```html
<!-- Include the AlrdyAnimate CSS -->
<link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/your-username/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.css">

<!-- Include the AlrdyAnimate JS -->
<script src="https://cdn.jsdelivr.net/gh/your-username/AlrdyAnimate@master/docs/v1.0.0/AlrdyAnimate.js"></script>

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

### Using NPM

Install via NPM:

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

- **easing** (default: `'ease'`): The default easing function for animations. Accepts any valid CSS easing value.
- **again** (default: `true`): If set to `true`, the animation will be triggered again for elements that have scrolled out of view towards the bottom (i.e. user scrolled up).
- **viewportPercentage** (default: `0.8`): A number between `0` and `1` representing the percentage of the viewport height required to trigger the animation.
- **duration** (default: `'1s'`): The default animation duration. Can be overridden on individual elements using the `aa-duration` attribute.
- **delay** (default: `'0s'`): The default animation delay. Can be overridden on individual elements using the `aa-delay` attribute.
- **colorInitial** (default: `'var(--background-color--background-page)'`): Used for animations with colors; initial color before animation has played.
- **colorFinal** (default: `'var(--background-color--background-alternate)'`): Used for animations with colors; final color after animation has played.


### Element Attributes

- **aa-animate**: The animation type to apply. Example: `aa-animate="fade-u-slow"`.
- **aa-transition**: Similar to `aa-animate` but for transition effects.
- **aa-duration**: The animation duration for this element. Example: `aa-duration="2s"`.
- **aa-delay**: The animation delay for this element. Example: `aa-delay="0.5s"`.
- **aa-delay-mobile**: If set, overwrites the delay on mobile devices.
- **aa-color-initial**: The initial background color for the animation.
- **aa-color-final**: The final background color for the animation.
- **aa-anchor**: Specify an anchor element to trigger the animation (useful for fixed elements that should be animated when the anchor scrolls into view). Example: `aa-anchor="#anchorElement"`.
- **aa-viewport**: Override the global viewport percentage for this element. Example: `aa-viewport="0.6"`.

## Example

Here’s a complete example using AlrdyAnimate with custom options:

```html
<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8">
  <meta name="viewport" content="width=device-width, initial-scale=1.0">
  <title>AlrdyAnimate Example</title>
  <link rel="stylesheet" href="https://cdn.jsdelivr.net/gh/your-username/AlrdyAnimate@latest/docs/v1.0.0/AlrdyAnimate.css">
</head>
<body>
  <div aa-animate="fade-up" aa-duration="1.5s" aa-delay="0.3s">Your content here</div>

  <script src="https://cdn.jsdelivr.net/gh/your-username/AlrdyAnimate@latest/docs/v1.0.0/AlrdyAnimate.js"></script>
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