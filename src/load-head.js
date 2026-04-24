/**
 * AlrdyAnimate - Load Animation Head Script
 *
 * Include this inline in <head>, BEFORE load-animations.css and the main bundle.
 * It decides whether the CSS fallback should own load animations, or the JS bundle
 * will take over when it arrives.
 *
 * Two attributes on <html>:
 *   aa-load-js-ready       — set by the main bundle as soon as it parses,
 *                            unless aa-load-css-fallback is already set.
 *   aa-load-css-fallback   — set by this script either immediately (data saver /
 *                            very slow connection) or after FALLBACK_THRESHOLD_MS
 *                            if the bundle still hasn't shown up.
 *
 * The two flags are mutually exclusive: each setter checks for the other first.
 *
 * FALLBACK_THRESHOLD_MS must match --load-base-delay in load-animations.css.
 */
(function () {
  var html = document.documentElement;
  if (!html) return;

  var FALLBACK_THRESHOLD_MS = 500;

  // Honor explicit user / OS signals immediately
  var conn = navigator.connection;
  if (conn) {
    if (conn.saveData || conn.effectiveType === 'slow-2g' || conn.effectiveType === '2g') {
      html.setAttribute('aa-load-css-fallback', '');
      return;
    }
  }

  // Commit to CSS fallback if the bundle hasn't set aa-load-js-ready in time
  setTimeout(function () {
    if (!html.hasAttribute('aa-load-js-ready')) {
      html.setAttribute('aa-load-css-fallback', '');
    }
  }, FALLBACK_THRESHOLD_MS);
})();
