"use strict";const config={polygonAddressRegex:/^[0][x][0-9a-zA-Z]{40}$/,bunkercoinAddressRegex:/^[B][a-zA-Z0-9]{33}$/,minDeposit:1e4,apiURL:"http://62.155.193.51:5000",explorerURL:"https://explorer.bunkercoin.xyz"},web3=window.ethereum;var Web3Eth,eth,ethereum;const addToMetaMask=async()=>{return void 0===(eth=void 0===ethereum&&void 0!==web3?new Web3Eth(web3.givenProvider):new Web3Eth(ethereum))?["Unable to locate MetaMask",!1]:137==await eth.net.getId()?[void 0,!0]:(e=[{chainId:"0x89",chainName:"Matic Mainnet",nativeCurrency:{name:"MATIC",symbol:"MATIC",decimals:18},rpcUrls:["https://polygon-rpc.com/"],blockExplorerUrls:["https://polygonscan.com/"]}],web3.request({method:"wallet_addEthereumChain",params:e}).then(()=>[void 0,!0]).catch(e=>[e.message,!1]));var e},metaMaskButton=document.getElementById("button-add-metamask"),submitButton1=document.querySelector("#button-deposit-address"),submitButton2=document.querySelector("#button-getbal"),submitButton3=document.querySelector("#button-emit");(async()=>{var[e,t]=await addToMetaMask();e&&!t&&alert(e),await web3.enable().catch(e=>{alert("An error has occured while enabling MetaMask: "+e)});const a=Web3Utils.toChecksumAddress(web3.selectedAddress);document.querySelector("#matic-address").innerText=a;var t=await(await fetch(config.apiURL+"/getDepositAddress/"+a)).json(),e=JSON.parse(t.message),{node:n,signature:r}=t,n=await(await fetch(config.explorerURL+`/?action=verify&verify_address=${n}&verify_signature=${r}&verify_message=`+t.message)).json();!n.success||n.result?(document.querySelector("#wrap-deposit-address").innerText=e.depositAddress,(r=(await(await fetch(config.apiURL+"/getBalance/"+a)).text()).slice(1).slice(0,-1))!==document.querySelector("#wrap-confirmed").innerText&&(document.querySelector("#wrap-confirmed").innerText=r,parseFloat(r)>config.minDeposit&&(document.querySelector("#button-emit").style.display="block")),setInterval(async()=>{var e=(await(await fetch(config.apiURL+"/getBalance/"+a)).text()).slice(1).slice(0,-1),e=(e!==document.querySelector("#wrap-confirmed").innerText&&(document.querySelector("#wrap-confirmed").innerText=e,parseFloat(e)>config.minDeposit&&(document.querySelector("#button-emit").style.display="block")),(await(await fetch(config.apiURL+"/getBalanceUnconfirmed/"+a)).text()).slice(1).slice(0,-1));e!==document.querySelector("#wrap-unconfirmed").innerText&&(document.querySelector("#wrap-unconfirmed").innerText=e)},3e5),document.querySelector("#button-emit").addEventListener("click",async e=>{var t=await(await fetch(config.apiURL+"/emitwBKC/"+a)).json();console.log(t)})):alert("The signature is invalid.")})();