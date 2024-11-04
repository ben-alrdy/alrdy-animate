"use strict";(this.webpackChunkAlrdyAnimate=this.webpackChunkAlrdyAnimate||[]).push([[722],{933:(t,e,r)=>{r.r(e),r.d(e,{ScrollTrigger:()=>o.u,animations:()=>vt,gsap:()=>n.os,splitText:()=>pt});var n=r(700),o=r(575);function i(t){return i="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},i(t)}function a(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function c(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?a(Object(r),!0).forEach((function(e){s(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):a(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function s(t,e,r){return(e=function(t){var e=function(t){if("object"!=i(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var r=e.call(t,"string");if("object"!=i(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==i(e)?e:e+""}(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}var l=null,u=function(t){return{start:t?"top 40%":"top 80%",end:t?"top 20%":"top 40%"}};function p(t){return function(e,r,n,o,i,a,s,p,f){var d=u(p),y=function(t,e,r,n,o,i,a,s,u,p){var f,d=l.timeline(),y=c(c({duration:n,stagger:o,ease:a,delay:i},s&&{scrollTrigger:{trigger:t,start:u,end:p,scrub:s.includes("smooth")?2:!s.includes("snap")||{snap:.2}}}),{},{onStart:function(){return l.set(t,{autoAlpha:1})}});return f="lines&words"===r?function(t){e.lines.forEach((function(r,n){var i=e.words.filter((function(t){return r.contains(t)}));d.from(i,c(c({},y),t),n*o*3)}))}:e[r],{tl:d,baseProps:y,animationTarget:f}}(e,r,n,o,i,a,s,f,d.start,d.end),h=y.tl,b=y.baseProps,v=y.animationTarget;return"opacity"in t&&t.opacity>0||h.set(e,{autoAlpha:0}),"function"==typeof v?v(t):h.from(v,c(c({},b),t),">"),h}}function f(t,e){for(var r=0;r<e.length;r++){var n=e[r];n.enumerable=n.enumerable||!1,n.configurable=!0,"value"in n&&(n.writable=!0),Object.defineProperty(t,n.key,n)}}function d(t,e,r){return e&&f(t.prototype,e),r&&f(t,r),t}function y(t,e,r){return e in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}function h(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function b(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?h(Object(r),!0).forEach((function(e){y(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):h(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function v(t,e){return function(t){if(Array.isArray(t))return t}(t)||function(t,e){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t)){var r=[],n=!0,o=!1,i=void 0;try{for(var a,c=t[Symbol.iterator]();!(n=(a=c.next()).done)&&(r.push(a.value),!e||r.length!==e);n=!0);}catch(t){o=!0,i=t}finally{try{n||null==c.return||c.return()}finally{if(o)throw i}}return r}}(t,e)||m(t,e)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function g(t){return function(t){if(Array.isArray(t))return w(t)}(t)||function(t){if("undefined"!=typeof Symbol&&Symbol.iterator in Object(t))return Array.from(t)}(t)||m(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function m(t,e){if(t){if("string"==typeof t)return w(t,e);var r=Object.prototype.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?w(t,e):void 0}}function w(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=new Array(e);r<e;r++)n[r]=t[r];return n}function O(t,e){return Object.getOwnPropertyNames(Object(t)).reduce((function(r,n){var o=Object.getOwnPropertyDescriptor(Object(t),n),i=Object.getOwnPropertyDescriptor(Object(e),n);return Object.defineProperty(r,n,i||o)}),{})}function S(t){return"string"==typeof t}function j(t){return Array.isArray(t)}function E(){var t,e=arguments.length>0&&void 0!==arguments[0]?arguments[0]:{},r=O(e);return void 0!==r.types?t=r.types:void 0!==r.split&&(t=r.split),void 0!==t&&(r.types=(S(t)||j(t)?String(t):"").split(",").map((function(t){return String(t).trim()})).filter((function(t){return/((line)|(word)|(char))/i.test(t)}))),(r.absolute||r.position)&&(r.absolute=r.absolute||/absolute/.test(e.position)),r}function C(t){var e=S(t)||j(t)?String(t):"";return{none:!e,lines:/line/i.test(e),words:/word/i.test(e),chars:/char/i.test(e)}}function P(t){return null!==t&&"object"==typeof t}function T(t){return P(t)&&/^(1|3|11)$/.test(t.nodeType)}function A(t){return j(t)?t:null==t?[]:function(t){return P(t)&&function(t){return"number"==typeof t&&t>-1&&t%1==0}(t.length)}(t)?Array.prototype.slice.call(t):[t]}function x(t){var e=t;return S(t)&&(e=/^(#[a-z]\w+)$/.test(t.trim())?document.getElementById(t.trim().slice(1)):document.querySelectorAll(t)),A(e).reduce((function(t,e){return[].concat(g(t),g(A(e).filter(T)))}),[])}!function(){function t(){for(var t=arguments.length,e=0;e<t;e++){var r=e<0||arguments.length<=e?void 0:arguments[e];1===r.nodeType||11===r.nodeType?this.appendChild(r):this.appendChild(document.createTextNode(String(r)))}}function e(){for(;this.lastChild;)this.removeChild(this.lastChild);arguments.length&&this.append.apply(this,arguments)}function r(){for(var t=this.parentNode,e=arguments.length,r=new Array(e),n=0;n<e;n++)r[n]=arguments[n];var o=r.length;if(t)for(o||t.removeChild(this);o--;){var i=r[o];"object"!=typeof i?i=this.ownerDocument.createTextNode(i):i.parentNode&&i.parentNode.removeChild(i),o?t.insertBefore(this.previousSibling,i):t.replaceChild(i,this)}}"undefined"!=typeof Element&&(Element.prototype.append||(Element.prototype.append=t,DocumentFragment.prototype.append=t),Element.prototype.replaceChildren||(Element.prototype.replaceChildren=e,DocumentFragment.prototype.replaceChildren=e),Element.prototype.replaceWith||(Element.prototype.replaceWith=r,DocumentFragment.prototype.replaceWith=r))}();var k=Object.entries,D="_splittype",W={},N=0;function I(t,e,r){if(!P(t))return console.warn("[data.set] owner is not an object"),null;var n=t[D]||(t[D]=++N),o=W[n]||(W[n]={});return void 0===r?e&&Object.getPrototypeOf(e)===Object.prototype&&(W[n]=b(b({},o),e)):void 0!==e&&(o[e]=r),r}function L(t,e){var r=P(t)?t[D]:null,n=r&&W[r]||{};return void 0===e?n:n[e]}function B(t){var e=t&&t[D];e&&(delete t[e],delete W[e])}var R="\\ud800-\\udfff",F="\\u0300-\\u036f\\ufe20-\\ufe23",$="\\u20d0-\\u20f0",M="\\ufe0e\\ufe0f",H="[".concat(R,"]"),U="[".concat(F).concat($,"]"),z="\\ud83c[\\udffb-\\udfff]",X="(?:".concat(U,"|").concat(z,")"),V="[^".concat(R,"]"),q="(?:\\ud83c[\\udde6-\\uddff]){2}",G="[\\ud800-\\udbff][\\udc00-\\udfff]",Y="\\u200d",_="".concat(X,"?"),J="[".concat(M,"]?"),K=J+_+"(?:"+Y+"(?:"+[V,q,G].join("|")+")"+J+_+")*",Q="(?:".concat(["".concat(V).concat(U,"?"),U,q,G,H].join("|"),"\n)"),Z=RegExp("".concat(z,"(?=").concat(z,")|").concat(Q).concat(K),"g"),tt=RegExp("[".concat([Y,R,F,$,M].join(""),"]"));function et(t){return tt.test(t)}function rt(t){var e,r=arguments.length>1&&void 0!==arguments[1]?arguments[1]:"";return(t=null==(e=t)?"":String(e))&&S(t)&&!r&&et(t)?function(t){return et(t)?function(t){return t.match(Z)||[]}(t):function(t){return t.split("")}(t)}(t):t.split(r)}function nt(t,e){var r=document.createElement(t);return e?(Object.keys(e).forEach((function(t){var n=e[t],o=S(n)?n.trim():n;null!==o&&""!==o&&("children"===t?r.append.apply(r,g(A(o))):r.setAttribute(t,o))})),r):r}var ot={splitClass:"",lineClass:"line",wordClass:"word",charClass:"char",types:["lines","words","chars"],absolute:!1,tagName:"div"};function it(t,e){var r=t.nodeType,n={words:[],chars:[]};if(!/(1|3|11)/.test(r))return n;if(3===r&&/\S/.test(t.nodeValue))return function(t,e){var r,n=C((e=O(ot,e)).types),o=e.tagName,i=t.nodeValue,a=document.createDocumentFragment(),c=[];return/^\s/.test(i)&&a.append(" "),r=function(t){var e=arguments.length>1&&void 0!==arguments[1]?arguments[1]:" ";return(t?String(t):"").trim().replace(/\s+/g," ").split(e)}(i).reduce((function(t,r,i,s){var l,u;return n.chars&&(u=rt(r).map((function(t){var r=nt(o,{class:"".concat(e.splitClass," ").concat(e.charClass),style:"display: inline-block;",children:t});return I(r,"isChar",!0),c=[].concat(g(c),[r]),r}))),n.words||n.lines?(I(l=nt(o,{class:"".concat(e.wordClass," ").concat(e.splitClass),style:"display: inline-block; ".concat(n.words&&e.absolute?"position: relative;":""),children:n.chars?u:r}),{isWord:!0,isWordStart:!0,isWordEnd:!0}),a.appendChild(l)):u.forEach((function(t){a.appendChild(t)})),i<s.length-1&&a.append(" "),n.words?t.concat(l):t}),[]),/\s$/.test(i)&&a.append(" "),t.replaceWith(a),{words:r,chars:c}}(t,e);var o=A(t.childNodes);if(o.length&&(I(t,"isSplit",!0),!L(t).isRoot)){t.style.display="inline-block",t.style.position="relative";var i=t.nextSibling,a=t.previousSibling,c=t.textContent||"",s=i?i.textContent:" ",l=a?a.textContent:" ";I(t,{isWordEnd:/\s$/.test(c)||/^\s/.test(s),isWordStart:/^\s/.test(c)||/\s$/.test(l)})}return o.reduce((function(t,r){var n=it(r,e),o=n.words,i=n.chars;return{words:[].concat(g(t.words),g(o)),chars:[].concat(g(t.chars),g(i))}}),n)}function at(t){L(t).isWord?(B(t),t.replaceWith.apply(t,g(t.childNodes))):A(t.children).forEach((function(t){return at(t)}))}function ct(t,e,r){var n,o,i,a=C(e.types),c=e.tagName,s=t.getElementsByTagName("*"),l=[],u=[],p=null,f=[],d=t.parentElement,y=t.nextElementSibling,h=document.createDocumentFragment(),b=window.getComputedStyle(t),g=b.textAlign,m=.2*parseFloat(b.fontSize);return e.absolute&&(i={left:t.offsetLeft,top:t.offsetTop,width:t.offsetWidth},o=t.offsetWidth,n=t.offsetHeight,I(t,{cssWidth:t.style.width,cssHeight:t.style.height})),A(s).forEach((function(n){var o=n.parentElement===t,i=function(t,e,r,n){if(!r.absolute)return{top:e?t.offsetTop:null};var o=t.offsetParent,i=v(n,2),a=i[0],c=i[1],s=0,l=0;if(o&&o!==document.body){var u=o.getBoundingClientRect();s=u.x+a,l=u.y+c}var p=t.getBoundingClientRect(),f=p.width,d=p.height,y=p.x;return{width:f,height:d,top:p.y+c-l,left:y+a-s}}(n,o,e,r),c=i.width,s=i.height,f=i.top,d=i.left;/^br$/i.test(n.nodeName)||(a.lines&&o&&((null===p||f-p>=m)&&(p=f,l.push(u=[])),u.push(n)),e.absolute&&I(n,{top:f,left:d,width:c,height:s}))})),d&&d.removeChild(t),a.lines&&(f=l.map((function(t){var r=nt(c,{class:"".concat(e.splitClass," ").concat(e.lineClass),style:"display: block; text-align: ".concat(g,"; width: 100%;")});I(r,"isLine",!0);var n={height:0,top:1e4};return h.appendChild(r),t.forEach((function(t,e,o){var i=L(t),a=i.isWordEnd,c=i.top,s=i.height,l=o[e+1];n.height=Math.max(n.height,s),n.top=Math.min(n.top,c),r.appendChild(t),a&&L(l).isWordStart&&r.append(" ")})),e.absolute&&I(r,{height:n.height,top:n.top}),r})),a.words||at(h),t.replaceChildren(h)),e.absolute&&(t.style.width="".concat(t.style.width||o,"px"),t.style.height="".concat(n,"px"),A(s).forEach((function(t){var e=L(t),r=e.isLine,n=e.top,o=e.left,a=e.width,c=e.height,s=L(t.parentElement),l=!r&&s.isLine;t.style.top="".concat(l?n-s.top:n,"px"),t.style.left="".concat(r?i.left:o-(l?i.left:0),"px"),t.style.height="".concat(c,"px"),t.style.width="".concat(r?i.width:a,"px"),t.style.position="absolute"}))),d&&(y?d.insertBefore(t,y):d.appendChild(t)),f}var st=O(ot,{}),lt=function(){function t(e,r){!function(t,e){if(!(t instanceof e))throw new TypeError("Cannot call a class as a function")}(this,t),this.isSplit=!1,this.settings=O(st,E(r)),this.elements=x(e),this.split()}return d(t,null,[{key:"clearData",value:function(){Object.keys(W).forEach((function(t){delete W[t]}))}},{key:"setDefaults",value:function(t){return st=O(st,E(t)),ot}},{key:"revert",value:function(t){x(t).forEach((function(t){var e=L(t),r=e.isSplit,n=e.html,o=e.cssWidth,i=e.cssHeight;r&&(t.innerHTML=n,t.style.width=o||"",t.style.height=i||"",B(t))}))}},{key:"create",value:function(e,r){return new t(e,r)}},{key:"data",get:function(){return W}},{key:"defaults",get:function(){return st},set:function(t){st=O(st,E(t))}}]),d(t,[{key:"split",value:function(t){var e=this;this.revert(),this.elements.forEach((function(t){I(t,"html",t.innerHTML)})),this.lines=[],this.words=[],this.chars=[];var r=[window.pageXOffset,window.pageYOffset];void 0!==t&&(this.settings=O(this.settings,E(t)));var n=C(this.settings.types);n.none||(this.elements.forEach((function(t){I(t,"isRoot",!0);var r=it(t,e.settings),n=r.words,o=r.chars;e.words=[].concat(g(e.words),g(n)),e.chars=[].concat(g(e.chars),g(o))})),this.elements.forEach((function(t){if(n.lines||e.settings.absolute){var o=ct(t,e.settings,r);e.lines=[].concat(g(e.lines),g(o))}})),this.isSplit=!0,window.scrollTo(r[0],r[1]),k(W).forEach((function(t){var e=v(t,2),r=e[0],n=e[1],o=n.isRoot,i=n.isSplit;o&&i||(W[r]=null,delete W[r])})))}},{key:"revert",value:function(){this.isSplit&&(this.lines=null,this.words=null,this.chars=null,this.isSplit=!1),t.revert(this.elements)}}]),t}();function ut(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,n=Array(e);r<e;r++)n[r]=t[r];return n}function pt(t,e){var r,n={"lines&words":{types:"lines, words",splitType:"lines&words"},chars:{types:"lines, words, chars",splitType:"chars"},words:{types:"lines, words",splitType:"words"},lines:{types:"lines",splitType:"lines"}},o=(null===(r=Object.entries(n).find((function(t){var r,n,o=(r=t,n=1,function(t){if(Array.isArray(t))return t}(r)||function(t,e){var r=null==t?null:"undefined"!=typeof Symbol&&t[Symbol.iterator]||t["@@iterator"];if(null!=r){var n,o,i,a,c=[],s=!0,l=!1;try{if(i=(r=r.call(t)).next,0===e){if(Object(r)!==r)return;s=!1}else for(;!(s=(n=i.call(r)).done)&&(c.push(n.value),c.length!==e);s=!0);}catch(t){l=!0,o=t}finally{try{if(!s&&null!=r.return&&(a=r.return(),Object(a)!==a))return}finally{if(l)throw o}}return c}}(r,n)||function(t,e){if(t){if("string"==typeof t)return ut(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?ut(t,e):void 0}}(r,n)||function(){throw new TypeError("Invalid attempt to destructure non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}())[0];return e.startsWith(o)})))||void 0===r?void 0:r[1])||n.lines,i=o.types,a=o.splitType,c=new lt(t,{types:i});return c.lines&&e.includes("clip")&&c.lines.forEach((function(t){var e=document.createElement("div");e.classList.add("line-clip-wrapper"),t.parentNode.insertBefore(e,t),e.appendChild(t)})),{splitResult:c,splitType:a}}function ft(t){return ft="function"==typeof Symbol&&"symbol"==typeof Symbol.iterator?function(t){return typeof t}:function(t){return t&&"function"==typeof Symbol&&t.constructor===Symbol&&t!==Symbol.prototype?"symbol":typeof t},ft(t)}function dt(t,e){var r=Object.keys(t);if(Object.getOwnPropertySymbols){var n=Object.getOwnPropertySymbols(t);e&&(n=n.filter((function(e){return Object.getOwnPropertyDescriptor(t,e).enumerable}))),r.push.apply(r,n)}return r}function yt(t){for(var e=1;e<arguments.length;e++){var r=null!=arguments[e]?arguments[e]:{};e%2?dt(Object(r),!0).forEach((function(e){ht(t,e,r[e])})):Object.getOwnPropertyDescriptors?Object.defineProperties(t,Object.getOwnPropertyDescriptors(r)):dt(Object(r)).forEach((function(e){Object.defineProperty(t,e,Object.getOwnPropertyDescriptor(r,e))}))}return t}function ht(t,e,r){return(e=function(t){var e=function(t){if("object"!=ft(t)||!t)return t;var e=t[Symbol.toPrimitive];if(void 0!==e){var r=e.call(t,"string");if("object"!=ft(r))return r;throw new TypeError("@@toPrimitive must return a primitive value.")}return String(t)}(t);return"symbol"==ft(e)?e:e+""}(e))in t?Object.defineProperty(t,e,{value:r,enumerable:!0,configurable:!0,writable:!0}):t[e]=r,t}console.log("Initial GSAP:",n.os.version),console.log("Initial ScrollTrigger:",o.u),n.os.registerPlugin(o.u),console.log("ScrollTrigger registered:",n.os.plugins.ScrollTrigger);var bt,vt=yt(yt({},(bt=n.os,o.u,l=bt,{textSlideUp:p({y:"110%",opacity:0}),textSlideDown:p({y:"-110%",opacity:0}),textTiltUp:p({y:"110%",opacity:0,rotation:10}),textTiltDown:p({y:"-110%",opacity:0,rotation:-10}),textFade:p({opacity:.3}),textAppear:p({opacity:0}),textRotateSoft:function(t,e,r,n,o,i,a,s,p){var f=e[r]||e.lines,d=l.timeline(),y=u(s),h=y.start,b=y.end,v=window.getComputedStyle(t),g=5*parseFloat(v.fontSize);return f.forEach((function(t){var e=document.createElement("div");e.classList.add("line-perspective-wrapper"),t.parentNode.insertBefore(e,t),e.appendChild(t)})),d.set(t,{autoAlpha:0}),d.set(".line-perspective-wrapper",{transformStyle:"preserve-3d",perspective:g}),d.set(f,{transformOrigin:"50% 0%"}),d.from(f,c(c({autoAlpha:0,rotateX:-90,y:"100%",scaleX:.75,duration:n,stagger:o,ease:a,delay:i},p&&{scrollTrigger:{trigger:t,start:h,end:b,scrub:p.includes("smooth")?2:!p.includes("snap")||{snap:.2}}}),{},{onStart:function(){return l.set(t,{autoAlpha:1})}})),d}})),function(t,e){return{stickyNav:function(r,n,o){var i=!0,a=0,c=function(){i=!0,t.to(r,{y:"0%",duration:o,ease:n,overwrite:!0})};e.create({start:"top top",end:"max",onUpdate:function(e){var s=e.scroll();if(s<=10)return c(),void(a=s);var l=s-a;Math.abs(l)>20&&(l>0&&i?(i=!1,t.to(r,{y:"-100%",duration:2*o,ease:n,overwrite:!0})):l<0&&!i&&c(),a=s)},onLeaveBack:c,onLeave:c})}}}(n.os,o.u))}}]);