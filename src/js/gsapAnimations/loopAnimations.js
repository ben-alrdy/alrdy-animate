export function createLoopAnimations(gsap, Draggable) {
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
          const gap = parseFloat(window.getComputedStyle(container).gap) || 0;

          const lastItemOffset = items[length - 1].offsetLeft;
          const lastItemXPercent = xPercents[length - 1] / 100 * widths[length - 1];
          const lastItemWidth = items[length - 1].offsetWidth * gsap.getProperty(items[length - 1], "scaleX");

          const totalWidth = lastItemOffset + lastItemXPercent - startX + lastItemWidth + gap;

          return totalWidth;
        },
        populateWidths = () => {
          const gap = parseFloat(window.getComputedStyle(container).gap) || 0;
          let b1 = container.getBoundingClientRect(), b2;

          items.forEach((el, i) => {
            widths[i] = parseFloat(gsap.getProperty(el, "width", "px"));
            xPercents[i] = snap(parseFloat(gsap.getProperty(el, "x", "px")) / widths[i] * 100 + gsap.getProperty(el, "xPercent"));
            b2 = el.getBoundingClientRect();

            spaceBefore[i] = i === 0 ? gap : 0;

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
              .fromTo(item, { xPercent: snap((curX - distanceToLoop + totalWidth) / widths[i] * 100) }, { xPercent: xPercents[i], duration: (curX - distanceToLoop + totalWidth - curX) / pixelsPerSecond, immediateRender: false }, distanceToLoop / pixelsPerSecond)
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
        const gap = parseFloat(window.getComputedStyle(container).gap) || 0;

        (Math.abs(index - curIndex) > length / 2) && (index += index > curIndex ? -length : length); // always go in the shortest direction
        let newIndex = gsap.utils.wrap(0, length, index),
          time = times[newIndex];

        // Subtract the gap offset instead of adding it
        time -= (gap / pixelsPerSecond);

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
          snap(value) {
            //note: if the user presses and releases in the middle of a throw, due to the sudden correction of proxy.x in the onPressInit(), the velocity could be very large, throwing off the snap. So sense that condition and adjust for it. We also need to set overshootTolerance to 0 to prevent the inertia from causing it to shoot past and come back
            if (Math.abs(startProgress / -ratio - this.x) < 10) {
              return lastSnap + initChangeX
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
      lastIndex = curIndex;
      onChange && onChange(items[curIndex], curIndex);
      timeline = tl;
      /* return () => window.removeEventListener("resize", onResize); // cleanup */
    });
    return timeline;
  }

  function setupLoopAnimation(element, animationType, duration = 1, ease = "power2.inOut") {
    const items = gsap.utils.toArray(element.children);
    if (items.length === 0) {
      console.warn('No items found in container element.');
      return;
    }
  
    // Create the loop configuration
    const config = createLoopConfig(animationType, duration);
    
    // Initialize the loop
    const loop = horizontalLoop(items, config);
    element._loop = loop;
    activeLoops.add(element);
  
    // Setup additional behaviors based on animation type
    if (animationType.includes('snap')) {
      setupSnapBehavior(loop, animationType, duration, ease);
    } else if (animationType.includes('draggable')) {
      setupDragHandlers(loop);
    }
  
    return loop;
  }
  
  function createLoopConfig(animationType, duration) {
    const config = {
      onChange: (element) => {
        const activeElement = element.parentElement.querySelector('.active');
        if (activeElement) activeElement.classList.remove('active');
        element.classList.add('active');
      },
      speed: duration,
      repeat: -1,
      center: true
    };
  
    if (animationType.includes('right')) {
      config.reversed = true;
    }
  
    if (animationType.includes('draggable') || animationType.includes('snap')) {
      config.draggable = true;
      config.snap = true;
    }
  
    if (animationType.includes('snap')) {
      config.paused = true;
    }
  
    return config;
  }
  
  function setupSnapBehavior(loop, animationType, duration, ease) {
    const moveToNext = () => {
      const direction = animationType.includes('right') ? 'previous' : 'next';
      loop[direction]({
        duration: duration,
        ease: ease,
        onComplete: startSnapCycle
      });
    };

    console.log(ease);
  
    const startSnapCycle = () => {
      gsap.delayedCall(2, moveToNext);
    };
  
    // Initial setup
    loop.toIndex(0, { duration: 0 });
    gsap.delayedCall(0.1, startSnapCycle);
  
    // Make these functions accessible to the drag handlers
    loop.moveToNext = moveToNext;
    loop.startSnapCycle = startSnapCycle;
  
    // Handle dragging
    if (loop.draggable) {
      setupDragHandlers(loop, startSnapCycle);
    }
  }
  
  function setupDragHandlers(loop, startSnapCycle = null) {
    const originalHandlers = {
      onPressInit: loop.draggable.vars.onPressInit,
      onRelease: loop.draggable.vars.onRelease,
      onThrowComplete: loop.draggable.vars.onThrowComplete
    };

    loop.draggable.vars.onDragStart = function() {
      if (originalHandlers.onPressInit) {
        originalHandlers.onPressInit.call(this);
      }
      console.log("drag start");

      // Pause the loop timeline
      loop.pause();
      
      // Kill any existing delayed calls
      if (startSnapCycle) {
        gsap.killTweensOf(loop.moveToNext);
        gsap.killTweensOf(loop.startSnapCycle);
      }
    };

    loop.draggable.vars.onThrowComplete = function() {
      if (originalHandlers.onThrowComplete) {
        originalHandlers.onThrowComplete.call(this);
      }
      console.log("draggable throw complete");
      if (startSnapCycle) {
        startSnapCycle();
      } else {
        loop.play();
      }
    };
  }

  function cleanupLoops() {
    activeLoops.forEach(element => {
      if (element._loop) {
        // Kill any existing GSAP tweens on the children
        gsap.killTweensOf(element.children);
        // Kill the loop timeline
        element._loop.kill();
        element._loop = null;
        // Reset all GSAP properties
        gsap.set(element.children, { clearProps: "all" });
      }
    });
    activeLoops.clear();
  }

  return {
    loop: (element, animationType, duration, ease) => setupLoopAnimation(element, animationType, duration, ease),
    cleanupLoops
  };
}
