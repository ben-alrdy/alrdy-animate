import './globals.css'
import 'lenis/dist/lenis.css'
import type { ReactNode } from 'react'
import { AlrdyProvider } from '@/components/AlrdyProvider'

export const metadata = {
  title: 'alrdy-animate × Next.js page transitions',
}

// Slow-network + init-timeout safety. Two layers:
//   - aa-fallback (FALLBACK_DELAY): fades aa-trigger="load" / "load-once"
//     elements via a CSS keyframe — graceful hero staircase.
//   - aa-timeout  (TIMEOUT_DELAY): reveals every [aa-animate] element at
//     its natural state — universal safety if init() never arrives.
// See docs/recipes/load-fallback.
const fallbackScript = `
  (function () {
    var FALLBACK_DELAY = 1000;
    var TIMEOUT_DELAY = 4000;
    function applyFallback() {
      if (document.documentElement.hasAttribute('aa-loaded')) return;
      document.documentElement.setAttribute('aa-fallback', '');
      document.querySelectorAll('[aa-trigger~="load"][aa-animate], [aa-trigger~="load-once"][aa-animate]').forEach(function (el) {
        var stagger = parseFloat(el.getAttribute('aa-stagger'));
        var baseDelay = parseFloat(el.getAttribute('aa-delay')) || 0;
        if (Number.isFinite(stagger) && el.children.length > 0) {
          el.style.animation = 'none';
          el.style.visibility = 'visible';
          Array.from(el.children).forEach(function (child, i) {
            child.style.animation = 'aa-fallback-appear 0.5s ease both';
            child.style.animationDelay = (baseDelay + i * stagger) + 's';
          });
        } else if (baseDelay > 0) {
          el.style.animationDelay = baseDelay + 's';
        }
      });
    }
    setTimeout(function () {
      if (document.readyState === 'loading') {
        document.addEventListener('DOMContentLoaded', applyFallback, { once: true });
      } else {
        applyFallback();
      }
    }, FALLBACK_DELAY);
    setTimeout(function () {
      if (document.documentElement.hasAttribute('aa-loaded')) return;
      document.documentElement.setAttribute('aa-timeout', '');
    }, TIMEOUT_DELAY);
  })();
`

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en">
      <head>
        <script dangerouslySetInnerHTML={{ __html: fallbackScript }} />
      </head>
      <body>
        {/* Persistent transition overlay. Lives outside the swapped container
            (children) so it survives every navigation. Four stacked layers
            (z-index ascending): backdrop, next-card, middle, snapshot.
            The Osmo timeline animates snapshot/middle/next-card simultaneously
            from a fully-covering scale:1 state down to their deck positions
            (0.95 / 0.875 / 0.8). The backdrop is the void behind the deck. */}
        <div data-transition-overlay className="transition">
          <div className="transition__backdrop" />
          <div data-transition-next className="transition__next" />
          <div data-transition-middle className="transition__middle" />
          <div data-transition-snapshot className="transition__snapshot" />
        </div>
        <AlrdyProvider>{children}</AlrdyProvider>
      </body>
    </html>
  )
}
