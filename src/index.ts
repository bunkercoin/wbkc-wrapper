// Config  variables
const polygonAddressRegex: RegExp = /^[0-9a-zA-Z]{40,40}/g;
const bunkercoinAddressRegex: RegExp = /^[0-9a-zA-Z]{33,33}/g;
const apiURL: string = `https://wrap.bunkercoin.xyz/api/`;
const minDeposit: number = 100;
const minConfirmations: number = 60;

const web3 = (window as any).ethereum;

// I hate this but else typescript will complain
var Web3Eth: any;
var eth: any;
var ethereum: any;

const addToMetaMask = async (): Promise<[string | undefined, boolean]> => {
    if (ethereum !== undefined) {
        eth = new Web3Eth(ethereum);
    } else if (web3 !== undefined) {
        eth = new Web3Eth(web3.givenProvider);
    } else {
        eth = new Web3Eth(ethereum);
    }

    if (eth !== undefined) {
        const netID: number = await eth.net.getId();
        if (netID == 137) {
            return [undefined, true];
        } else {
            const params = [{
                chainId: `0x89`,
                chainName: `Matic Mainnet`,
                nativeCurrency: {
                    name: `MATIC`,
                    symbol: `MATIC`,
                    decimals: 18
                },
                rpcUrls: [`https://polygon-rpc.com/`],
                blockExplorerUrls: [`https://polygonscan.com/`]
            }];


            return (window as any).ethereum.request({ method: `wallet_addEthereumChain`, params })
                .then(() => [undefined, true]) // error = false, success = true
                .catch((error: Error) => [error.message, false]); // error = error message, success = false
        }
    } else {
        return [`Unable to locate MetaMask`, false];
    }
}

// Buttons
const metaMaskButton = document.getElementById(`button-add-metamask`) as HTMLButtonElement;
const submitButton1 = document.querySelector(`#button-deposit-address`) as HTMLButtonElement;
const submitButton2 = document.querySelector(`#button-getbal`) as HTMLButtonElement;
const submitButton3 = document.querySelector(`#button-emit`) as HTMLButtonElement;

(async () => {
    // Add the Polygon network and enable MetaMask
    const [error, success] = await addToMetaMask();
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

    // Check every 30 seconds if the user desposited any confirmed funds
    setInterval(async () => {
        const confirmed_data = parseFloat((await (await fetch(`${apiURL}/getBalance/${checksummedAddress}`)).text()).slice(1).slice(0, -1));
        console.log(confirmed_data);
        if (confirmed_data !== parseFloat((document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText)) {
            (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText = confirmed_data.toString();
        }
    }, 30 * 1000);
})();
