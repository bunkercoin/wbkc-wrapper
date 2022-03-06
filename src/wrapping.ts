// Config  variables
const config = {
    polygonAddressRegex: /^[0][x][0-9a-zA-Z]{40}$/,
    bunkercoinAddressRegex: /^[B][a-zA-Z0-9]{33}$/,
    minDeposit: 10000,
    apiURL: `http://62.155.193.51:5000`,
    explorerURL: `https://explorer.bunkercoin.xyz`,
};

// Define web3
const web3 = (window as any).ethereum;

const rpc = async (method: string, params: any): Promise<[string | undefined, boolean]> => {
    return web3
        .request({
            method: method,
            params: params,
        })
        .then(() => [undefined, true]) // error = false, success = true
        .catch((error: Error) => [error.message, false]); // error = error message, success = false
};

const addToMetaMask = async (): Promise<[string | undefined, boolean]> => {
    // @ts-ignore
    const eth = new Web3Eth(web3);

    if (eth !== undefined) {
        const netID: number = await eth.net.getId();
        if (netID == 137) {
            return [undefined, true];
        } else {
            return await rpc(`wallet_addEthereumChain`, [
                {
                    chainId: `0x89`,
                    chainName: `Matic Mainnet`,
                    nativeCurrency: {
                        name: `MATIC`,
                        symbol: `MATIC`,
                        decimals: 18,
                    },
                    rpcUrls: [`https://polygon-rpc.com/`],
                    blockExplorerUrls: [`https://polygonscan.com/`],
                },
            ]);
        }
    } else {
        return [`Unable to locate MetaMask`, false];
    }
};

const addToMetaMaskButton = document.querySelector(`#button-add-to-metamask`) as HTMLButtonElement;
addToMetaMaskButton.addEventListener(`click`, async () => {
    // Add the Polygon network and enable MetaMask
    const [error, success] = await addToMetaMask();
    if (error && !success) {
        alert(error);
    }
    await web3.enable().catch((error: string) => {
        alert(`An error has occured while enabling MetaMask: ${error}`);
    });

    // @ts-ignore - Show the MetaMask address
    const checksummedAddress = Web3Utils.toChecksumAddress(web3.selectedAddress);
    (document.querySelector(`#matic-address`) as HTMLSpanElement).innerText = checksummedAddress;

    // Show the main screen
    (document.querySelector(`#noMetamask`) as HTMLDivElement).style.display = `none`;
    (document.querySelector(`#onceMetamask`) as HTMLDivElement).style.display = `block`;

    // Get a deposit address
    const data_deposit = await (
        await fetch(`${config.apiURL}/getDepositAddress/${checksummedAddress}`)
    ).json();
    const message = JSON.parse(data_deposit.message);
    const { node, signature } = data_deposit;

    // Verify the signature
    const verified = await (
        await fetch(
            `${config.explorerURL}/?action=verify&verify_address=${node}&verify_signature=${signature}&verify_message=${data_deposit.message}`,
        )
    ).json();
    if (verified.success && verified.result === false) {
        alert(`The signature is invalid.`);
        return;
    }
    (document.querySelector(`#wrap-deposit-address`) as HTMLParagraphElement).innerText =
        message.depositAddress;

    const confirmed_data = (
        await (await fetch(`${config.apiURL}/getBalance/${checksummedAddress}`)).text()
    ) // Get the text data from the response
        .slice(1)
        .slice(0, -1); // Remove the first and last " from the string

    // Show the balance
    if (
        confirmed_data !==
        (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText
    ) {
        (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText =
            confirmed_data;

        // Show the emit button if the user has deposited something
        if (parseFloat(confirmed_data) > config.minDeposit) {
            (document.querySelector(`#button-emit`) as HTMLButtonElement).style.display = `block`;
        }
    }

    // Check every 5 minutes if the user desposited any (un)confirmed funds (5 min to avoid 429)
    setInterval(async () => {
        const confirmed_data = (
            await (await fetch(`${config.apiURL}/getBalance/${checksummedAddress}`)).text()
        ) // Get the text data from the response
            .slice(1)
            .slice(0, -1); // Remove the first and last " from the string

        // Show the balance
        if (
            confirmed_data !==
            (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText
        ) {
            (document.querySelector(`#wrap-confirmed`) as HTMLParagraphElement).innerText =
                confirmed_data;

            // Show the emit button if the user has deposited something
            if (parseFloat(confirmed_data) > config.minDeposit) {
                (
                    document.querySelector(`#button-emit`) as HTMLButtonElement
                ).style.display = `block`;
            }
        }

        const unconfirmed_data = (
            await (
                await fetch(`${config.apiURL}/getBalanceUnconfirmed/${checksummedAddress}`)
            ).text()
        ) // Get the text data from the response
            .slice(1)
            .slice(0, -1); // Remove the first and last " from the string

        // Show the balance
        if (
            unconfirmed_data !==
            (document.querySelector(`#wrap-unconfirmed`) as HTMLParagraphElement).innerText
        ) {
            (document.querySelector(`#wrap-unconfirmed`) as HTMLParagraphElement).innerText =
                unconfirmed_data;
        }
    }, 300 * 1000);

    // If the user clicks the emit button
    (document.querySelector(`#button-emit`) as HTMLButtonElement).addEventListener(
        `click`,
        async () => {
            // Get smart contract values
            const data_contract = await (
                await fetch(`${config.apiURL}/emitwBKC/${checksummedAddress}`)
            ).json();
            console.log(data_contract);
        },
    );
});

const addTokenButton = document.querySelector(`#button-add-token`) as HTMLButtonElement;
addTokenButton.addEventListener(`click`, async () => {
    await rpc(`wallet_watchAsset`, {
        type: `ERC20`,
        options: {
            address: `0x5BCda6E59262A96a599Ea938c9B679714c105Bba`,
            symbol: `wBKC`,
            decimals: 18,
        },
    });
});

const addTokenButton2 = document.querySelector(`#button-add-token-2`) as HTMLButtonElement;
addTokenButton2.addEventListener(`click`, async () => {
    await rpc(`wallet_watchAsset`, {
        type: `ERC20`,
        options: {
            address: `0x5BCda6E59262A96a599Ea938c9B679714c105Bba`,
            symbol: `wBKC`,
            decimals: 18,
        },
    });
});
