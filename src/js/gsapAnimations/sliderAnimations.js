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
          startY,
          startX,
          isDragInitialized = false,
          align = () => tl.progress(wrap(startProgress + (draggable.startX - draggable.x) * ratio)),
          syncIndex = () => tl.closestIndex(true);

        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: "x",
          onPressInit() {
            startY = this.pointerY;
            startX = this.pointerX;
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
          // throwResistance: 3000,
          maxDuration: 1.5, 
          minDuration: 0.3,
          snap(value) {
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
              tl.reversed(true);
            }
          },
          onThrowComplete: () => {
            syncIndex();
            wasPlaying && tl.play();
            if (config.reversed) {
              tl.reversed(true);
            }
          }
        })[0];

        // Add touch event handlers to the trigger element
        const trigger = items[0].parentNode;
        let touchStartY = 0;
        let touchStartX = 0;

        // Define named handlers
        const handleTouchStart = (e) => {
          touchStartY = e.touches[0].clientY;
          touchStartX = e.touches[0].clientX;
        };

        const handleTouchMove = (e) => {
          if (!isDragInitialized) {
            const deltaY = Math.abs(e.touches[0].clientY - touchStartY);
            const deltaX = Math.abs(e.touches[0].clientX - touchStartX);

            // If vertical scrolling is detected, prevent dragging
            if (deltaY > deltaX) {
              draggable.disable();
            } else {
              isDragInitialized = true;
            }
          }
        };

        const handleTouchEnd = () => {
          if (!isDragInitialized) {
            draggable.enable();
          }
          isDragInitialized = false;
        };

        // Add event listeners using named handlers
        trigger.addEventListener('touchstart', handleTouchStart, { passive: false });
        trigger.addEventListener('touchmove', handleTouchMove, { passive: false });
        trigger.addEventListener('touchend', handleTouchEnd);

        // Store cleanup function for touch events
        tl.touchCleanup = () => {
          trigger.removeEventListener('touchstart', handleTouchStart);
          trigger.removeEventListener('touchmove', handleTouchMove);
          trigger.removeEventListener('touchend', handleTouchEnd);
        };

        tl.draggable = draggable;
      }
      tl.closestIndex(true);
      // Move to center on load if configured
      if (config.center) {
        toIndex(0, { duration: 0 });
        refresh(true);
      }
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      timeline = tl;
      /* return () => window.removeEventListener("resize", onResize); // cleanup */
    });
    return timeline;
  }

  function verticalLoop(items, config) {
    let timeline;
    items = gsap.utils.toArray(items);
    config = config || {};
    gsap.context(() => {
      let onChange = config.onChange,
          lastIndex = 0,
          tl = gsap.timeline({
            repeat: config.repeat, 
            onUpdate: onChange && function() {
              let i = tl.closestIndex()
              if (lastIndex !== i) {
                lastIndex = i;
                onChange(items[i], i);
              }
            }, 
            paused: config.paused, 
            defaults: {ease: "none"}, 
            onReverseComplete: () => tl.totalTime(tl.rawTime() + tl.duration() * 100)
          }),
          length = items.length,
          startY = items[0].offsetTop,
          times = [],
          heights = [],
          spaceBefore = [],
          yPercents = [],
          curIndex = 0,
          center = config.center,
          clone = obj => {
            let result = {}, p;
            for (p in obj) {
              result[p] = obj[p];
            }
            return result;
          },
          pixelsPerSecond = (config.speed || 1) * 100,
          snap = config.snap === false ? v => v : gsap.utils.snap(config.snap || 1), // some browsers shift by a pixel to accommodate flex layouts, so for example if width is 20% the first element's width might be 242px, and the next 243px, alternating back and forth. So we snap to 5 percentage points to make things look more natural
          timeOffset = 0, 
          container = center === true ? items[0].parentNode : gsap.utils.toArray(center)[0] || items[0].parentNode,
          totalHeight,
          getTotalHeight = () => {
            return items[length - 1].offsetTop +
              yPercents[length - 1] / 100 * heights[length - 1] -
              startY +
              items[length - 1].offsetHeight * gsap.getProperty(items[length - 1], "scaleY") +
              (parseFloat(config.paddingBottom) || 0);
          },
          populateHeights = () => {
            let b1 = container.getBoundingClientRect(), b2;
            startY = items[0].offsetTop;
            items.forEach((el, i) => {
              heights[i] = parseFloat(gsap.getProperty(el, "height", "px"));
              yPercents[i] = snap(parseFloat(gsap.getProperty(el, "y", "px")) / heights[i] * 100 + gsap.getProperty(el, "yPercent"));
              b2 = el.getBoundingClientRect();
              spaceBefore[i] = b2.top - (i ? b1.bottom : b1.top);
              b1 = b2;
            });
            gsap.set(items, {
              yPercent: i => yPercents[i]
            });
            totalHeight = getTotalHeight();
          },
          timeWrap,
          populateOffsets = () => {
            timeOffset = center ? tl.duration() * (container.offsetHeight / 2) / totalHeight : 0;
            center && times.forEach((t, i) => {
              times[i] = timeWrap(tl.labels["label" + i] + tl.duration() * heights[i] / 2 / totalHeight - timeOffset);
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
            let i, item, curY, distanceToStart, distanceToLoop;
            tl.clear();
            for (i = 0; i < length; i++) {
              item = items[i];
              curY = yPercents[i] / 100 * heights[i];
              distanceToStart = item.offsetTop + curY - startY + spaceBefore[0];
              distanceToLoop = distanceToStart + heights[i] * gsap.getProperty(item, "scaleY");
              tl.to(item, {yPercent: snap((curY - distanceToLoop) / heights[i] * 100), duration: distanceToLoop / pixelsPerSecond}, 0)
                .fromTo(item, {yPercent: snap((curY - distanceToLoop + totalHeight) / heights[i] * 100)}, {yPercent: yPercents[i], duration: (curY - distanceToLoop + totalHeight - curY) / pixelsPerSecond, immediateRender: false}, distanceToLoop / pixelsPerSecond)
                .add("label" + i, distanceToStart / pixelsPerSecond);    
              times[i] = distanceToStart / pixelsPerSecond;
            }
            timeWrap = gsap.utils.wrap(0, tl.duration());
          }, 
          customAnimations = () => {
            let { enterAnimation, leaveAnimation } = config,
                eachDuration = tl.duration() / items.length;
            items.forEach((item, i) => {
              let anim = enterAnimation && enterAnimation(item, eachDuration, i),
                  isAtEnd = anim && (tl.duration() - timeWrap(times[i] - Math.min(eachDuration, anim.duration())) < eachDuration - 0.05);
              anim && tl.add(anim, isAtEnd ? 0 : timeWrap(times[i] - anim.duration()));
              anim = leaveAnimation && leaveAnimation(item, eachDuration, i);
              isAtEnd = times[i] === tl.duration();
              anim && anim.duration() > eachDuration && anim.duration(eachDuration);
              anim && tl.add(anim, isAtEnd ? 0 : times[i]);
            });
          },
          refresh = (deep) => {
             let progress = tl.progress();
             tl.progress(0, true);
             populateHeights();
             deep && populateTimeline();
             populateOffsets();
             customAnimations();
             deep && tl.draggable ? tl.time(times[curIndex], true) : tl.progress(progress, true);
          },
          onResize = () => refresh(true),
          proxy;
      gsap.set(items, {y: 0});
      populateHeights();
      populateTimeline();
      populateOffsets();
      customAnimations();
      // window.addEventListener("resize", onResize);
      function toIndex(index, vars) {
        vars = vars || {};
        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length);
        let newIndex = gsap.utils.wrap(0, length, index),
          time = times[newIndex];
        if (time > tl.time() !== index > curIndex) {
          time += tl.duration() * (index > curIndex ? 1 : -1);
        }
        if (time < 0 || time > tl.duration()) {
          vars.modifiers = {time: timeWrap};
        }
        curIndex = newIndex;
        vars.overwrite = true;
        gsap.killTweensOf(proxy);
        return vars.duration === 0 ? tl.time(timeWrap(time)) : tl.tweenTo(time, vars);
      }
      tl.elements = items;
      tl.next = vars => toIndex(curIndex+1, vars);
      tl.previous = vars => toIndex(curIndex-1, vars);
      tl.current = () => curIndex;
      tl.toIndex = (index, vars) => toIndex(index, vars);
      tl.closestIndex = setCurrent => {
        let index = getClosest(times, tl.time(), tl.duration());
        setCurrent && (curIndex = index);
        return index;
      };
      tl.times = times;
      tl.progress(1, true).progress(0, true); // pre-render for performance
      if (config.reversed) {
        tl.vars.onReverseComplete();
        tl.reverse();
      }
      if (config.draggable && typeof(Draggable) === "function") {
        proxy = document.createElement("div")
        let wrap = gsap.utils.wrap(0, 1),
            ratio, startProgress, draggable, dragSnap,
            align = () => tl.progress(wrap(startProgress + (draggable.startY - draggable.y) * ratio)),
            syncIndex = () => tl.closestIndex(true);
        let wasPlaying,
            lastSnap,
            initChangeY,
            indexIsDirty;
        draggable = Draggable.create(proxy, {
          trigger: items[0].parentNode,
          type: "y",
          onPressInit() {
            let y = this.y;
            gsap.killTweensOf(tl);
            wasPlaying = !tl.paused();
            tl.pause();
            startProgress = tl.progress();
            refresh();
            ratio = 1 / totalHeight;
            initChangeY = (startProgress / -ratio) - y;
            gsap.set(proxy, {y: startProgress / -ratio})
          },
          onDrag: align,
          onThrowUpdate: align,
          overshootTolerance: 0,
          inertia: true,
          throwResistance: 2000,
          maxDuration: 3,
          snap(value) {
            if (Math.abs(startProgress / -ratio - this.y) < 10) {
              return lastSnap + initChangeY;
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

  function initializeSlider(element, animationType, duration, ease, delay) {
    const items = gsap.utils.toArray('[aa-slider-item]', element);
    if (items.length === 0) {
      console.warn('No items found with [aa-slider-item] attribute.');
      return;
    }

    // Create the loop configuration
    const config = setupSliderConfig(element, animationType, duration);

    // Add navigation controls if they exist
    setupNavigationControls(element, items, config);

    // Initialize the loop based on direction
    const loop = animationType.includes('vertical') 
      ? verticalLoop(items, config) 
      : horizontalLoop(items, config);
    
    element._loop = loop;
    activeLoops.add(element);

    // Setup navigation listeners
    setupNavigationListeners(element, items, loop, duration, ease, config, animationType);

    // Setup autoplay if needed
    if (animationType.includes('snap')) {
      setupAutoplay(element, loop, animationType, duration, ease, delay);
    }

    // Setup drag functionality if needed
    if (animationType.includes('draggable')) {
      setupDragHandlers(element, loop, animationType);
    }

    // If it's a continuous loop animation
    if (animationType.includes('loop')) {
      // Create ScrollTrigger for visibility-based pausing
      loop.scrollTrigger = ScrollTrigger.create({
        trigger: element,
        start: "top bottom",
        end: "bottom top",
        onEnter: () => loop.play(),
        onLeave: () => loop.pause(),
        onEnterBack: () => loop.play(),
        onLeaveBack: () => loop.pause()
      });
    }

    return loop;
  }

  function setupSliderConfig(element, animationType, duration) {
    const config = {
      speed: duration,
      repeat: -1,
      center: false,
      paused: true,
      snap: true
    };

    // Get the gap value from the parent element of the slider item to be added between the last and first item
    const sliderItem = element.querySelector('[aa-slider-item]');
    const gap = parseFloat(window.getComputedStyle(sliderItem.parentElement).gap) || 0;

    // Set padding based on direction
    if (animationType.includes('vertical')) {
      config.paddingBottom = gap;
    } else {
      config.paddingRight = gap;
    }

    if (animationType.includes('draggable')) {
      config.draggable = true;
    }

    if (animationType.includes('loop')) {
      config.paused = false;
    }

    if (animationType.includes('reverse')) {
      config.reversed = true;
    }

    if (animationType.includes('center')) {
      config.center = true;
    }

    return config;
  }

  function setupAutoplay(element, loop, animationType, duration, ease, delay) {
    let autoplay;

    const startAutoplay = () => {
      if (!autoplay) {
        const repeat = () => {
          const direction = animationType.includes('reverse') ? 'previous' : 'next';
          loop[direction]({ duration, ease });
          autoplay = gsap.delayedCall(delay, repeat);
        };
        autoplay = gsap.delayedCall(delay, repeat);
      }
    };

    const stopAutoplay = () => {
      if (autoplay) {
        autoplay.kill();
        autoplay = null;
      }
    };

    // Store functions for autoplay control
    loop.startAutoplay = startAutoplay;
    loop.stopAutoplay = stopAutoplay;

    // Setup hover handlers for non-touch devices
    if (!window.matchMedia('(hover: none)').matches) {
      element.addEventListener('mouseenter', stopAutoplay);
      element.addEventListener('mouseleave', startAutoplay);
      
      // Store cleanup function
      loop._removeHoverListeners = () => {
        element.removeEventListener('mouseenter', stopAutoplay);
        element.removeEventListener('mouseleave', startAutoplay);
      };
    }

    // Setup ScrollTrigger for visibility-based autoplay
    loop.scrollTrigger = ScrollTrigger.create({
      trigger: element,
      start: "top bottom",
      end: "bottom top",
      onEnter: startAutoplay,
      onLeave: stopAutoplay,
      onEnterBack: startAutoplay,
      onLeaveBack: stopAutoplay
    });

    // Start autoplay
    loop.pause();
    startAutoplay();
  }

  function setupDragHandlers(element, loop, animationType) {
    const originalHandlers = {
      onPressInit: loop.draggable.vars.onPressInit,
      onRelease: loop.draggable.vars.onRelease,
      onThrowComplete: loop.draggable.vars.onThrowComplete
    };

    if (animationType.includes('draggable')) {
      // Create all handlers
      const handlers = {
        onPressInit() {
          if (originalHandlers.onPressInit) {
            originalHandlers.onPressInit.call(this);
          }

          // Stop autoplay on drag start
          if (loop.stopAutoplay) {
            loop.stopAutoplay();
          }
        },
        onDragStart() {
          loop.pause();
          loop._isThrowing = false;
        },
        onDragEnd() {
          if (this.tween && this.tween.isActive()) {
            loop._isThrowing = true;
          }
        },
        onThrowComplete() {
          if (originalHandlers.onThrowComplete) {
            originalHandlers.onThrowComplete.call(this);
          }

          loop._isThrowing = false;

          // Only restart autoplay if we're not being hovered and it's a snap-enabled slider
          if (loop.startAutoplay && animationType.includes('snap')) {
            if (!element.matches(':hover') || window.matchMedia('(hover: none)').matches) {
              loop.startAutoplay();
            }
          } else if (animationType.includes('loop')) {
            loop.play();
          }
        }
      };

      // Update the draggable instance with all handlers at once
      loop.draggable.vars = {...loop.draggable.vars, ...handlers};
      loop.draggable.enable(); // Re-enable to apply the new handlers
    }
  }

  function setupNavigationControls(element, items, config) {
    const totalSlides = items.length;
    const nextButton = element.querySelector('[aa-slider-next]');
    const prevButton = element.querySelector('[aa-slider-prev]');
    const currentElement = element.querySelector('[aa-slider-current]');
    const totalElement = element.querySelector('[aa-slider-total]');
    
    // Find slide-specific buttons (either within element or by data-target)
    const slideButtons = element.id 
      ? [...element.querySelectorAll('[aa-slider-button]'), 
         ...document.querySelectorAll(`[aa-slider-button][aa-slider-target="${element.id}"]`)]
      : element.querySelectorAll('[aa-slider-button]');

    // Setup ARIA attributes for slider
    element.setAttribute('role', 'region');
    element.setAttribute('aria-roledescription', 'carousel');

    // Setup slides with proper ARIA attributes
    items.forEach((slide, i) => {
      slide.setAttribute('role', 'tabpanel');
      slide.setAttribute('aria-roledescription', 'slide');
      slide.setAttribute('aria-label', `Slide ${i + 1} of ${totalSlides}`);
      slide.setAttribute('id', `${element.id || 'slider'}-slide-${i}`);
    });

    // Setup navigation buttons with ARIA
    if (nextButton) {
      nextButton.setAttribute('aria-label', 'Next slide');
      nextButton.setAttribute('role', 'button');
    }
    if (prevButton) {
      prevButton.setAttribute('aria-label', 'Previous slide');
      prevButton.setAttribute('role', 'button');
    }

    // Setup slide buttons with ARIA
    if (slideButtons.length > 0) {
      const bulletList = slideButtons[0].parentElement;
      if (bulletList) {
        bulletList.setAttribute('role', 'tablist');
        bulletList.setAttribute('aria-label', 'Slide navigation');
      }
      
      slideButtons.forEach((button, i) => {
        button.setAttribute('role', 'tab');
        button.setAttribute('aria-label', `Go to slide ${i + 1}`);
        button.setAttribute('aria-controls', `${element.id || 'slider'}-slide-${i}`);
        button.setAttribute('tabindex', '0');
      });
    }

    // Update total if the element exists
    if (totalElement) {
      totalElement.textContent = totalSlides < 10 ? `0${totalSlides}` : totalSlides;
    }

    // Set up the onChange handler
    config.onChange = (element, rawIndex) => {
      const index = ((rawIndex % totalSlides) + totalSlides) % totalSlides;
      
      // Handle active class and ARIA for slides
      items.forEach((slide, i) => {
        slide.classList.toggle('is-active', i === index);
        slide.setAttribute('aria-hidden', i !== index ? 'true' : 'false');
      });

      // Handle active class and ARIA for buttons
      if (slideButtons.length > 0) {
        slideButtons.forEach((button, i) => {
          button.classList.toggle('is-active', i === index);
          button.setAttribute('aria-selected', i === index ? 'true' : 'false');
        });
      }

      // Handle counter if it exists
      if (currentElement) {
        currentElement.textContent = (index + 1) < 10 ? `0${index + 1}` : (index + 1);
      }
    };

    // Store references for other functions that need them
    element._sliderNav = {
      nextButton,
      prevButton,
      currentElement,
      totalElement,
      slideButtons
    };
  }

  function setupNavigationListeners(element, items, loop, duration, ease, config, animationType) {
    if (element._sliderNav) {
      const { nextButton, prevButton, slideButtons } = element._sliderNav;

      const handleNavigation = (direction) => {
        loop[direction]({
          ease,
          duration,
          onComplete: () => {
            if (animationType.includes('loop')) {
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

      // Add click handlers for slide-specific buttons
      if (slideButtons?.length > 0) {
        slideButtons.forEach((button, index) => {
          button.addEventListener('click', () => {
            loop.toIndex(index, {
              ease,
              duration,
              onComplete: () => {
                if (animationType.includes('loop')) {
                  gsap.delayedCall(1, () => loop.resume());
                }
              }
            });
          });
        });
      }
    }

    // Add click handlers for slider items unless on mobile
    if (!animationType.includes('loop') && !window.matchMedia('(hover: none)').matches){ 
      items.forEach((slide, i) => {
        slide.addEventListener('click', () => {
          element._loop.toIndex(i, { ease, duration });
        });
      });
    }
  }

  function cleanupLoops() {
    activeLoops.forEach(element => {
      if (element._loop) {
        // Stop any active snap cycles
        if (element._loop.stopAutoplay) {
          element._loop.stopAutoplay();
        }

        // Remove hover listeners if they exist
        if (element._loop._removeHoverListeners) {
          element._loop._removeHoverListeners();
        }
        
        // Clean up draggable if it exists
        if (element._loop.draggable) {
          element._loop.draggable.kill();
        }
        
        // Clean up ScrollTrigger if it exists
        if (element._loop.scrollTrigger) {
          element._loop.scrollTrigger.kill();
        }
        
        // Get all slider items
        const items = element.querySelectorAll('[aa-slider-item]');
        
        // Kill any existing GSAP tweens on the items and the loop
        gsap.killTweensOf(items);
        gsap.killTweensOf(element._loop.moveToNext);
        
        // Kill the loop timeline
        element._loop.kill();
        
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

        // Clean up touch listeners if they exist - with safety check
        if (element._loop && typeof element._loop.touchCleanup === 'function') {
          element._loop.touchCleanup();
        }

        element._loop = null;
      }
    });
    activeLoops.clear();
  }

  return {
    slider: (element, animationType, duration, ease, delay) => initializeSlider(element, animationType, duration, ease, delay),
    cleanupLoops
  };
}
