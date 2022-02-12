// Config  variables
const config = {
    polygonAddressRegex: /^[0-9a-zA-Z]{40,40}/g,
    bunkercoinAddressRegex: /^[0-9a-zA-Z]{33,33}/g,
    minDeposit: 10000,
    apiURL: `https://wrap.bunkercoin.xyz/api/`
};

// Define web3
const web3 = (window as any).ethereum;

// I hate this but else TypeScript will complain
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

            return web3.request({ method: `wallet_addEthereumChain`, params })
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
    (document.querySelector(`#matic-address`) as HTMLSpanElement).innerText = checksummedAddress;

    // Get a deposit address
    const data_deposit = await (await fetch(`${config.apiURL}/getDepositAddress/${checksummedAddress}`)).json();
    const message = JSON.parse(data_deposit.message);
    const { node, signature } = data_deposit; // TODO: check signature
    (document.querySelector(`#wrap-deposit-address`) as HTMLParagraphElement).innerText = message.depositAddress;

    const confirmed_data = (await (await fetch(`${config.apiURL}/getBalance/${checksummedAddress}`)).text()) // Get the text data from the response
        .slice(1).slice(0, -1); // Remove the first and last " from the string

    // Show the balance 
    if (confirmed_data !== (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText) {
        (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText = confirmed_data;

        // Show the emit button if the user has deposited something
        if (parseFloat(confirmed_data) > config.minDeposit) {
            (document.querySelector("#button-emit") as HTMLButtonElement).style.display = `block`;
        }
    }

    // Check every 2.5 minutes if the user desposited any (un)confirmed funds (2.5 min to avoid 429)
    setInterval(async () => {
        const confirmed_data = (await (await fetch(`${config.apiURL}/getBalance/${checksummedAddress}`)).text()) // Get the text data from the response
            .slice(1).slice(0, -1); // Remove the first and last " from the string

        // Show the balance 
        if (confirmed_data !== (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText) {
            (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText = confirmed_data;

            // Show the emit button if the user has deposited something
            if (parseFloat(confirmed_data) > config.minDeposit) {
                (document.querySelector("#button-emit") as HTMLButtonElement).style.display = `block`;
            }
        }

        const unconfirmed_data = (await (await fetch(`${config.apiURL}/getBalance/${checksummedAddress}`)).text()) // Get the text data from the response
            .slice(1).slice(0, -1); // Remove the first and last " from the string

        // Show the balance 
        if (unconfirmed_data !== (document.querySelector(`#wrap-unconfirmed`) as HTMLParagraphElement).innerText) {
            (document.querySelector(`#wrap-unconfirmed`) as HTMLParagraphElement).innerText = unconfirmed_data;
        }
    }, 150 * 1000);

    // If the user clicks the emit button
    (document.querySelector("#button-emit") as HTMLButtonElement).addEventListener("click", async (event) => {
        // Get smart contract values
        const data_contract = await (await fetch(`${config.apiURL}/emitwBKC/${checksummedAddress}`)).json();
        console.log(data_contract);
    });
})();
