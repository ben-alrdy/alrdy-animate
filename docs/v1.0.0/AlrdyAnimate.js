(()=>{"use strict";document.addEventListener("DOMContentLoaded",(()=>{const t=window.innerWidth<768,e=document.querySelectorAll("[aa-animate], [aa-transition]");window.CSS&&window.CSS.supports&&window.CSS.supports("--a","0")||e.forEach((t=>{const e=t.getAttribute("aa-duration")||"1s",n=t.getAttribute("aa-delay")||"0s";t.style.animationDuration=e,t.style.animationDelay=n})),"IntersectionObserver"in window?e.forEach((e=>{const n=e.getAttribute("aa-mobile"),a=e.getAttribute("aa-duration"),i=e.getAttribute("aa-delay"),o=e.getAttribute("aa-anchor");let r=e;a&&e.style.setProperty("--animation-duration",a),t&&"no-delay"===n?e.style.setProperty("--animation-delay","0s"):i&&e.style.setProperty("--animation-delay",i),o&&(r=document.querySelector(o));const s=e.getAttribute("aa-viewport");let d=s?parseFloat(s):.8;if(!isNaN(d)&&d>=0&&d<=1){const t=new IntersectionObserver((t=>{t.forEach((t=>{t.isIntersecting&&e.classList.add("in-view")}))}),{threshold:[0,1],rootMargin:`0px 0px -${100*(1-d)}% 0px`}),n=new IntersectionObserver((t=>{t.forEach((t=>{const n=t.target.getBoundingClientRect();!t.isIntersecting&&n.top>=window.innerHeight&&e.classList.remove("in-view")}))}),{threshold:0,rootMargin:"0px"});t.observe(r),n.observe(r)}})):e.forEach((t=>{t.classList.add("in-view")}))}))})();
//# sourceMappingURL=AlrdyAnimate.js.map