/******/ (() => { // webpackBootstrap
/******/ 	"use strict";
/******/ 	var __webpack_modules__ = ({

/***/ "./src/scss/AlrdyAnimate.scss":
/*!************************************!*\
  !*** ./src/scss/AlrdyAnimate.scss ***!
  \************************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
// extracted by mini-css-extract-plugin


/***/ }),

/***/ "./src/js/utils/throttle.js":
/*!**********************************!*\
  !*** ./src/js/utils/throttle.js ***!
  \**********************************/
/***/ ((__unused_webpack_module, __webpack_exports__, __webpack_require__) => {

__webpack_require__.r(__webpack_exports__);
/* harmony export */ __webpack_require__.d(__webpack_exports__, {
/* harmony export */   "default": () => (__WEBPACK_DEFAULT_EXPORT__)
/* harmony export */ });
/**
 * Creates a throttled function that only invokes `func` at most once per every `limit` milliseconds.
 * The throttled function comes with `leading` and `trailing` options to control when the function is invoked.
 *
 * @param {Function} func - The function to throttle.
 * @param {number} limit - The number of milliseconds to throttle invocations to.
 * @param {Object} [options={}] - The options object.
 * @param {boolean} [options.leading=true] - Specify invoking on the leading edge of the timeout.
 * @param {boolean} [options.trailing=true] - Specify invoking on the trailing edge of the timeout.
 * @returns {Function} Returns the new throttled function.
 */

function throttle(func, limit, options = {}) {
    let inThrottle; // Flag to track if the function is currently throttled
    let lastFunc; // Store the last function to be called after throttle ends
    let lastRan; // Timestamp of the last function run
  
    return function() {
      const context = this; // Store context for 'this' keyword
      const args = arguments; // Store arguments to pass to the function
  
      if (!inThrottle) {
        if (options.leading !== false) {
          func.apply(context, args); // Call the function if leading is true
        }
        lastRan = Date.now(); // Set the last run timestamp
        inThrottle = true; // Set the throttle flag
        setTimeout(() => {
          inThrottle = false; // Reset the throttle flag after the limit
          if (options.trailing !== false && lastFunc) {
            lastFunc.apply(context, args); // Call the function if trailing is true
            lastRan = Date.now(); // Update the last run timestamp
            lastFunc = null; // Clear the last function
          }
        }, limit);
      } else {
        lastFunc = function() {
          if (!options.leading) {
            func.apply(context, args); // Call the function if leading is false
          }
        };
      }
    };
  }
  
  /* harmony default export */ const __WEBPACK_DEFAULT_EXPORT__ = (throttle);

/***/ })

/******/ 	});
/************************************************************************/
/******/ 	// The module cache
/******/ 	var __webpack_module_cache__ = {};
/******/ 	
/******/ 	// The require function
/******/ 	function __webpack_require__(moduleId) {
/******/ 		// Check if module is in cache
/******/ 		var cachedModule = __webpack_module_cache__[moduleId];
/******/ 		if (cachedModule !== undefined) {
/******/ 			return cachedModule.exports;
/******/ 		}
/******/ 		// Create a new module (and put it into the cache)
/******/ 		var module = __webpack_module_cache__[moduleId] = {
/******/ 			// no module.id needed
/******/ 			// no module.loaded needed
/******/ 			exports: {}
/******/ 		};
/******/ 	
/******/ 		// Execute the module function
/******/ 		__webpack_modules__[moduleId](module, module.exports, __webpack_require__);
/******/ 	
/******/ 		// Return the exports of the module
/******/ 		return module.exports;
/******/ 	}
/******/ 	
/************************************************************************/
/******/ 	/* webpack/runtime/define property getters */
/******/ 	(() => {
/******/ 		// define getter functions for harmony exports
/******/ 		__webpack_require__.d = (exports, definition) => {
/******/ 			for(var key in definition) {
/******/ 				if(__webpack_require__.o(definition, key) && !__webpack_require__.o(exports, key)) {
/******/ 					Object.defineProperty(exports, key, { enumerable: true, get: definition[key] });
/******/ 				}
/******/ 			}
/******/ 		};
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/hasOwnProperty shorthand */
/******/ 	(() => {
/******/ 		__webpack_require__.o = (obj, prop) => (Object.prototype.hasOwnProperty.call(obj, prop))
/******/ 	})();
/******/ 	
/******/ 	/* webpack/runtime/make namespace object */
/******/ 	(() => {
/******/ 		// define __esModule on exports
/******/ 		__webpack_require__.r = (exports) => {
/******/ 			if(typeof Symbol !== 'undefined' && Symbol.toStringTag) {
/******/ 				Object.defineProperty(exports, Symbol.toStringTag, { value: 'Module' });
/******/ 			}
/******/ 			Object.defineProperty(exports, '__esModule', { value: true });
/******/ 		};
/******/ 	})();
/******/ 	
/************************************************************************/
var __webpack_exports__ = {};
/*!********************************!*\
  !*** ./src/js/AlrdyAnimate.js ***!
  \********************************/
__webpack_require__.r(__webpack_exports__);
/* harmony import */ var _scss_AlrdyAnimate_scss__WEBPACK_IMPORTED_MODULE_0__ = __webpack_require__(/*! ../scss/AlrdyAnimate.scss */ "./src/scss/AlrdyAnimate.scss");
/* harmony import */ var _utils_throttle__WEBPACK_IMPORTED_MODULE_1__ = __webpack_require__(/*! ./utils/throttle */ "./src/js/utils/throttle.js");




document.addEventListener("DOMContentLoaded", () => {
  const isMobile = window.innerWidth < 768;

  // Observers map to handle unique viewport percentages
  const observersMap = {};

  // Get all the elements with the aa attribute
  const allAnimatedElements = document.querySelectorAll('[aa-animate]');

  allAnimatedElements.forEach(element => {
    const aaMobile = element.getAttribute('aa-mobile');
    const viewportPercentageAttr = element.getAttribute('aa-viewport');
    let viewportPercentage = viewportPercentageAttr ? parseFloat(viewportPercentageAttr) : 0.8;
    let delay = element.getAttribute('aa-delay');

    if (isMobile) {
      if (aaMobile && aaMobile === 'no-delay') {
        delay = null;
      }
      viewportPercentage = 0.8; // Default to 80% on mobile
    }

    if (delay) {
      element.style.animationDelay = delay;
    }

    if (!isNaN(viewportPercentage) && viewportPercentage >= 0 && viewportPercentage <= 1) {
      // Calculate rootMargin based on the viewport percentage
      const bottomMargin = (1 - viewportPercentage) * 100;
      const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;

      // Check if an observer for this root margin already exists
      if (!observersMap[rootMarginValue]) {
        // Create a new observer with the specific root margin
        observersMap[rootMarginValue] = new IntersectionObserver((0,_utils_throttle__WEBPACK_IMPORTED_MODULE_1__["default"])((entries, observer) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
            } else {
              const rect = entry.target.getBoundingClientRect();
              if (rect.top >= window.innerHeight) {
                entry.target.classList.remove('in-view');
              }
            }
          });
        }, 100), {
          rootMargin: rootMarginValue
        });
      }

      // Add the element to the appropriate observer
      observersMap[rootMarginValue].observe(element);
    }
  });
});
/******/ })()
;
//# sourceMappingURL=AlrdyAnimate.js.map