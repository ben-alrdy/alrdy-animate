"use strict";(this.webpackChunkAlrdyAnimate=this.webpackChunkAlrdyAnimate||[]).push([[267],{701:(t,e,r)=>{function o(t){return function(t){if(Array.isArray(t))return a(t)}(t)||function(t){if("undefined"!=typeof Symbol&&null!=t[Symbol.iterator]||null!=t["@@iterator"])return Array.from(t)}(t)||function(t,e){if(t){if("string"==typeof t)return a(t,e);var r={}.toString.call(t).slice(8,-1);return"Object"===r&&t.constructor&&(r=t.constructor.name),"Map"===r||"Set"===r?Array.from(t):"Arguments"===r||/^(?:Ui|I)nt(?:8|16|32)(?:Clamped)?Array$/.test(r)?a(t,e):void 0}}(t)||function(){throw new TypeError("Invalid attempt to spread non-iterable instance.\nIn order to be iterable, non-array objects must have a [Symbol.iterator]() method.")}()}function a(t,e){(null==e||e>t.length)&&(e=t.length);for(var r=0,o=Array(e);r<e;r++)o[r]=t[r];return o}r.r(e),r.d(e,{createHoverAnimations:()=>u});var n={fromTop:{start:"M 0 100 V 0 Q 50 0 100 0 V 0 H 0 z",end:"M 0 100 V 100 Q 50 125 100 100 V 0 H 0 z"},fromBottom:{start:"M 0 100 V 100 Q 75 50 100 100 V 100 z",end:"M 0 100 V 0 Q 50 0 100 0 V 100 z"},toTop:{start:"M 0 100 V 100 Q 50 50 100 100 V 0 H 0 z",end:"M 0 100 V 0 Q 50 0 100 0 V 0 H 0 z"},toBottom:{start:"M 0 100 V 0 Q 50 50 100 0 V 100 z",end:"M 0 100 V 100 Q 50 100 100 100 V 100 z"},fromLeft:{start:"M 0 0 H 0 Q 0 50 0 100 H 0 V 0 z",end:"M 0 0 H 100 Q 110 50 100 100 H 0 V 0 z"},fromRight:{start:"M 100 0 H 100 Q 100 50 100 100 H 100 V 0 z",end:"M 100 0 H 0 Q -10 50 0 100 H 100 V 0 z"},toLeft:{start:"M 0 0 H 100 Q 75 50 100 100 H 0 V 0 z",end:"M 0 0 H 0 Q 0 50 0 100 H 0 V 0 z"},toRight:{start:"M 100 0 H 0 Q 25 50 0 100 H 100 V 0 z",end:"M 100 0 H 100 Q 100 50 100 100 H 100 V 0 z"}};function i(t,e){var r=e.getBoundingClientRect(),a={top:Math.abs(r.top-t.clientY),bottom:Math.abs(r.bottom-t.clientY),left:Math.abs(r.left-t.clientX),right:Math.abs(r.right-t.clientX)};return Object.keys(a).find((function(t){return a[t]===Math.min.apply(Math,o(Object.values(a)))}))}function l(t,e,r){var o=function(t,e){switch(e){case"all":return t;case"vertical":return["top","bottom"].includes(t)?t:"bottom";case"horizontal":return["left","right"].includes(t)?t:"left";case"bottom":default:return"bottom";case"top":return"top";case"left":return"left";case"right":return"right"}}(t,e);return"horizontal"!==e||["left","right"].includes(t)?"vertical"!==e||["top","bottom"].includes(t)||(o=r?"bottom":"top"):o=r?"left":"right",o}function c(t){var e={text:t.querySelectorAll("[aa-hover-text-color]"),background:t.querySelectorAll("[aa-hover-bg-color]")},r={text:[],background:[]};return e.text.length&&(r.text=Array.from(e.text).map((function(t){return window.getComputedStyle(t).color}))),e.background.length&&(r.background=Array.from(e.background).map((function(t){return window.getComputedStyle(t).backgroundColor}))),r}function s(t,e,r){t.querySelectorAll("[aa-hover-text-color]").forEach((function(t,o){var a,n=t.getAttribute("aa-hover-text-color"),i=null===(a=e.data)||void 0===a||null===(a=a.originalColors)||void 0===a||null===(a=a.text)||void 0===a?void 0:a[o];n&&i&&e.to(t,{color:r?n:i,overwrite:!0},0)})),t.querySelectorAll("[aa-hover-bg-color]").forEach((function(t,o){var a,n=t.getAttribute("aa-hover-bg-color"),i=null===(a=e.data)||void 0===a||null===(a=a.originalColors)||void 0===a||null===(a=a.background)||void 0===a?void 0:a[o];n&&i&&e.to(t,{backgroundColor:r?n:i,overwrite:!0},0)}))}function u(t,e){return{initializeHoverAnimations:function(){document.querySelectorAll("[aa-hover]").forEach((function(r){var a=r.getAttribute("aa-hover");if(a.startsWith("text-"))!function(t,e,r){var a=t.querySelector("[aa-hover-text]");if(a){var n=a.getBoundingClientRect().width,i=a.getBoundingClientRect().height,l=t.getAttribute("aa-hover").replace("-reverse",""),c=t.getAttribute("aa-hover").includes("reverse"),s=t.hasAttribute("aa-stagger")?parseFloat(t.getAttribute("aa-stagger")):.02,u=t.hasAttribute("aa-delay")?parseFloat(t.getAttribute("aa-delay")):0,d=t.hasAttribute("aa-duration")?parseFloat(t.getAttribute("aa-duration")):.3,f=t.getAttribute("aa-ease")||"power3.inOut",h=t.getAttribute("aa-split")||"chars",y=h.split(".")[0],g=a.cloneNode(!0);g.style.position="absolute",g.style.top="0",a.after(g);var p=r(a,h).splitResult,b=r(g,h).splitResult,v=p[y],m=b[y],x=e.timeline({defaults:{ease:f,duration:d,stagger:s},paused:!0});switch(l){case"text-slide-up":g.style.top="".concat(i,"px"),x.fromTo(v,{y:0},{y:-i}).fromTo(m,{y:0},{y:-i,delay:u},"<");break;case"text-slide-down":g.style.top="-".concat(i,"px"),x.fromTo(v,{y:0},{y:i}).fromTo(m,{y:0},{y:i,delay:u},"<");break;case"text-slide-left":g.style.left="".concat(n,"px"),x.fromTo(v,{x:0},{x:-n}).fromTo(m,{x:0},{x:-n,delay:u},"<");break;case"text-slide-right":g.style.left="-".concat(n,"px"),x.fromTo(o(v).reverse(),{x:0},{x:n}).fromTo(o(m).reverse(),{x:0},{x:n,delay:u},"<");break;case"text-fade-up":g.style.top="".concat(i/3,"px"),x.fromTo(v,{y:0,opacity:1},{y:-i/3,opacity:0}).fromTo(m,{y:0,opacity:0},{y:-i/3,opacity:1,delay:u},"<");break;case"text-fade-down":g.style.top="-".concat(i/3,"px"),x.fromTo(v,{y:0,opacity:1},{y:i/3,opacity:0}).fromTo(m,{y:0,opacity:0},{y:i/3,opacity:1,delay:u},"<");break;case"text-fade-left":g.style.left="".concat(n/3,"px"),x.fromTo(v,{x:0,opacity:1},{x:-n/3,opacity:0}).fromTo(m,{x:0,opacity:0},{x:-n/3,opacity:1,delay:u},"<");break;case"text-fade-right":g.style.left="-".concat(n/3,"px"),x.fromTo(o(v).reverse(),{x:0,opacity:1},{x:n/3,opacity:0}).fromTo(o(m).reverse(),{x:0,opacity:0},{x:n/3,opacity:1,delay:u},"<")}t.addEventListener("mouseenter",(function(){x.restart()})),t.addEventListener("mouseleave",(function(){c&&x.reverse()}))}}(r,t,e);else switch(a){case"bg-circle":!function(t,e){var r=t.querySelector("[aa-hover-bg]").querySelector("circle"),o=t.hasAttribute("aa-duration")?parseFloat(t.getAttribute("aa-duration")):1,a=t.getAttribute("aa-ease")||"power3.out",n=t.getAttribute("aa-hover-direction")||"all",u=t.getBoundingClientRect(),d=Math.sqrt(Math.pow(u.width,2)+Math.pow(u.height,2))/u.width*1.3,f=c(t);function h(c,h){var y=l(i(c,t),n,h),g=c.offsetX/u.width,p=c.offsetY/u.height;switch(y){case"left":g=-10/u.width;break;case"right":g=1+10/u.width;break;case"top":p=-10/u.height;break;case"bottom":p=1+10/u.height}r.setAttribute("cx",g),r.setAttribute("cy",p);var b=e.timeline({defaults:{duration:o,ease:a},data:{originalColors:f}});h?b.fromTo(r,{attr:{r:0}},{attr:{r:d}},0):b.to(r,{attr:{r:0}},0),s(t,b,h)}t.addEventListener("mouseenter",(function(t){return h(t,!0)})),t.addEventListener("mouseleave",(function(t){return h(t,!1)}))}(r,t);break;case"bg-curve":!function(t,e){var r=t.querySelector("[aa-hover-bg]").querySelector("path"),o=t.hasAttribute("aa-duration")?parseFloat(t.getAttribute("aa-duration")):.5,a=t.getAttribute("aa-ease")||"power3.out",u=t.getAttribute("aa-hover-direction")||"all",d=c(t);function f(n,i,l){var c=e.timeline({defaults:{duration:o,ease:a},data:{originalColors:d}});return c.fromTo(r,{attr:{d:n}},{attr:{d:i}}),s(t,c,l),c}t.addEventListener("mouseenter",(function(e){var r=l(i(e,t),u,!0),o={top:n.fromTop,bottom:n.fromBottom,left:n.fromLeft,right:n.fromRight},a=o[r]||o.bottom;f(a.start,a.end,!0)})),t.addEventListener("mouseleave",(function(e){var r=l(i(e,t),u,!1),o={top:n.toTop,bottom:n.toBottom,left:n.toLeft,right:n.toRight},a=o[r]||o.bottom;f(a.start,a.end,!1)}))}(r,t);break;case"bg-expand-reverse":case"bg-expand":!function(t,e){var r,o=t.querySelector("[aa-hover-bg]"),a=t.querySelector("[aa-hover-icon]"),n=t.getAttribute("aa-hover").includes("reverse");if(o){var i=t.getBoundingClientRect(),l=Math.sqrt(Math.pow(i.width,2)+Math.pow(i.height,2)),u=o.getBoundingClientRect(),d=Math.max(u.width,1);r=Math.ceil(l/d*2)}var f=t.hasAttribute("aa-duration")?parseFloat(t.getAttribute("aa-duration")):.5,h=t.getAttribute("aa-ease")||"power3.inOut",y=t.hasAttribute("aa-delay")?parseFloat(t.getAttribute("aa-delay")):.1,g=t.getAttribute("aa-hover-direction")||"right",p=c(t),b=function(){if(!a)return null;var t=a.cloneNode(!0);switch(t.style.position="absolute",a.after(t),g){case"right":default:return t.style.left="-100%",t.style.top="0",{icon:{xPercent:100},clone:{xPercent:100}};case"up-right":return t.style.left="-100%",t.style.top="100%",{icon:{xPercent:100,yPercent:-100},clone:{xPercent:100,yPercent:-100}};case"down-right":return t.style.left="-100%",t.style.top="-100%",{icon:{xPercent:100,yPercent:100},clone:{xPercent:100,yPercent:100}}}}();if(n){var v=e.timeline({defaults:{ease:h,duration:f},paused:!0,data:{originalColors:p}});s(t,v,!0),o&&v.to(o,{scale:r},0),b&&v.to(a,b.icon,0).to(a.nextElementSibling,b.clone,y),t.addEventListener("mouseenter",(function(){return v.play()})),t.addEventListener("mouseleave",(function(){return v.reverse()}))}else{var m=e.timeline({defaults:{ease:h,duration:f},paused:!0,data:{originalColors:p}}),x=e.timeline({defaults:{ease:h,duration:f},paused:!0,data:{originalColors:p}});if(s(t,m,!0),s(t,x,!1),o){var A=o.cloneNode(!0);A.style.position="absolute",A.style.top="0",A.style.left="0",A.style.transform="scale(0)",A.style.backgroundColor=window.getComputedStyle(t).backgroundColor,o.after(A),m.set(o,{scale:1},0).to(o,{scale:r},0),x.to(A,{scale:r,duration:.6*f,ease:"power2.in"}).set([o,A],{scale:0}).to(o,{scale:1,duration:.4*f,ease:"power2.out"})}b&&m.to(a,b.icon,0).to(a.nextElementSibling,b.clone,y),t.addEventListener("mouseenter",(function(){x.pause(0),m.restart()})),t.addEventListener("mouseleave",(function(){m.then((function(){return x.restart()}))}))}}(r,t)}}))}}}}}]);