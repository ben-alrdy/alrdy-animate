"use strict";(this.webpackChunkAlrdyAnimate=this.webpackChunkAlrdyAnimate||[]).push([[704],{280:(e,t,n)=>{function r(e,t){var n=new Set;function r(n,r){var o;return n=e.utils.toArray(n),r=r||{},e.context((function(){var a,i,s,u=r.onChange,l=0,d=e.timeline({repeat:r.repeat,onUpdate:u&&function(){var e=d.closestIndex();l!==e&&(l=e,u(n[e],e))},paused:r.paused,defaults:{ease:"none"},onReverseComplete:function(){return d.totalTime(d.rawTime()+100*d.duration())}}),c=n.length,p=n[0].offsetLeft,f=[],g=[],v=[],h=[],m=0,y=!1,x=r.center,w=100*(r.speed||1),b=!1===r.snap?function(e){return e}:e.utils.snap(r.snap||1),T=0,C=!0===x?n[0].parentNode:e.utils.toArray(x)[0]||n[0].parentNode,P=function(){var t,o=C.getBoundingClientRect();n.forEach((function(n,r){g[r]=parseFloat(e.getProperty(n,"width","px")),h[r]=b(parseFloat(e.getProperty(n,"x","px"))/g[r]*100+e.getProperty(n,"xPercent")),t=n.getBoundingClientRect(),v[r]=t.left-(r?o.right:o.left),o=t})),e.set(n,{xPercent:function(e){return h[e]}}),a=n[c-1].offsetLeft+h[c-1]/100*g[c-1]-p+n[c-1].offsetWidth*e.getProperty(n[c-1],"scaleX")+(parseFloat(r.paddingRight)||0)},I=function(){T=x?d.duration()*(C.offsetWidth/2)/a:0,x&&f.forEach((function(e,t){f[t]=i(d.labels["label"+t]+d.duration()*g[t]/2/a-T)}))},R=function(e,t,n){for(var r,o=e.length,a=1e10,i=0;o--;)(r=Math.abs(e[o]-t))>n/2&&(r=n-r),r<a&&(a=r,i=o);return i},E=function(){var t,r,o,s,u;for(d.clear(),t=0;t<c;t++)r=n[t],o=h[t]/100*g[t],u=(s=r.offsetLeft+o-p+v[0])+g[t]*e.getProperty(r,"scaleX"),d.to(r,{xPercent:b((o-u)/g[t]*100),duration:u/w},0).fromTo(r,{xPercent:b((o-u+a)/g[t]*100)},{xPercent:h[t],duration:(o-u+a-o)/w,immediateRender:!1},u/w).add("label"+t,s/w),f[t]=s/w;i=e.utils.wrap(0,d.duration())};function N(t,n){n=n||{},Math.abs(t-m)>c/2&&(t+=t>m?-c:c);var r=e.utils.wrap(0,c,t),o=f[r];return o>d.time()!=t>m&&t!==m&&(o+=d.duration()*(t>m?1:-1)),(o<0||o>d.duration())&&(n.modifiers={time:i}),m=r,n.overwrite=!0,e.killTweensOf(s),0===n.duration?d.time(i(o)):d.tweenTo(o,n)}if(e.set(n,{x:0}),P(),E(),I(),d.toIndex=function(e,t){return N(e,t)},d.closestIndex=function(e){var t=R(f,d.time(),d.duration());return e&&(m=t,y=!1),t},d.current=function(){return y?d.closestIndex(!0):m},d.next=function(e){return N(d.current()+1,e)},d.previous=function(e){return N(d.current()-1,e)},d.times=f,d.progress(1,!0).progress(0,!0),r.reversed&&(d.vars.onReverseComplete(),d.reverse()),r.draggable&&"function"==typeof t){s=document.createElement("div");var k,A,S,B,D,M,_=e.utils.wrap(0,1),L=function(){return d.progress(_(A+(S.startX-S.x)*k))},X=function(){return d.closestIndex(!0)};S=t.create(s,{trigger:n[0].parentNode,type:"x",onPressInit:function(){var t,n,r=this.x;e.killTweensOf(d),M=!d.paused(),d.pause(),A=d.progress(),n=d.progress(),d.progress(0,!0),P(),t&&E(),I(),t&&d.draggable?d.time(f[m],!0):d.progress(n,!0),D=A/-(k=1/a)-r,e.set(s,{x:A/-k}),this.lastX=this.pointerX,this.isVerticalDrag=!1},onDrag:function(){var e=Math.abs(this.pointerX-this.lastX);this.lastX=this.pointerX,e<.5&&(this.isVerticalDrag=!0),console.log("Drag detection:",{deltaX:e,isVertical:this.isVerticalDrag}),L()},onThrowUpdate:L,overshootTolerance:0,inertia:!0,throwResistance:3e3,maxDuration:1,minDuration:.3,snap:function(e){if(this.isVerticalDrag)return console.log("Vertical drag detected, skipping snap"),this.x;if(Math.abs(A/-k-this.x)<10)return B+D;var t=-e*k*d.duration(),n=i(t),r=f[R(f,n,d.duration())]-n;return Math.abs(r)>d.duration()/2&&(r+=r<0?d.duration():-d.duration()),B=(t+r)/d.duration()/-k},onRelease:function(){X(),S.isThrowing&&(y=!0),r.reversed&&d.reversed(!0)},onThrowComplete:function(){X(),M&&d.play(),r.reversed&&d.reversed(!0)}})[0],d.draggable=S}d.closestIndex(!0),r.center&&N(0,{duration:0}),l=m,u&&u(n[m],m),o=d})),o}function o(n,r){var o;return n=e.utils.toArray(n),r=r||{},e.context((function(){var a,i,s,u=r.onChange,l=0,d=e.timeline({repeat:r.repeat,onUpdate:u&&function(){var e=d.closestIndex();l!==e&&(l=e,u(n[e],e))},paused:r.paused,defaults:{ease:"none"},onReverseComplete:function(){return d.totalTime(d.rawTime()+100*d.duration())}}),c=n.length,p=n[0].offsetTop,f=[],g=[],v=[],h=[],m=0,y=r.center,x=100*(r.speed||1),w=!1===r.snap?function(e){return e}:e.utils.snap(r.snap||1),b=0,T=!0===y?n[0].parentNode:e.utils.toArray(y)[0]||n[0].parentNode,C=function(){var t,o=T.getBoundingClientRect();p=n[0].offsetTop,n.forEach((function(n,r){g[r]=parseFloat(e.getProperty(n,"height","px")),h[r]=w(parseFloat(e.getProperty(n,"y","px"))/g[r]*100+e.getProperty(n,"yPercent")),t=n.getBoundingClientRect(),v[r]=t.top-(r?o.bottom:o.top),o=t})),e.set(n,{yPercent:function(e){return h[e]}}),a=n[c-1].offsetTop+h[c-1]/100*g[c-1]-p+n[c-1].offsetHeight*e.getProperty(n[c-1],"scaleY")+(parseFloat(r.paddingBottom)||0)},P=function(){b=y?d.duration()*(T.offsetHeight/2)/a:0,y&&f.forEach((function(e,t){f[t]=i(d.labels["label"+t]+d.duration()*g[t]/2/a-b)}))},I=function(e,t,n){for(var r,o=e.length,a=1e10,i=0;o--;)(r=Math.abs(e[o]-t))>n/2&&(r=n-r),r<a&&(a=r,i=o);return i},R=function(){var t,r,o,s,u;for(d.clear(),t=0;t<c;t++)r=n[t],o=h[t]/100*g[t],u=(s=r.offsetTop+o-p+v[0])+g[t]*e.getProperty(r,"scaleY"),d.to(r,{yPercent:w((o-u)/g[t]*100),duration:u/x},0).fromTo(r,{yPercent:w((o-u+a)/g[t]*100)},{yPercent:h[t],duration:(o-u+a-o)/x,immediateRender:!1},u/x).add("label"+t,s/x),f[t]=s/x;i=e.utils.wrap(0,d.duration())},E=function(){var e=r,t=e.enterAnimation,o=e.leaveAnimation,a=d.duration()/n.length;n.forEach((function(e,n){var r=t&&t(e,a,n),s=r&&d.duration()-i(f[n]-Math.min(a,r.duration()))<a-.05;r&&d.add(r,s?0:i(f[n]-r.duration())),r=o&&o(e,a,n),s=f[n]===d.duration(),r&&r.duration()>a&&r.duration(a),r&&d.add(r,s?0:f[n])}))};function N(t,n){n=n||{},Math.abs(t-m)>c/2&&(t+=t>m?-c:c);var r=e.utils.wrap(0,c,t),o=f[r];return o>d.time()!=t>m&&(o+=d.duration()*(t>m?1:-1)),(o<0||o>d.duration())&&(n.modifiers={time:i}),m=r,n.overwrite=!0,e.killTweensOf(s),0===n.duration?d.time(i(o)):d.tweenTo(o,n)}if(e.set(n,{y:0}),C(),R(),P(),E(),d.elements=n,d.next=function(e){return N(m+1,e)},d.previous=function(e){return N(m-1,e)},d.current=function(){return m},d.toIndex=function(e,t){return N(e,t)},d.closestIndex=function(e){var t=I(f,d.time(),d.duration());return e&&(m=t),t},d.times=f,d.progress(1,!0).progress(0,!0),r.reversed&&(d.vars.onReverseComplete(),d.reverse()),r.draggable&&"function"==typeof t){s=document.createElement("div");var k,A,S,B,D,M,_=e.utils.wrap(0,1),L=function(){return d.progress(_(A+(S.startY-S.y)*k))},X=function(){return d.closestIndex(!0)};S=t.create(s,{trigger:n[0].parentNode,type:"y",onPressInit:function(){var t,n,r=this.y;e.killTweensOf(d),B=!d.paused(),d.pause(),A=d.progress(),n=d.progress(),d.progress(0,!0),C(),t&&R(),P(),E(),t&&d.draggable?d.time(f[m],!0):d.progress(n,!0),M=A/-(k=1/a)-r,e.set(s,{y:A/-k})},onDrag:L,onThrowUpdate:L,overshootTolerance:0,inertia:!0,throwResistance:2e3,maxDuration:3,snap:function(e){if(Math.abs(A/-k-this.y)<10)return D+M;var t=-e*k*d.duration(),n=i(t),r=f[I(f,n,d.duration())]-n;return Math.abs(r)>d.duration()/2&&(r+=r<0?d.duration():-d.duration()),D=(t+r)/d.duration()/-k},onRelease:function(){X(),S.isThrowing,r.reversed&&d.reversed(!0)},onThrowComplete:function(){X(),B&&d.play(),r.reversed&&d.reversed(!0)}})[0],d.draggable=S}d.closestIndex(!0),r.center&&N(0,{duration:0}),l=m,u&&u(n[m],m),o=d})),o}function a(t,n){var r=arguments.length>2&&void 0!==arguments[2]?arguments[2]:null,o={onPressInit:t.draggable.vars.onPressInit,onRelease:t.draggable.vars.onRelease,onThrowComplete:t.draggable.vars.onThrowComplete};n.includes("draggable")&&(n.includes("loop")||n.includes("snap"))&&(t.draggable.vars.onPressInit=function(){t.paused()&&!r&&t.play()},t.draggable.vars.onDragStart=function(){o.onPressInit&&o.onPressInit.call(this),t.pause(),r&&(e.killTweensOf(t.moveToNext),e.killTweensOf(t.startSnapCycle))},t.draggable.vars.onThrowComplete=function(){o.onThrowComplete&&o.onThrowComplete.call(this),r?r():t.play()})}return{slider:function(t,i,s,u,l){return function(t,i){var s=arguments.length>2&&void 0!==arguments[2]?arguments[2]:1,u=arguments.length>3&&void 0!==arguments[3]?arguments[3]:"power2.inOut",l=arguments.length>4&&void 0!==arguments[4]?arguments[4]:2,d=e.utils.toArray("[aa-slider-item]",t);if(0!==d.length){var c=function(e,t,n){var r={speed:n,repeat:-1,center:!1,paused:!0,snap:!0},o=e.querySelector("[aa-slider-item]"),a=parseFloat(window.getComputedStyle(o.parentElement).gap)||0;return t.includes("vertical")?r.paddingBottom=a:r.paddingRight=a,t.includes("draggable")&&(r.draggable=!0),t.includes("loop")&&(r.paused=!1),t.includes("reverse")&&(r.reversed=!0),t.includes("center")&&(r.center=!0),r}(t,i,s);!function(e,t,n){var r=t.length,o=e.querySelector("[aa-slider-next]"),a=e.querySelector("[aa-slider-prev]"),i=e.querySelector("[aa-slider-current]"),s=e.querySelector("[aa-slider-total]");s&&(s.textContent=r<10?"0".concat(r):r),n.onChange=function(e,t){var n=e.parentElement.querySelector(".active");if(n&&n.classList.remove("active"),e.classList.add("active"),i){var o=(t%r+r)%r;i.textContent=o+1<10?"0".concat(o+1):o+1}},e._sliderNav={nextButton:o,prevButton:a,currentElement:i,totalElement:s}}(t,d,c);var p=i.includes("vertical")?o(d,c):r(d,c);return t._loop=p,n.add(t),function(t,n,r,o,a,i,s){if(t._sliderNav){var u=t._sliderNav,l=u.nextButton,d=u.prevButton,c=function(t){r[t]({ease:a,duration:o,onComplete:function(){i.paused||e.delayedCall(1,(function(){r.resume()}))}})};l&&l.addEventListener("click",(function(){return c("next")})),d&&d.addEventListener("click",(function(){return c("previous")}))}s.includes("loop")||s.includes("snap")||window.matchMedia("(hover: none)").matches||n.forEach((function(e,n){e.addEventListener("click",(function(){t._loop.toIndex(n,{ease:a,duration:o})}))}))}(t,d,p,s,u,c,i),i.includes("snap")?function(t,n,r,o,i){var s=function(){var e=n.includes("reverse")?"previous":"next";t[e]({duration:r,ease:o,onComplete:u})},u=function(){e.delayedCall(i,s)};t.toIndex(0,{duration:0}),n.includes("reverse")&&t.pause(),e.delayedCall(.01,u),t.moveToNext=s,t.startSnapCycle=u,t.draggable&&a(t,n,u)}(p,i,s,u,l):i.includes("draggable")&&a(p,i),p}console.warn("No items found with [aa-slider-item] attribute.")}(t,i,s,u,l)},cleanupLoops:function(){n.forEach((function(t){if(t._loop){var n=t.querySelectorAll("[aa-slider-item]");if(e.killTweensOf(n),t._loop.kill(),t._loop=null,e.set(n,{clearProps:"all"}),n.forEach((function(e){return e.classList.remove("active")})),t._sliderNav){var r=t._sliderNav,o=r.nextButton,a=r.prevButton;o&&o.replaceWith(o.cloneNode(!0)),a&&a.replaceWith(a.cloneNode(!0)),t._sliderNav=null}}})),n.clear()}}}n.r(t),n.d(t,{createSliderAnimations:()=>r})}}]);