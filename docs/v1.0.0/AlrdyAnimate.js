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


// import throttle from './utils/throttle';

document.addEventListener("DOMContentLoaded", () => {
    const allAnimatedElements = document.querySelectorAll('[aa-animate]');
  
    allAnimatedElements.forEach(element => {
      const viewportPercentageAttr = element.getAttribute('aa-viewport');
      let viewportPercentage = viewportPercentageAttr ? parseFloat(viewportPercentageAttr) : 0.8;
  
      if (!isNaN(viewportPercentage) && viewportPercentage >= 0 && viewportPercentage <= 1) {
        // Calculate rootMargin based on the viewport percentage for the primary observer
        const bottomMargin = (1 - viewportPercentage) * 100;
        const rootMarginValue = `0px 0px -${bottomMargin}% 0px`;
  
        // Primary observer to add 'in-view' class
        const addObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            if (entry.isIntersecting) {
              entry.target.classList.add('in-view');
              console.log(`Added 'in-view' class to ${entry.target.id}`);
            }
          });
        }, {
          threshold: [0, 1], // Trigger callback when any part or the whole element is visible
          rootMargin: rootMarginValue
        });
  
        // Secondary observer to remove 'in-view' class when moving out of the viewport from the bottom
        const removeObserver = new IntersectionObserver((entries) => {
          entries.forEach(entry => {
            const rect = entry.target.getBoundingClientRect();
            if (!entry.isIntersecting && rect.top >= window.innerHeight) {
              entry.target.classList.remove('in-view');
              console.log(`Removed 'in-view' class from ${entry.target.id}`);
            }
          });
        }, {
          threshold: 0, // Trigger callback when the element is not visible at all
          rootMargin: '0px' // Ensure this observer uses the full viewport
        });
  
        const delay = element.getAttribute('aa-delay');
        if (delay) {
          element.style.animationDelay = delay;
        }
  
        addObserver.observe(element);
        removeObserver.observe(element);
      }
    });
  });
/******/ })()
;
//# sourceMappingURL=AlrdyAnimate.js.map