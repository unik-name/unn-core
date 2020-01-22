/*
This script is experimental and should be used for development only when launching a local node.
It checks the presence of a NFT issuer token. if not present it creates it on the genesis_3 wallet
*/

const delay = require("delay");
const got = require("got");
const nftCrypto = require("../../../packages/core-nft-crypto");
const crypto = require("../../../packages/crypto");
const utils = require("../../../packages/core-utils");

const ISSUER_PASSPHRASE="cactus cute please spirit reveal raw goose emotion latin subject forum panic";
const ISSUER_ID="5f96dd359ab300e2c702a54760f4d74a11db076aa17575179d36e06d75c96511";
const timeout = 10;
console.log("Check forge factory unik presence");

//const apiUrl = "https://forger1.dalinet.uns.network/api";
const apiUrl = "http://localhost:4003/api";

const hasNftIssuer = async () => {
    let elapsed = 0;
    while (true) {
        try {
            await got.get(`${apiUrl}/uniks/${ISSUER_ID}`);
            return true;
        } catch (error){
            if (error.statusCode && error.statusCode === 404) {
                return false;
            } else {
                /*chain's api is not started yet*/
                await delay(100);
                elapsed += 100;
            }
        }
        if (elapsed > timeout * 1000) {
            console.error("Unable to connect local node api")
            return true;
        }
    }
}

const main = async () => {
    if (!(await hasNftIssuer())) {
        crypto.Managers.configManager.setFromPreset("dalinet");
        crypto.Managers.configManager.setHeight(2);
        crypto.Transactions.TransactionRegistry.registerTransactionType(nftCrypto.Transactions.NftMintTransaction);
        console.log("Registering new Nft issuer");

        const transaction = new nftCrypto.Builders.NftMintBuilder("unik", ISSUER_ID)
        .properties({type: "2"})
        .fee(`${nftCrypto.Enums.NftTransactionStaticFees.NftMint}`)
        .nonce("2")
        .sign(ISSUER_PASSPHRASE)
        .getStruct();

        const response = await utils.httpie.post(`${apiUrl}/transactions`, { body: {transactions: [transaction]} });
        if(response.status !== 200) {
            console.error(response)
        }
    }

    return 0;
};
main()
