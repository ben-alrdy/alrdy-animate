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
  
  export default throttle;