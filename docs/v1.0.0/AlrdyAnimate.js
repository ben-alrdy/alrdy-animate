(()=>{"use strict";const t={easing:"ease"},e={init:function(e={}){const n={...t,...e};document.body.setAttribute("aa-easing",n.easing),document.addEventListener("DOMContentLoaded",(()=>{const t=window.innerWidth<768;document.querySelectorAll("[aa-animate], [aa-transition]").forEach((e=>{const n=e.getAttribute("aa-mobile"),a=e.getAttribute("aa-duration"),i=e.getAttribute("aa-delay"),o=e.getAttribute("aa-color-initial"),r=e.getAttribute("aa-color-final"),s=e.getAttribute("aa-anchor");let c=e;a&&e.style.setProperty("--animation-duration",a),t&&"no-delay"===n?e.style.setProperty("--animation-delay","0s"):i&&e.style.setProperty("--animation-delay",i),o&&e.style.setProperty("--background-color-initial",o),r&&e.style.setProperty("--background-color-final",r),s&&(c=document.querySelector(s));const l=e.getAttribute("aa-viewport");let d=l?parseFloat(l):.8;if(!isNaN(d)&&d>=0&&d<=1){const t=new IntersectionObserver((t=>{t.forEach((t=>{t.isIntersecting&&t.target.classList.add("in-view")}))}),{threshold:[0,1],rootMargin:`0px 0px -${100*(1-d)}% 0px`}),e=new IntersectionObserver((t=>{t.forEach((t=>{const e=t.target.getBoundingClientRect();!t.isIntersecting&&e.top>=window.innerHeight&&t.target.classList.remove("in-view")}))}),{threshold:0,rootMargin:"0px"});t.observe(c),e.observe(c)}}))}))}};window.AlrdyAnimate=e})();