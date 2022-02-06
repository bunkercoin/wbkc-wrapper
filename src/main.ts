// Config  variables
const polygonAddressRegex: RegExp = /^[0-9a-zA-Z]{40,40}/g;
const bunkercoinAddressRegex: RegExp = /^[0-9a-zA-Z]{33,33}/g;
const apiURL: string = `https://wrap.bunkercoin.xyz/api/`;
const minDeposit: number = 100;
const minConfirmations: number = 60;

// Buttons
const metaMaskButton = document.getElementById(`button-add-metamask`) as HTMLButtonElement;
const submitButton1 = document.querySelector(`#button-deposit-address`) as HTMLButtonElement;
const submitButton2 = document.querySelector(`#button-getbal`) as HTMLButtonElement;
const submitButton3 = document.querySelector(`#button-emit`) as HTMLButtonElement;

(async () => {
    // Add the Polygon network and enable MetaMask
    const [error, success] = await addNetwork();
    if (error && !success) {
        alert(error);
    }
    await web3.enable().catch((error: string) => {
        alert(`An error has occured while enabling MetaMask: ${error}`);
    });

    // Show the MetaMask address
    //@ts-ignore - to ignore Web3Utils name to found
    const checksummedAddress = Web3Utils.toChecksumAddress(web3.selectedAddress);
    (document.querySelector(`#matic-address`) as HTMLSpanElement).innerText = `Your selected address: ${checksummedAddress}`;

    // Get a deposit address
    const response = await fetch(`${apiURL}/getDepositAddress/${checksummedAddress}`);
    const data = await response.json();
    const message = JSON.parse(data.message);
    const { node, signature } = data;
    (document.querySelector(`#wrap-deposit-address`) as HTMLParagraphElement).innerText = message.depositAddress;
})();
