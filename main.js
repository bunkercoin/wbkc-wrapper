"use strict";const polygonRegex=/^[0-9a-zA-Z]{40,40}/g,submit_buttons=document.querySelectorAll("#submit");submit_buttons.forEach(async t=>{var e=t.parentElement?.id;"1"===e&&t.addEventListener("click",async t=>{const e=submit_buttons[0].parentElement.children[1];e.value&&42===e.value.length&&polygonRegex.test(e.value.slice(2)),submit_buttons[0].parentElement.style.display="none",submit_buttons[1].parentElement.style.display="block"})});