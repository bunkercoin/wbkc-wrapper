// Config  variables
const polygonAddressRegex: RegExp = /^[0-9a-zA-Z]{40,40}/g;
const bunkercoinAddressRegex: RegExp = /^[0-9a-zA-Z]{33,33}/g;
const apiURL: string = `https://wrap.bunkercoin.xyz/api/`;
const minDeposit: number = 0.01;
const minConfirmations: number = 60;

const web3 = (window as any).ethereum;;

// Buttons
const metaMaskButton = document.getElementById(`button-add-metamask`) as HTMLButtonElement;
const submitButton1 = document.querySelector(`#button-deposit-address`) as HTMLButtonElement;
const submitButton2 = document.querySelector(`#button-getbal`) as HTMLButtonElement;
const submitButton3 = document.querySelector(`#button-emit`) as HTMLButtonElement;

// Add to MetaMask button
metaMaskButton.addEventListener(`click`, async () => {
    const [error, success] = await addNetwork();
    if (error && !success) {
        alert(error);
    }
    web3.enable().then(async () => {
        // Continue to the next step
        (document.querySelector(`#add-metamask`) as HTMLDivElement).style.display = `none`;
        (document.querySelector(`#main`) as HTMLDivElement).style.display = `block`;

        // Show the MetaMask address
        //@ts-ignore
        const checksummedAddress = Web3Utils.toChecksumAddress(web3.selectedAddress);
        (document.querySelector(`#matic-address`) as HTMLSpanElement).innerText = `Your selected address: ${checksummedAddress}`;

        // Get a deposit address
        const response = await fetch(`${apiURL}/getDepositAddress/${checksummedAddress}`);
        const data = await response.json();
        const message = JSON.parse(data.message);
        const { node, signature } = data;
        (document.querySelector(`#deposit-address`) as HTMLParagraphElement).innerText = `Your deposit address: ${message.depositAddress}`;
    }).catch((error: any) => {
        console.error(error);
        alert(`An error has occured while enabling MetaMask`);
    });
});