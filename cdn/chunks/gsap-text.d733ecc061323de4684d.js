"use strict";(this.webpackChunkAlrdyAnimate=this.webpackChunkAlrdyAnimate||[]).push([[478],{646:(t,e,n)=>{function r(t){return r="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},r(t)}function o(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function i(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?o(Object(n),!0).forEach((function(e){a(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):o(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function a(t,e,n){return(e=function(t){var e=function(t){if("object"!=r(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var n=e.call(t,"string");if("object"!=r(n))return n;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==r(e)?e:e+""}(e))in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function s(t,e){var n=1.2,r=.3,o="circ.out";function a(e,n){return function(r,o,a,s,c,l,u){var p=function(e,n,r,o,a,s,c){var l=t.timeline(),u={duration:o,stagger:a,ease:c,delay:s,onStart:function(){return t.set(e,{autoAlpha:1})}};return"lines&words"===r?{tl:l,animate:function(t){n.lines.forEach((function(e,r){var o=n.words.filter((function(t){return e.contains(t)}));l.from(o,i(i({},u),t),r*a*3)}))}}:{tl:l,animate:function(t){l.from(n[r],i(i({},u),t))}}}(r,o,a,null!=s?s:n.duration,null!=c?c:n.stagger,l,null!=u?u:n.ease),f=p.tl,d=p.animate;return"opacity"in e&&e.opacity>0||f.set(r,{autoAlpha:0}),d(e),f}}return{slideUp:a({y:"110%",opacity:0},{duration:.5,stagger:.1,ease:"back.out"}),slideDown:a({y:"-110%",opacity:0},{duration:.5,stagger:.1,ease:"back.out"}),tiltUp:a({y:"110%",opacity:0,rotation:10},{duration:.5,stagger:.1,ease:"back.out"}),tiltDown:a({y:"-110%",opacity:0,rotation:-10},{duration:.5,stagger:.1,ease:"back.out"}),fadeSoft:a({opacity:.3},{duration:1,stagger:.08,ease:"power2.inOut"}),fade:a({opacity:0},{duration:1,stagger:.08,ease:"power2.inOut"}),rotateSoft:function(e,i,a,s,c,l,u){var p=t.timeline(),f=i[a]||i.lines,d=5*parseFloat(window.getComputedStyle(e).fontSize);return f.forEach((function(t){var e=document.createElement("div");e.classList.add("line-perspective-wrapper"),t.parentNode.insertBefore(e,t),e.appendChild(t)})),p.set(e,{autoAlpha:0}).set(".line-perspective-wrapper",{transformStyle:"preserve-3d",perspective:d}).set(f,{transformOrigin:"50% 0%"}),p.from(f,{autoAlpha:0,rotateX:-90,y:"100%",scaleX:.75,duration:null!=s?s:n,stagger:null!=c?c:r,ease:null!=u?u:o,delay:l,onStart:function(){return t.set(e,{autoAlpha:1})}}),p}}}n.r(e),n.d(e,{createTextAnimations:()=>s})},430:(t,e,n)=>{function r(t,e){for(var n=0;n<e.length;n++){var r=e[n];r.enumerable=r.enumerable||!1,r.configurable=!0,"value"in r&&(r.writable=!0),Object.defineProperty(t,r.key,r)}}function o(t,e,n){return e&&r(t.prototype,e),n&&r(t,n),t}function i(t,e,n){return e in t?Object.defineProperty(t,e,{value:n,enumerable:!0,configurable:!0,writable:!0}):t[e]=n,t}function a(t,e){var n=Object.keys(t);if(Object.getOwnPropertySymbols){var r=Object.getOwnPropertySymbols(t);e&&(r=r.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),n.push.apply(n,r)}return n}function s(t){for(var e=1;e<arguments.length;e++){var n=null!=arguments[e]?arguments[e]:{};e%2?a(Object(n),!0).forEach((function(e){i(t,e,n[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(n)):a(Object(n)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(n,e))}))}return t}function c(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t)){var n=[],r=!0,o=!1,i=void 0;try{for(var a,s=t[Symbol.iterator]();!(r=(a=s.next()).done)&&(n.push(a.value),!e||n.length!==e);r=!0);}catch(t){o=!0,i=t}finally{try{r||null==s.return||s.return()}finally{if(o)throw i}}return n}}(t,e)||u(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function l(t){return function(t){if(Array.isArray(t))return p(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||u(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function u(t,e){if(t){if("string"==typeof t)return p(t,e);var n=Object.prototype.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?p(t,e):void 0}}function p(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=new Array(e);n<e;n++)r[n]=t[n];return r}function f(t,e){return Object.getOwnPropertyNames(Object(t)).reduce((function(n,r){var o=Object.getOwnPropertyDescriptor(Object(t),r),i=Object.getOwnPropertyDescriptor(Object(e),r);return Object.defineProperty(n,r,i||o)}),{})}function d(t){return"string"==typeof t}function h(t){return Array.isArray(t)}function y(){var t,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},n=f(e);return void 0!==n.types?t=n.types:void 0!==n.split&&(t=n.split),void 0!==t&&(n.types=(d(t)||h(t)?String(t):"").split(",").map((function(t){return String(t).trim()})).filter((function(t){return/((line)|(word)|(char))/i.test(t)}))),(n.absolute||n.position)&&(n.absolute=n.absolute||/absolute/.test(e.position)),n}function m(t){var e=d(t)||h(t)?String(t):"";return{none:!e,lines:/line/i.test(e),words:/word/i.test(e),chars:/char/i.test(e)}}function b(t){return null!==t&&"object"==typeof t}function v(t){return b(t)&&/^(1|3|11)$/.test(t.nodeType)}function g(t){return h(t)?t:null==t?[]:function(t){return b(t)&&function(t){return"number"==typeof t&&t>-1&&t%1==0}(t.length)}(t)?Array.prototype.slice.call(t):[t]}function w(t){var e=t;return d(t)&&(e=/^(#[a-z]\w+)$/.test(t.trim())?document.getElementById(t.trim().slice(1)):document.querySelectorAll(t)),g(e).reduce((function(t,e){return[].concat(l(t),l(g(e).filter(v)))}),[])}n.r(e),n.d(e,{splitText:()=>nt}),function(){function t(){for(var t=arguments.length,e=0;e<t;e++){var n=e<0||arguments.length<=e?void 0:arguments[e];1===n.nodeType||11===n.nodeType?this.appendChild(n):this.appendChild(document.createTextNode(String(n)))}}function e(){for(;this.lastChild;)this.removeChild(this.lastChild);arguments.length&&this.append.apply(this,arguments)}function n(){for(var t=this.parentNode,e=arguments.length,n=new Array(e),r=0;r<e;r++)n[r]=arguments[r];var o=n.length;if(t)for(o||t.removeChild(this);o--;){var i=n[o];"object"!=typeof i?i=this.ownerDocument.createTextNode(i):i.parentNode&&i.parentNode.removeChild(i),o?t.insertBefore(this.previousSibling,i):t.replaceChild(i,this)}}"undefined"!=typeof Element&&(Element.prototype.append||(Element.prototype.append=t,DocumentFragment.prototype.append=t),Element.prototype.replaceChildren||(Element.prototype.replaceChildren=e,DocumentFragment.prototype.replaceChildren=e),Element.prototype.replaceWith||(Element.prototype.replaceWith=n,DocumentFragment.prototype.replaceWith=n))}();var O=Object.entries,j="_splittype",S={},E=0;function C(t,e,n){if(!b(t))return console.warn("[data.set] owner is not an object"),null;var r=t[j]||(t[j]=++E),o=S[r]||(S[r]={});return void 0===n?e&&Object.getPrototypeOf(e)===Object.prototype&&(S[r]=s(s({},o),e)):void 0!==e&&(o[e]=n),n}function A(t,e){var n=b(t)?t[j]:null,r=n&&S[n]||{};return void 0===e?r:r[e]}function P(t){var e=t&&t[j];e&&(delete t[e],delete S[e])}var k="\\ud800-\\udfff",T="\\u0300-\\u036f\\ufe20-\\ufe23",x="\\u20d0-\\u20f0",D="\\ufe0e\\ufe0f",W="[".concat(k,"]"),N="[".concat(T).concat(x,"]"),I="\\ud83c[\\udffb-\\udfff]",B="(?:".concat(N,"|").concat(I,")"),L="[^".concat(k,"]"),R="(?:\\ud83c[\\udde6-\\uddff]){2}",$="[\\ud800-\\udbff][\\udc00-\\udfff]",F="\\u200d",M="".concat(B,"?"),H="[".concat(D,"]?"),U=H+M+"(?:"+F+"(?:"+[L,R,$].join("|")+")"+H+M+")*",z="(?:".concat(["".concat(L).concat(N,"?"),N,R,$,W].join("|"),"\n)"),X=RegExp("".concat(I,"(?=").concat(I,")|").concat(z).concat(U),"g"),V=RegExp("[".concat([F,k,T,x,D].join(""),"]"));function q(t){return V.test(t)}function Y(t){var e,n=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";return(t=null==(e=t)?"":String(e))&&d(t)&&!n&&q(t)?function(t){return q(t)?function(t){return t.match(X)||[]}(t):function(t){return t.split("")}(t)}(t):t.split(n)}function _(t,e){var n=document.createElement(t);return e?(Object.keys(e).forEach((function(t){var r=e[t],o=d(r)?r.trim():r;null!==o&&""!==o&&("children"===t?n.append.apply(n,l(g(o))):n.setAttribute(t,o))})),n):n}var G={splitClass:"",lineClass:"line",wordClass:"word",charClass:"char",types:["lines","words","chars"],absolute:!1,tagName:"div"};function J(t,e){var n=t.nodeType,r={words:[],chars:[]};if(!/(1|3|11)/.test(n))return r;if(3===n&&/\S/.test(t.nodeValue))return function(t,e){var n,r=m((e=f(G,e)).types),o=e.tagName,i=t.nodeValue,a=document.createDocumentFragment(),s=[];return/^\s/.test(i)&&a.append(" "),n=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:" ";return(t?String(t):"").trim().replace(/\s+/g," ").split(e)}(i).reduce((function(t,n,i,c){var u,p;return r.chars&&(p=Y(n).map((function(t){var n=_(o,{class:"".concat(e.splitClass," ").concat(e.charClass),style:"display: inline-block;",children:t});return C(n,"isChar",!0),s=[].concat(l(s),[n]),n}))),r.words||r.lines?(C(u=_(o,{class:"".concat(e.wordClass," ").concat(e.splitClass),style:"display: inline-block; ".concat(r.words&&e.absolute?"position: relative;":""),children:r.chars?p:n}),{isWord:!0,isWordStart:!0,isWordEnd:!0}),a.appendChild(u)):p.forEach((function(t){a.appendChild(t)})),i<c.length-1&&a.append(" "),r.words?t.concat(u):t}),[]),/\s$/.test(i)&&a.append(" "),t.replaceWith(a),{words:n,chars:s}}(t,e);var o=g(t.childNodes);if(o.length&&(C(t,"isSplit",!0),!A(t).isRoot)){t.style.display="inline-block",t.style.position="relative";var i=t.nextSibling,a=t.previousSibling,s=t.textContent||"",c=i?i.textContent:" ",u=a?a.textContent:" ";C(t,{isWordEnd:/\s$/.test(s)||/^\s/.test(c),isWordStart:/^\s/.test(s)||/\s$/.test(u)})}return o.reduce((function(t,n){var r=J(n,e),o=r.words,i=r.chars;return{words:[].concat(l(t.words),l(o)),chars:[].concat(l(t.chars),l(i))}}),r)}function K(t){A(t).isWord?(P(t),t.replaceWith.apply(t,l(t.childNodes))):g(t.children).forEach((function(t){return K(t)}))}function Q(t,e,n){var r,o,i,a=m(e.types),s=e.tagName,l=t.getElementsByTagName("*"),u=[],p=[],f=null,d=[],h=t.parentElement,y=t.nextElementSibling,b=document.createDocumentFragment(),v=window.getComputedStyle(t),w=v.textAlign,O=.2*parseFloat(v.fontSize);return e.absolute&&(i={left:t.offsetLeft,top:t.offsetTop,width:t.offsetWidth},o=t.offsetWidth,r=t.offsetHeight,C(t,{cssWidth:t.style.width,cssHeight:t.style.height})),g(l).forEach((function(r){var o=r.parentElement===t,i=function(t,e,n,r){if(!n.absolute)return{top:e?t.offsetTop:null};var o=t.offsetParent,i=c(r,2),a=i[0],s=i[1],l=0,u=0;if(o&&o!==document.body){var p=o.getBoundingClientRect();l=p.x+a,u=p.y+s}var f=t.getBoundingClientRect(),d=f.width,h=f.height,y=f.x;return{width:d,height:h,top:f.y+s-u,left:y+a-l}}(r,o,e,n),s=i.width,l=i.height,d=i.top,h=i.left;/^br$/i.test(r.nodeName)||(a.lines&&o&&((null===f||d-f>=O)&&(f=d,u.push(p=[])),p.push(r)),e.absolute&&C(r,{top:d,left:h,width:s,height:l}))})),h&&h.removeChild(t),a.lines&&(d=u.map((function(t){var n=_(s,{class:"".concat(e.splitClass," ").concat(e.lineClass),style:"display: block; text-align: ".concat(w,"; width: 100%;")});C(n,"isLine",!0);var r={height:0,top:1e4};return b.appendChild(n),t.forEach((function(t,e,o){var i=A(t),a=i.isWordEnd,s=i.top,c=i.height,l=o[e+1];r.height=Math.max(r.height,c),r.top=Math.min(r.top,s),n.appendChild(t),a&&A(l).isWordStart&&n.append(" ")})),e.absolute&&C(n,{height:r.height,top:r.top}),n})),a.words||K(b),t.replaceChildren(b)),e.absolute&&(t.style.width="".concat(t.style.width||o,"px"),t.style.height="".concat(r,"px"),g(l).forEach((function(t){var e=A(t),n=e.isLine,r=e.top,o=e.left,a=e.width,s=e.height,c=A(t.parentElement),l=!n&&c.isLine;t.style.top="".concat(l?r-c.top:r,"px"),t.style.left="".concat(n?i.left:o-(l?i.left:0),"px"),t.style.height="".concat(s,"px"),t.style.width="".concat(n?i.width:a,"px"),t.style.position="absolute"}))),h&&(y?h.insertBefore(t,y):h.appendChild(t)),d}var Z=f(G,{}),tt=function(){function t(e,n){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.isSplit=!1,this.settings=f(Z,y(n)),this.elements=w(e),this.split()}return o(t,null,[{key:"clearData",value:function(){Object.keys(S).forEach((function(t){delete S[t]}))}},{key:"setDefaults",value:function(t){return Z=f(Z,y(t)),G}},{key:"revert",value:function(t){w(t).forEach((function(t){var e=A(t),n=e.isSplit,r=e.html,o=e.cssWidth,i=e.cssHeight;n&&(t.innerHTML=r,t.style.width=o||"",t.style.height=i||"",P(t))}))}},{key:"create",value:function(e,n){return new t(e,n)}},{key:"data",get:function(){return S}},{key:"defaults",get:function(){return Z},set:function(t){Z=f(Z,y(t))}}]),o(t,[{key:"split",value:function(t){var e=this;this.revert(),this.elements.forEach((function(t){C(t,"html",t.innerHTML)})),this.lines=[],this.words=[],this.chars=[];var n=[window.pageXOffset,window.pageYOffset];void 0!==t&&(this.settings=f(this.settings,y(t)));var r=m(this.settings.types);r.none||(this.elements.forEach((function(t){C(t,"isRoot",!0);var n=J(t,e.settings),r=n.words,o=n.chars;e.words=[].concat(l(e.words),l(r)),e.chars=[].concat(l(e.chars),l(o))})),this.elements.forEach((function(t){if(r.lines||e.settings.absolute){var o=Q(t,e.settings,n);e.lines=[].concat(l(e.lines),l(o))}})),this.isSplit=!0,window.scrollTo(n[0],n[1]),O(S).forEach((function(t){var e=c(t,2),n=e[0],r=e[1],o=r.isRoot,i=r.isSplit;o&&i||(S[n]=null,delete S[n])})))}},{key:"revert",value:function(){this.isSplit&&(this.lines=null,this.words=null,this.chars=null,this.isSplit=!1),t.revert(this.elements)}}]),t}();function et(t,e){(null==e||e>t.length)&&(e=t.length);for(var n=0,r=Array(e);n<e;n++)r[n]=t[n];return r}function nt(t,e){var n,r={"lines&words":{types:"lines, words",splitType:"lines&words"},chars:{types:"lines, chars",splitType:"chars"},words:{types:"lines, words",splitType:"words"},lines:{types:"lines",splitType:"lines"}},o=(null===(n=Object.entries(r).find((function(t){var n,r,o=(n=t,r=1,function(t){if(Array.isArray(t))return t}(n)||function(t,e){var n=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=n){var r,o,i,a,s=[],c=!0,l=!1;try{if(i=(n=n.call(t)).next,0===e){if(Object(n)!==n)return;c=!1}else for(;!(c=(r=i.call(n)).done)&&(s.push(r.value),s.length!==e);c=!0);}catch(t){l=!0,o=t}finally{try{if(!c&&null!=n.return&&(a=n.return(),Object(a)!==a))return}finally{if(l)throw o}}return s}}(n,r)||function(t,e){if(t){if("string"==typeof t)return et(t,e);var n={}.toString.call(t).slice(8,-1);return"Object"===n&&t.constructor&&(n=t.constructor.name),"Map"===n||"Set"===n?Array.from(t):"Arguments"===n||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(n)?et(t,e):void 0}}(n,r)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}())[0];return e.startsWith(o)})))||void 0===n?void 0:n[1])||r.lines,i=o.types,a=o.splitType,s=new tt(t,{types:i});return s.lines&&e.includes("clip")&&s.lines.forEach((function(t){var e=document.createElement("div");e.classList.add("line-clip-wrapper"),t.parentNode.insertBefore(e,t),e.appendChild(t)})),{splitResult:s,splitType:a}}}}]);