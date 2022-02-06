// I hate this but else typescript will complain
var Web3Eth: any;
var eth: any;
var ethereum: any;

const addNetwork = async () => {
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