export function createSliderAnimations(gsap, Draggable) {
  const activeLoops = new Set();

  function horizontalLoop(items, config) {
    /*
    https://gsap.com/docs/v3/HelperFunctions/helpers/seamlessLoop/

    This helper function makes a group of elements animate along the x-axis in a seamless, responsive loop.

    Features:
    - Uses xPercent so that even if the widths change (like if the window gets resized), it should still work in most cases.
    - When each item animates to the left or right enough, it will loop back to the other side
    - Optionally pass in a config object with values like "speed" (default: 1, which travels at roughly 100 pixels per second), paused (boolean),  repeat, reversed, and paddingRight.
    - The returned timeline will have the following methods added to it:
    - next() - animates to the next element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, ease, etc.
    - previous() - animates to the previous element using a timeline.tweenTo() which it returns. You can pass in a vars object to control duration, ease, etc.
    - toIndex() - pass in a zero-based index value of the element that it should animate to, and optionally pass in a vars object to control duration, ease, etc. Always goes in the shortest direction
    - current() - returns the current index (if an animation is in-progress, it reflects the final index)
    - times - an Array of the times on the timeline where each element hits the "starting" spot. There's also a label added accordingly, so "label1" is when the 2nd element reaches the start.
    */

    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => { // use a context so that if this is called from within another context or a gsap.matchMedia(), we can perform proper cleanup like the "resize" event handler on the window
      let onChange = config.onChange,
        lastIndex = 0,
        tl = gsap.timeline({
          repeat: config.repeat, onUpdate: onChange && function () {
            let i = tl.closestIndex();
            if (lastIndex !== i) {
              lastIndex = i;
              onChange(items[i], i);
            }
          }, paused: config.paused, defaults: { ease: "none" }, onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)
        }),
        length = items.length,
        startX = items[0].offsetLeft,
        times = [],
        widths = [],
        spaceBefore = [],
        xPercents = [],
        curIndex = 0,
        indexIsDirty = false,
        center = config.center,
        pixelsPerSecond = (config.speed || 1) * 100,
        snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
        timeOffset = 0,
        container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
        totalWidth,
        getTotalWidth = () => {
          return items[length - 1].offsetLeft +
            xPercents[length - 1] / 100 * widths[length - 1] -
            startX +
            items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX") +
            (parseFloat(config.paddingRight) || 0);
        },
        populateWidths = () => {
          let b1 = container.getBoundingClientRect(), b2;
          items.forEach((el, i) => {
            widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
            b2 = el.getBoundingClientRect();
            spaceBefore[i] = b2.left - (i ? b1.right : b1.left);
            b1 = b2;
          });
          gsap.set(items, {
            xPercent: i => xPercents[i]
          });
          totalWidth = getTotalWidth();
        },
        timeWrap,
        populateOffsets = () => {
          timeOffset = center ? tl.duration() * (container.offsetWidth / 2) / totalWidth : 0;
          center && times.forEach((t, i) => {
            times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * widths[i] / 2 / totalWidth - timeOffset);
          });
        },
        getClosest = (values, value, wrap) => {
          let i = values.length,
            closest = 1e10,
            index = 0, d;
          while (i--) {
            d = Math.abs(values[i] - value);
            if (d > wrap / 2) {
              d = wrap - d;
            }
            if (d < closest) {
              closest = d;
              index = i;
            }
          }
          return index;
        },
        populateTimeline = () => {
          let i, item, curX, distanceToStart, distanceToLoop;
          tl.clear();
          for (i = 0; i < length; i++) {
            item = items[i];
            curX = xPercents[i] / 100 * widths[i];
            distanceToStart = item.offsetLeft + curX - startX + spaceBefore[0];
            distanceToLoop = distanceToStart + widths[i] * gsap.getProperty(item, "scaleX");

            tl.to(item, { xPercent: snap((curX - distanceToLoop) / widths[i] * 100), duration: distanceToLoop / pixelsPerSecond }, 0)
              .fromTo(item,
                { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) },
                { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false },
                distanceToLoop / pixelsPerSecond)
              .add("label" + i, distanceToStart / pixelsPerSecond);

            times[i] = distanceToStart / pixelsPerSecond;
          }
          timeWrap = gsap.utils.wrap(0, tl.duration());
        },
        refresh = (deep) => {
          let progress = tl.progress();
          tl.progress(0, true);
          populateWidths();
          deep && populateTimeline();
          populateOffsets();
          deep && tl.draggable ? tl.time(times[curIndex], true) : tl.progress(progress, true);
        },
        onResize = () => refresh(true),
        proxy;
      gsap.set(items, { x: 0 });
      populateWidths();
      populateTimeline();
      populateOffsets();

      // window.addEventListener("resize", onResize); removed since we're handling this in the resizeHandler.js file
      function toIndex(index, vars) {
        vars = vars || {};

        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
        let newIndex = gsap.utils.wrap(0, length, index),
          time = times[newIndex];

        if (time > tl.time() !== index > curIndex && index !== curIndex) { // if we're wrapping the timeline's playhead, make the proper adjustments
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        if (time < 0 || time > tl.duration()) {
          vars.modifiers = { time: timeWrap };
        }
        curIndex = newIndex;
        vars.overwrite = true;
        gsap.killTweensOf(proxy);
        return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
      }
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.closestIndex = setCurrent => {
        let index = getClosest(times, tl.time(), tl.duration());
        if (setCurrent) {
          curIndex = index;
          indexIsDirty = false;
        }
        return index;
      };
      tl.current = () => indexIsDirty ? tl.closestIndex(true) : curIndex;
      tl.next = vars => toIndex(tl.current() + 1, vars);
      tl.previous = vars => toIndex(tl.current() - 1, vars);
      tl.times = times;
      tl.progress(1, true).progress(0, true); // pre-render for performance
      if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
      }
      if (config.draggable && typeof (Draggable) === "function") {
        proxy = document.createElement("div");
        let wrap = gsap.utils.wrap(0, 1),
          ratio, startProgress, draggable, dragSnap, lastSnap, initChangeX, wasPlaying,
          align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
          syncIndex = () => tl.closestIndex(true);

        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: "x",
          onPressInit() {
            let x = this.x;
            gsap.killTweensOf(tl);
            wasPlaying = !tl.paused();
            tl.pause();
            startProgress = tl.progress();
            refresh();
            ratio = 1 / totalWidth;
            initChangeX = (startProgress / -ratio) - x;
            gsap.set(proxy, { x: startProgress / -ratio });
          },
          onDrag: align,
          onThrowUpdate: align,
          overshootTolerance: 0,
          inertia: true,
          throwResistance: 2000,  // Higher number = less distance/speed (default is 0.55)
          maxDuration: 3,
          snap(value) {
            //note: if the user presses and releases in the middle of a throw, due to the sudden correction of proxy.x in the onPressInit(), the velocity could be very large, throwing off the snap. So sense that condition and adjust for it. We also need to set overshootTolerance to 0 to prevent the inertia from causing it to shoot past and come back

            if (Math.abs(startProgress / -ratio - this.x) < 10) {
              return lastSnap + initChangeX;
            }

            let time = -(value * ratio) * tl.duration(),
              wrappedTime = timeWrap(time),
              snapTime = times[getClosest(times, wrappedTime, tl.duration())],
              dif = snapTime - wrappedTime;

            Math.abs(dif) > tl.duration() / 2 && (dif += dif < 0 ? tl.duration() : -tl.duration());
            lastSnap = (time + dif) / tl.duration() / -ratio;

            return lastSnap;
          },
          onRelease() {
            syncIndex();
            draggable.isThrowing && (indexIsDirty = true);
            if (config.reversed) {
              tl.reversed(true);  // Force reversed state if configured
            }
          },
          onThrowComplete: () => {
            syncIndex();
            wasPlaying && tl.play();
            if (config.reversed) {
              tl.reversed(true);  // Ensure reversed state after throw
            }
          }
        })[0];
        tl.draggable = draggable;
      }
      tl.closestIndex(true);
      // Move to center on load if configured
      if (config.center) {
        toIndex(0, { duration: 0 });
      }
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      timeline = tl;
      /* return () => window.removeEventListener("resize", onResize); // cleanup */
    });
    return timeline;
  }

  function setupLoopAnimation(element, animationType, duration = 1, ease = "power2.inOut", delay = 2) {
    const items = gsap.utils.toArray('[aa-slider-item]', element);
    if (items.length === 0) {
      console.warn('No items found with [aa-slider-item] attribute.');
      return;
    }

    // Create the loop configuration
    const config = createLoopConfig(animationType, duration);

    // Add navigation controls if they exist (pass items array)
    setupNavigationControls(element, items, config);

    // Initialize the loop
    const loop = horizontalLoop(items, config);
    element._loop = loop;
    activeLoops.add(element);

    // Setup navigation listeners
    setupNavigationListeners(element, items, loop, duration, ease, config, animationType);

    // Setup additional behaviors based on animation type
    if (animationType.includes('snap')) {
      setupSnapBehavior(loop, animationType, duration, ease, delay);
    } else if (animationType.includes('draggable')) {
      setupDragHandlers(loop, animationType);
    }

    return loop;
  }

  function createLoopConfig(animationType, duration) {
    const config = {
      speed: duration,
      repeat: -1,
      center: false,
      paused: false,
      snap: true
    };

    // Get the gap value from the parent element of the slider item to be added between the last and first item
    const sliderItem = document.querySelector('[aa-slider-item]');
    config.paddingRight = parseFloat(window.getComputedStyle(sliderItem.parentElement).gap) || 0;

    if (animationType.includes('draggable') || animationType.includes('snap')) {
      config.draggable = true;
    }

    if (animationType.includes('snap')) {
      config.paused = true;
    }

    if (animationType.includes('slider')) {
      config.paused = true;
    }

    if (animationType.includes('right')) {
      config.reversed = true;
    }

    if (animationType.includes('center')) {
      config.center = true;
    }

    return config;
  }

  function setupSnapBehavior(loop, animationType, duration, ease, delay) {
    const moveToNext = () => {
      const direction = animationType.includes('right') ? 'previous' : 'next';
      loop[direction]({
        duration: duration,
        ease: ease,
        onComplete: startSnapCycle
      });
    };

    const startSnapCycle = () => {
      gsap.delayedCall(delay, moveToNext);
    };

    // Start from the first item
    loop.toIndex(0, { duration: 0 });

    // Pause the loop if it's going right to auto movement bug
    if (animationType.includes('right')) {
      loop.pause();
    }

    gsap.delayedCall(0.01, startSnapCycle);

    // Make these functions accessible to the drag handlers
    loop.moveToNext = moveToNext;
    loop.startSnapCycle = startSnapCycle;

    // Handle dragging
    if (loop.draggable) {
      setupDragHandlers(loop, animationType, startSnapCycle);
    }
  }

  function setupDragHandlers(loop, animationType, startSnapCycle = null) {
    const originalHandlers = {
      onPressInit: loop.draggable.vars.onPressInit,
      onRelease: loop.draggable.vars.onRelease,
      onThrowComplete: loop.draggable.vars.onThrowComplete
    };

    if (animationType.includes('draggable') && !animationType.includes('slider')) {
      loop.draggable.vars.onPressInit = function () {
        if (loop.paused() && !startSnapCycle) {
          loop.play();
        }
      };

      loop.draggable.vars.onDragStart = function () {
        if (originalHandlers.onPressInit) {
          originalHandlers.onPressInit.call(this);
        }

        // Pause the loop timeline
        loop.pause();

        // Kill any existing delayed calls
        if (startSnapCycle) {
          gsap.killTweensOf(loop.moveToNext);
          gsap.killTweensOf(loop.startSnapCycle);
        }
      };

      loop.draggable.vars.onThrowComplete = function () {
        if (originalHandlers.onThrowComplete) {
          originalHandlers.onThrowComplete.call(this);
        }

        if (startSnapCycle) {
          startSnapCycle();
        } else {
          loop.play();
        }
      };
    }
  }

  function cleanupLoops() {
    activeLoops.forEach(element => {
      if (element._loop) {
        // Get all slider items
        const items = element.querySelectorAll('[aa-slider-item]');
        
        // Kill any existing GSAP tweens on the slider items
        gsap.killTweensOf(items);
        
        // Kill the loop timeline
        element._loop.kill();
        element._loop = null;
        
        // Reset all GSAP properties on slider items
        gsap.set(items, { clearProps: "all" });
        
        // Remove active classes if they exist
        items.forEach(item => item.classList.remove('active'));
        
        // Clean up navigation event listeners if they exist
        if (element._sliderNav) {
          const { nextButton, prevButton } = element._sliderNav;
          if (nextButton) nextButton.replaceWith(nextButton.cloneNode(true));
          if (prevButton) prevButton.replaceWith(prevButton.cloneNode(true));
          element._sliderNav = null;
        }
      }
    });
    activeLoops.clear();
  }

  function setupNavigationControls(element, items, config) {
    const nextButton = element.querySelector('[aa-slider-next]');
    const prevButton = element.querySelector('[aa-slider-prev]');
    const currentElement = element.querySelector('[aa-slider-current]');
    const totalElement = element.querySelector('[aa-slider-total]');

    if (nextButton || prevButton || currentElement || totalElement) {
      const totalSlides = items.length;

      if (totalElement) {
        totalElement.textContent = totalSlides < 10 ? `0${totalSlides}` : totalSlides;
      }

      config.onChange = (element, rawIndex) => {
        // Handle active class
        const activeElement = element.parentElement.querySelector('.active');
        if (activeElement) activeElement.classList.remove('active');
        element.classList.add('active');

        // Handle counter
        if (currentElement) {
          const index = ((rawIndex % totalSlides) + totalSlides) % totalSlides;
          currentElement.textContent = (index + 1) < 10 ? `0${index + 1}` : (index + 1);
        }
      };

      element._sliderNav = {
        nextButton,
        prevButton,
        currentElement,
        totalElement
      };
    }

  }

  function setupNavigationListeners(element, items,loop, duration, ease, config, animationType) {
    if (element._sliderNav) {
      const { nextButton, prevButton } = element._sliderNav;

      const handleNavigation = (direction) => {
        // Execute the navigation
        loop[direction]({
          ease,
          duration,
          onComplete: () => {
            if (!config.paused) {
              gsap.delayedCall(1, () => {
                loop.resume();
              });
            }
          }
        });
      };

      if (nextButton) {
        nextButton.addEventListener('click', () => handleNavigation('next'));
      }

      if (prevButton) {
        prevButton.addEventListener('click', () => handleNavigation('previous'));
      }
    }

    // Add click handlers for slider type
    if (animationType.includes('slider')) { 
      items.forEach((slide, i) => {
        slide.addEventListener('click', () => {
          element._loop.toIndex(i, { ease, duration });
        });
      });
    }
  }

  return {
    slider: (element, animationType, duration, ease, delay) => setupLoopAnimation(element, animationType, duration, ease, delay),
    cleanupLoops
  };
}