"use strict";const polygonAddressRegex=/^[0-9a-zA-Z]{40,40}/g,apiURL="https://wrap.bunkercoin.xyz/api/",minDeposit=.01,maxDeposit=100,minConfirmations=3,submitButton1=document.querySelector("#submit1"),submitButton2=document.querySelector("#submit2"),submitButton3=document.querySelector("#submit3");submitButton1?.addEventListener("click",async e=>{const t=document.querySelector("#stage1").children[1];if(t.value&&42===t.value.length&&polygonAddressRegex.test(t.value.slice(2))){const s=await fetch(apiURL+"getDepositAddress/"+t.value);(await s.json()).message.addressMatic,t.value,document.querySelector("#stage1").style.display="none",document.querySelector("#stage2").style.display="block"}else alert("Please enter a valid polygon address")}),submitButton2?.addEventListener("click",async e=>{const t=document.querySelector("#stage2").children[1];t.value&&42===t.value.length&&polygonAddressRegex.test(t.value.slice(2)),document.querySelector("#stage2").style.display="none",document.querySelector("#stage3").style.display="block"}),submitButton3?.addEventListener("click",async e=>{const t=document.querySelector("#stage3").children[1];t.value&&42===t.value.length&&polygonAddressRegex.test(t.value.slice(2))});