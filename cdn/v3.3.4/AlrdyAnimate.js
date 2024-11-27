/*! For license information please see AlrdyAnimate.js.LICENSE.txt */
!function(t,e){"object"==typeof exports&&"object"==typeof module?module.exports=e():"function"==typeof define&&define.amd?define([],e):"object"==typeof exports?exports.AlrdyAnimate=e():t.AlrdyAnimate=e()}(this,(()=>(()=>{var t,e,r={181:(t,e,r)=>{var n=/^\s+|\s+$/g,a=/^[-+]0x[0-9a-f]+$/i,o=/^0b[01]+$/i,i=/^0o[0-7]+$/i,c=parseInt,u="object"==typeof r.g&&r.g&&r.g.Object===Object&&r.g,l="object"==typeof self&&self&&self.Object===Object&&self,s=u||l||Function("return this")(),f=Object.prototype.toString,p=Math.max,d=Math.min,g=function(){return s.Date.now()};function h(t){var e=typeof t;return!!t&&("object"==e||"function"==e)}function y(t){if("number"==typeof t)return t;if(function(t){return"symbol"==typeof t||function(t){return!!t&&"object"==typeof t}(t)&&"[object Symbol]"==f.call(t)}(t))return NaN;if(h(t)){var e="function"==typeof t.valueOf?t.valueOf():t;t=h(e)?e+"":e}if("string"!=typeof t)return 0===t?t:+t;t=t.replace(n,"");var r=o.test(t);return r||i.test(t)?c(t.slice(2),r?2:8):a.test(t)?NaN:+t}t.exports=function(t,e,r){var n,a,o,i,c,u,l=0,s=!1,f=!1,v=!0;if("function"!=typeof t)throw new TypeError("Expected a function");function b(e){var r=n,o=a;return n=a=void 0,l=e,i=t.apply(o,r)}function m(t){var r=t-u;return void 0===u||r>=e||r<0||f&&t-l>=o}function w(){var t=g();if(m(t))return A(t);c=setTimeout(w,function(t){var r=e-(t-u);return f?d(r,o-(t-l)):r}(t))}function A(t){return c=void 0,v&&n?b(t):(n=a=void 0,i)}function x(){var t=g(),r=m(t);if(n=arguments,a=this,u=t,r){if(void 0===c)return function(t){return l=t,c=setTimeout(w,e),s?b(t):i}(u);if(f)return c=setTimeout(w,e),b(u)}return void 0===c&&(c=setTimeout(w,e)),i}return e=y(e)||0,h(r)&&(s=!!r.leading,o=(f="maxWait"in r)?p(y(r.maxWait)||0,e):o,v="trailing"in r?!!r.trailing:v),x.cancel=function(){void 0!==c&&clearTimeout(c),l=0,n=u=a=c=void 0},x.flush=function(){return void 0===c?i:A(g())},x}}},n={};function a(t){var e=n[t];if(void 0!==e)return e.exports;var o=n[t]={exports:{}};return r[t](o,o.exports,a),o.exports}a.m=r,a.n=t=>{var e=t&&t.__esModule?()=>t.default:()=>t;return a.d(e,{a:e}),e},a.d=(t,e)=>{for(var r in e)a.o(e,r)&&!a.o(t,r)&&Object.defineProperty(t,r,{enumerable:!0,get:e[r]})},a.f={},a.e=t=>Promise.all(Object.keys(a.f).reduce(((e,r)=>(a.f[r](t,e),e)),[])),a.u=t=>"chunks/"+{267:"gsap-hover",478:"gsap-text",678:"gsap-core",704:"gsap-draggable",928:"gsap-scroll"}[t]+"."+{267:"ce093938292b5e588aa9",478:"3284c06ed744570ff47e",678:"59e02993011fd0f86b57",704:"f805e269a6c7654d4c73",928:"c120a916a4fc51a452a1"}[t]+".js",a.miniCssF=t=>{},a.g=function(){if("object"==typeof globalThis)return globalThis;try{return this||new Function("return this")()}catch(t){if("object"==typeof window)return window}}(),a.o=(t,e)=>Object.prototype.hasOwnProperty.call(t,e),t={},e="AlrdyAnimate:",a.l=(r,n,o,i)=>{if(t[r])t[r].push(n);else{var c,u;if(void 0!==o)for(var l=document.getElementsByTagName("script"),s=0;s<l.length;s++){var f=l[s];if(f.getAttribute("src")==r||f.getAttribute("data-webpack")==e+o){c=f;break}}c||(u=!0,(c=document.createElement("script")).charset="utf-8",c.timeout=120,a.nc&&c.setAttribute("nonce",a.nc),c.setAttribute("data-webpack",e+o),c.src=r),t[r]=[n];var p=(e,n)=>{c.onerror=c.onload=null,clearTimeout(d);var a=t[r];if(delete t[r],c.parentNode&&c.parentNode.removeChild(c),a&&a.forEach((t=>t(n))),e)return e(n)},d=setTimeout(p.bind(null,void 0,{type:"timeout",target:c}),12e4);c.onerror=p.bind(null,c.onerror),c.onload=p.bind(null,c.onload),u&&document.head.appendChild(c)}},a.r=t=>{"undefined"!=typeof Symbol&&Symbol.toStringTag&&Object.defineProperty(t,Symbol.toStringTag,{value:"Module"}),Object.defineProperty(t,"__esModule",{value:!0})},(()=>{var t;a.g.importScripts&&(t=a.g.location+"");var e=a.g.document;if(!t&&e&&(e.currentScript&&"SCRIPT"===e.currentScript.tagName.toUpperCase()&&(t=e.currentScript.src),!t)){var r=e.getElementsByTagName("script");if(r.length)for(var n=r.length-1;n>-1&&(!t||!/^http(s?):/.test(t));)t=r[n--].src}if(!t)throw new Error("Automatic publicPath is not supported in this browser");t=t.replace(/#.*$/,"").replace(/\?.*$/,"").replace(/\/[^\/]+$/,"/"),a.p=t})(),(()=>{var t={792:0};a.f.j=(e,r)=>{var n=a.o(t,e)?t[e]:void 0;if(0!==n)if(n)r.push(n[2]);else{var o=new Promise(((r,a)=>n=t[e]=[r,a]));r.push(n[2]=o);var i=a.p+a.u(e),c=new Error;a.l(i,(r=>{if(a.o(t,e)&&(0!==(n=t[e])&&(t[e]=void 0),n)){var o=r&&("load"===r.type?"missing":r.type),i=r&&r.target&&r.target.src;c.message="Loading chunk "+e+" failed.\n("+o+": "+i+")",c.name="ChunkLoadError",c.type=o,c.request=i,n[1](c)}}),"chunk-"+e,e)}};var e=(e,r)=>{var n,o,[i,c,u]=r,l=0;if(i.some((e=>0!==t[e]))){for(n in c)a.o(c,n)&&(a.m[n]=c[n]);u&&u(a)}for(e&&e(r);l<i.length;l++)o=i[l],a.o(t,o)&&t[o]&&t[o][0](),t[o]=0},r=this.webpackChunkAlrdyAnimate=this.webpackChunkAlrdyAnimate||[];r.forEach(e.bind(null,0)),r.push=e.bind(null,r.push.bind(r))})();var o={};return(()=>{"use strict";a.d(o,{AlrdyAnimate:()=>w});var t=a(181),e=a.n(t);function r(t,r,n,a){var o=window.innerWidth,i=e()((function(){var e,i=window.innerWidth;i!==o&&(n=i<768,null!==(e=t.animations)&&void 0!==e&&e.loop&&t.animations.cleanupLoops(),t.ScrollTrigger.refresh(),a(document.querySelectorAll("[aa-animate], [aa-children]"),r,n,t),o=i)}),250);window.addEventListener("resize",i),window.addEventListener("orientationchange",(function(){setTimeout((function(){window.innerWidth!==o&&i()}),100)}))}function n(t){var r=!1,n=!1,a=e()((function(){t&&r&&(t.refresh(),r=!1)}),200);window.scrollY>0&&function(){if(!n){var e=window.scrollY||document.documentElement.scrollTop,r=document.querySelectorAll('img[loading="lazy"]'),a=0,o=0;r.forEach((function(r){r.getBoundingClientRect().top+e<e&&(a++,r.complete?o++:r.addEventListener("load",(function(){++o===a&&t.refresh(!0)}),{once:!0}),r.loading="eager")})),a>0&&o===a&&t.refresh(!0),n=!0}}(),document.querySelectorAll('img[loading="lazy"]').forEach((function(t){t.complete||t.addEventListener("load",(function(){r=!0}),{once:!0})})),t.addEventListener("scrollEnd",(function(){r&&a()}))}function i(t){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}function c(){c=function(){return e};var t,e={},r=Object.prototype,n=r.hasOwnProperty,a=Object.defineProperty||function(t,e,r){t[e]=r.value},o="function"==typeof Symbol?Symbol:{},u=o.iterator||"@@iterator",l=o.asyncIterator||"@@asyncIterator",s=o.toStringTag||"@@toStringTag";function f(t,e,r){return Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}),t[e]}try{f({},"")}catch(t){f=function(t,e,r){return t[e]=r}}function p(t,e,r,n){var o=e&&e.prototype instanceof m?e:m,i=Object.create(o.prototype),c=new I(n||[]);return a(i,"_invoke",{value:P(t,r,c)}),i}function d(t,e,r){try{return{type:"normal",arg:t.call(e,r)}}catch(t){return{type:"throw",arg:t}}}e.wrap=p;var g="suspendedStart",h="suspendedYield",y="executing",v="completed",b={};function m(){}function w(){}function A(){}var x={};f(x,u,(function(){return this}));var S=Object.getPrototypeOf,E=S&&S(S(_([])));E&&E!==r&&n.call(E,u)&&(x=E);var j=A.prototype=m.prototype=Object.create(x);function O(t){["next","throw","return"].forEach((function(e){f(t,e,(function(t){return this._invoke(e,t)}))}))}function T(t,e){function r(a,o,c,u){var l=d(t[a],t,o);if("throw"!==l.type){var s=l.arg,f=s.value;return f&&"object"==i(f)&&n.call(f,"__await")?e.resolve(f.__await).then((function(t){r("next",t,c,u)}),(function(t){r("throw",t,c,u)})):e.resolve(f).then((function(t){s.value=t,c(s)}),(function(t){return r("throw",t,c,u)}))}u(l.arg)}var o;a(this,"_invoke",{value:function(t,n){function a(){return new e((function(e,a){r(t,n,e,a)}))}return o=o?o.then(a,a):a()}})}function P(e,r,n){var a=g;return function(o,i){if(a===y)throw Error("Generator is already running");if(a===v){if("throw"===o)throw i;return{value:t,done:!0}}for(n.method=o,n.arg=i;;){var c=n.delegate;if(c){var u=L(c,n);if(u){if(u===b)continue;return u}}if("next"===n.method)n.sent=n._sent=n.arg;else if("throw"===n.method){if(a===g)throw a=v,n.arg;n.dispatchException(n.arg)}else"return"===n.method&&n.abrupt("return",n.arg);a=y;var l=d(e,r,n);if("normal"===l.type){if(a=n.done?v:h,l.arg===b)continue;return{value:l.arg,done:n.done}}"throw"===l.type&&(a=v,n.method="throw",n.arg=l.arg)}}}function L(e,r){var n=r.method,a=e.iterator[n];if(a===t)return r.delegate=null,"throw"===n&&e.iterator.return&&(r.method="return",r.arg=t,L(e,r),"throw"===r.method)||"return"!==n&&(r.method="throw",r.arg=new TypeError("The iterator does not provide a '"+n+"' method")),b;var o=d(a,e.iterator,r.arg);if("throw"===o.type)return r.method="throw",r.arg=o.arg,r.delegate=null,b;var i=o.arg;return i?i.done?(r[e.resultName]=i.value,r.next=e.nextLoc,"return"!==r.method&&(r.method="next",r.arg=t),r.delegate=null,b):i:(r.method="throw",r.arg=new TypeError("iterator result is not an object"),r.delegate=null,b)}function k(t){var e={tryLoc:t[0]};1 in t&&(e.catchLoc=t[1]),2 in t&&(e.finallyLoc=t[2],e.afterLoc=t[3]),this.tryEntries.push(e)}function F(t){var e=t.completion||{};e.type="normal",delete e.arg,t.completion=e}function I(t){this.tryEntries=[{tryLoc:"root"}],t.forEach(k,this),this.reset(!0)}function _(e){if(e||""===e){var r=e[u];if(r)return r.call(e);if("function"==typeof e.next)return e;if(!isNaN(e.length)){var a=-1,o=function r(){for(;++a<e.length;)if(n.call(e,a))return r.value=e[a],r.done=!1,r;return r.value=t,r.done=!0,r};return o.next=o}}throw new TypeError(i(e)+" is not iterable")}return w.prototype=A,a(j,"constructor",{value:A,configurable:!0}),a(A,"constructor",{value:w,configurable:!0}),w.displayName=f(A,s,"GeneratorFunction"),e.isGeneratorFunction=function(t){var e="function"==typeof t&&t.constructor;return!!e&&(e===w||"GeneratorFunction"===(e.displayName||e.name))},e.mark=function(t){return Object.setPrototypeOf?Object.setPrototypeOf(t,A):(t.__proto__=A,f(t,s,"GeneratorFunction")),t.prototype=Object.create(j),t},e.awrap=function(t){return{__await:t}},O(T.prototype),f(T.prototype,l,(function(){return this})),e.AsyncIterator=T,e.async=function(t,r,n,a,o){void 0===o&&(o=Promise);var i=new T(p(t,r,n,a),o);return e.isGeneratorFunction(r)?i:i.next().then((function(t){return t.done?t.value:i.next()}))},O(j),f(j,s,"Generator"),f(j,u,(function(){return this})),f(j,"toString",(function(){return"[object Generator]"})),e.keys=function(t){var e=Object(t),r=[];for(var n in e)r.push(n);return r.reverse(),function t(){for(;r.length;){var n=r.pop();if(n in e)return t.value=n,t.done=!1,t}return t.done=!0,t}},e.values=_,I.prototype={constructor:I,reset:function(e){if(this.prev=0,this.next=0,this.sent=this._sent=t,this.done=!1,this.delegate=null,this.method="next",this.arg=t,this.tryEntries.forEach(F),!e)for(var r in this)"t"===r.charAt(0)&&n.call(this,r)&&!isNaN(+r.slice(1))&&(this[r]=t)},stop:function(){this.done=!0;var t=this.tryEntries[0].completion;if("throw"===t.type)throw t.arg;return this.rval},dispatchException:function(e){if(this.done)throw e;var r=this;function a(n,a){return c.type="throw",c.arg=e,r.next=n,a&&(r.method="next",r.arg=t),!!a}for(var o=this.tryEntries.length-1;o>=0;--o){var i=this.tryEntries[o],c=i.completion;if("root"===i.tryLoc)return a("end");if(i.tryLoc<=this.prev){var u=n.call(i,"catchLoc"),l=n.call(i,"finallyLoc");if(u&&l){if(this.prev<i.catchLoc)return a(i.catchLoc,!0);if(this.prev<i.finallyLoc)return a(i.finallyLoc)}else if(u){if(this.prev<i.catchLoc)return a(i.catchLoc,!0)}else{if(!l)throw Error("try statement without catch or finally");if(this.prev<i.finallyLoc)return a(i.finallyLoc)}}}},abrupt:function(t,e){for(var r=this.tryEntries.length-1;r>=0;--r){var a=this.tryEntries[r];if(a.tryLoc<=this.prev&&n.call(a,"finallyLoc")&&this.prev<a.finallyLoc){var o=a;break}}o&&("break"===t||"continue"===t)&&o.tryLoc<=e&&e<=o.finallyLoc&&(o=null);var i=o?o.completion:{};return i.type=t,i.arg=e,o?(this.method="next",this.next=o.finallyLoc,b):this.complete(i)},complete:function(t,e){if("throw"===t.type)throw t.arg;return"break"===t.type||"continue"===t.type?this.next=t.arg:"return"===t.type?(this.rval=this.arg=t.arg,this.method="return",this.next="end"):"normal"===t.type&&e&&(this.next=e),b},finish:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.finallyLoc===t)return this.complete(r.completion,r.afterLoc),F(r),b}},catch:function(t){for(var e=this.tryEntries.length-1;e>=0;--e){var r=this.tryEntries[e];if(r.tryLoc===t){var n=r.completion;if("throw"===n.type){var a=n.arg;F(r)}return a}}throw Error("illegal catch attempt")},delegateYield:function(e,r,n){return this.delegate={iterator:_(e),resultName:r,nextLoc:n},"next"===this.method&&(this.arg=t),b}},e}function u(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function l(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function s(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?l(Object(r),!0).forEach((function(e){f(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):l(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function f(t,e,r){return(e=function(t){var e=function(t){if("object"!=i(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var r=e.call(t,"string");if("object"!=i(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==i(e)?e:e+""}(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function p(t,e,r,n,a,o,i){try{var c=t[o](i),u=c.value}catch(t){return void r(t)}c.done?e(u):Promise.resolve(u).then(n,a)}function d(t){return function(){var e=this,r=arguments;return new Promise((function(n,a){var o=t.apply(e,r);function i(t){p(o,n,a,i,c,"next",t)}function c(t){p(o,n,a,i,c,"throw",t)}i(void 0)}))}}var g=null,h=!1,y=!1,v={ease:"ease-in-out",again:!0,viewportPercentage:.8,duration:1,delay:0,distance:1,gsapFeatures:[],debug:!1};function b(){return b=d(c().mark((function t(){var e,o,i,l,f=arguments;return c().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(e=f.length>0&&void 0!==f[0]?f[0]:{},o=s(s({},v),e),g=document.querySelectorAll("[aa-animate], [aa-children]"),h=window.innerWidth<768,y=o.gsapFeatures.length>0,"IntersectionObserver"in window||y){t.next=8;break}return g.forEach((function(t){t.classList.add("in-view")})),t.abrupt("return");case 8:return document.body.style.setProperty("--aa-default-duration","".concat(o.duration,"s")),document.body.style.setProperty("--aa-default-delay","".concat(o.delay,"s")),document.body.style.setProperty("--aa-distance","".concat(o.distance)),document.body.setAttribute("aa-ease",o.ease),i=null,l=null,y&&(i=d(c().mark((function t(){var e,r,n,i,l,s;return c().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:return t.prev=0,t.next=3,a.e(678).then(a.bind(a,75));case 3:return e=t.sent,r=e.gsap,n=e.ScrollTrigger,i=e.gsapBundles,l={gsap:r,ScrollTrigger:n},s={},r.registerPlugin(n),window.gsap=r,window.ScrollTrigger=n,t.next=14,Promise.all(o.gsapFeatures.map(function(){var t=d(c().mark((function t(e){var n,a,o,f;return c().wrap((function(t){for(;;)switch(t.prev=t.next){case 0:if(n=i[e]){t.next=3;break}return t.abrupt("return");case 3:if(!n.plugins){t.next=8;break}return t.next=6,n.plugins();case 6:t.sent.forEach((function(t){Object.entries(t).forEach((function(t){var e,n,a=(n=2,function(t){if(Array.isArray(t))return t}(e=t)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,a,o,i,c=[],u=!0,l=!1;try{if(o=(r=r.call(t)).next,0===e){if(Object(r)!==r)return;u=!1}else for(;!(u=(n=o.call(r)).done)&&(c.push(n.value),c.length!==e);u=!0);}catch(t){l=!0,a=t}finally{try{if(!u&&null!=r.return&&(i=r.return(),Object(i)!==i))return}finally{if(l)throw a}}return c}}(e,n)||function(t,e){if(t){if("string"==typeof t)return u(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?u(t,e):void 0}}(e,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()),o=a[0],i=a[1];r.registerPlugin(i),("Draggable"===o||i.toString().includes("Draggable"))&&(window.Draggable=i,globalThis.Draggable=i)})),Object.assign(l,t)}));case 8:if(!n.dependencies){t.next=13;break}return t.next=11,n.dependencies();case 11:a=t.sent,Object.assign(l,a);case 13:if(!n.animations){t.next=31;break}return t.next=16,n.animations();case 16:o=t.sent,f={},t.t0=e,t.next="text"===t.t0?21:"scroll"===t.t0?23:"loop"===t.t0?25:"hover"===t.t0?27:30;break;case 21:return f=o.createTextAnimations(l.gsap,l.ScrollTrigger),t.abrupt("break",30);case 23:return f=o.createScrollAnimations(l.gsap,l.ScrollTrigger),t.abrupt("break",30);case 25:return f=o.createLoopAnimations(l.gsap,l.Draggable),t.abrupt("break",30);case 27:return(f=o.createHoverAnimations(l.gsap,l.splitText)).initializeHoverAnimations(),t.abrupt("break",30);case 30:Object.assign(s,f);case 31:case"end":return t.stop()}}),t)})));return function(e){return t.apply(this,arguments)}}()));case 14:return l.animations=s,t.abrupt("return",l);case 18:return t.prev=18,t.t0=t.catch(0),console.error("Failed to load GSAP:",t.t0),t.abrupt("return",null);case 22:case"end":return t.stop()}}),t,null,[[0,18]])})))()),t.abrupt("return",new Promise((function(t){window.addEventListener("load",d(c().mark((function e(){var a,u,s,f,p;return c().wrap((function(e){for(;;)switch(e.prev=e.next){case 0:if(!y){e.next=7;break}return e.next=3,i;case 3:(l=e.sent)?((a=document.querySelector('[aa-nav="sticky"]'))&&(f=a.getAttribute("aa-ease"),p=a.getAttribute("aa-duration"),null===(u=(s=l.animations).stickyNav)||void 0===u||u.call(s,a,null!=f?f:"back.inOut",null!=p?p:.4)),m(g,o,h,l),r(l,o,h,m),n(l.ScrollTrigger),t({gsap:l.gsap,ScrollTrigger:l.ScrollTrigger})):(y=!1,g.forEach((function(t){t.style.visibility="visible"})),m(g,o,h,{gsap:null,ScrollTrigger:null}),t({gsap:null,ScrollTrigger:null})),e.next=9;break;case 7:m(g,o,h,{gsap:null,ScrollTrigger:null}),t({gsap:null,ScrollTrigger:null});case 9:case"end":return e.stop()}}),e)}))))})));case 16:case"end":return t.stop()}}),t)}))),b.apply(this,arguments)}function m(t,e,r,n){t.forEach((function(t){if(t.hasAttribute("aa-children")){var a=function(t){var e=Array.from(t.children),r=t.hasAttribute("aa-delay")?parseFloat(t.getAttribute("aa-delay")):0,n=t.hasAttribute("aa-stagger")?parseFloat(t.getAttribute("aa-stagger")):0,a=t.getAttribute("aa-children");return e.forEach((function(e,o){if(!e.hasAttribute("aa-animate")){a&&"true"!==a&&e.setAttribute("aa-animate",a),Array.from(t.attributes).filter((function(t){return t.name.startsWith("aa-")&&!["aa-children","aa-stagger","aa-delay"].includes(t.name)})).forEach((function(t){e.setAttribute(t.name,t.value)}));var i=r+o*n;e.setAttribute("aa-delay",i.toString())}})),t.style.opacity="1",e}(t);m(a,e,r,n)}else{var o=function(t,e){var r=t.getAttribute("aa-animate"),n=t.getAttribute("aa-anchor"),a=n?document.querySelector(n):t;return{animationType:r,ease:t.hasAttribute("aa-ease")?t.getAttribute("aa-ease"):e.ease,splitType:t.getAttribute("aa-split"),scroll:t.getAttribute("aa-scroll"),distance:t.hasAttribute("aa-distance")?parseFloat(t.getAttribute("aa-distance")):e.distance,duration:t.hasAttribute("aa-duration")?parseFloat(t.getAttribute("aa-duration")):void 0,delay:t.hasAttribute("aa-delay")?parseFloat(t.getAttribute("aa-delay")):void 0,delayMobile:t.hasAttribute("aa-delay-mobile")?parseFloat(t.getAttribute("aa-delay-mobile")):void 0,stagger:t.hasAttribute("aa-stagger")?parseFloat(t.getAttribute("aa-stagger")):void 0,colorInitial:t.getAttribute("aa-color-initial")||e.colorInitial,colorFinal:t.getAttribute("aa-color-final")||e.colorFinal,viewportPercentage:t.hasAttribute("aa-viewport")?parseFloat(t.getAttribute("aa-viewport")):e.viewportPercentage,anchorSelector:n,anchorElement:a,isParent:t.hasAttribute("aa-children"),childrenAnimation:t.getAttribute("aa-children")}}(t,e);!function(t,e,r){var n=e.duration,a=e.delay,o=e.distance,i=e.delayMobile,c=e.colorInitial,u=e.colorFinal;if(t.hasAttribute("aa-duration")&&t.style.setProperty("--aa-duration","".concat(n,"s")),t.hasAttribute("aa-delay")){var l=r&&void 0!==i?i:a;t.style.setProperty("--aa-delay","".concat(l,"s"))}t.hasAttribute("aa-distance")&&t.style.setProperty("--aa-distance","".concat(o)),c&&t.style.setProperty("--aa-bg-color-initial",c),u&&t.style.setProperty("--aa-bg-color-final",u)}(t,o,r),y?function(t,e,r,n,a){var o,i=e.animationType,c=e.splitType,u=e.scroll,l=e.duration,s=e.stagger,f=e.delay,p=e.ease,d=e.anchorElement,g=e.anchorSelector,h=e.viewportPercentage;if(i.startsWith("loop-"))return null!==(o=a.animations)&&void 0!==o&&o.loop?void a.animations.loop(t,i,l,p):void console.warn("Loop animation requested but 'loop' module not loaded. Add 'loop' to gsapFeatures array in init options to use loop animations.");t.timeline&&t.timeline.kill(),t.splitInstance&&t.splitInstance.revert(),requestAnimationFrame((function(){var e=a.gsap.timeline({paused:!0,scrollTrigger:{trigger:d,start:"top ".concat(100*h,"%"),onEnter:function(){t.classList.add("in-view"),e.play()},markers:r.debug}});if(t.timeline=e,c){var o=a.splitText(t,c),y=o.splitResult,v=o.splitType;t.splitInstance=y;var b={"text-slide-up":"slideUp","text-slide-down":"slideDown","text-tilt-up":"tiltUp","text-tilt-down":"tiltDown","text-rotate-soft":"rotateSoft","text-fade-soft":"fadeSoft","text-fade":"fade"}[i];b&&e.add(a.animations[b](t,y,v,l,s,f,p,n,u))}a.ScrollTrigger.create({trigger:d,start:"top 100%",onLeaveBack:function(){(r.again||g)&&(t.classList.remove("in-view"),e.progress(0).pause())}})}))}(t,o,e,r,n):(t.style.visibility="visible",function(t,e,r){var n=e.anchorElement,a=e.anchorSelector,o=e.viewportPercentage,i="0px 0px -".concat(100*(1-o),"% 0px"),c=new IntersectionObserver((function(e){e.forEach((function(e){e.isIntersecting&&t.classList.add("in-view")}))}),{threshold:[0,1],rootMargin:i}),u=new IntersectionObserver((function(e){e.forEach((function(e){var n=e.target.getBoundingClientRect();!e.isIntersecting&&n.top>=window.innerHeight&&(r.again||a)&&t.classList.remove("in-view")}))}),{threshold:0,rootMargin:"0px"});c.observe(n),u.observe(n)}(t,o,e))}}))}var w={init:function(){return b.apply(this,arguments)},getGSAP:function(){return window.gsap},getScrollTrigger:function(){return window.ScrollTrigger},getDraggable:function(){return window.Draggable}};"undefined"!=typeof window&&(window.AlrdyAnimate=w)})(),o.AlrdyAnimate})()));