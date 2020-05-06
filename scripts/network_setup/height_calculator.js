#!/usr/bin/node
const crypto = require("../../packages/crypto");
const got = require("got");

const date = process.argv[2];
const network = process.argv[3];

crypto.Managers.configManager.setFromPreset(network);
let apiUrl = `https://forger1.${network}.uns.network/api`;
if(network === "livenet") {
    apiUrl = `https://api.uns.network/api`;
}

const blockTime = crypto.Managers.configManager.getMilestone().blocktime;
const main = async () => {
    //get first mined block timestamp
    const genesisTime = JSON.parse((await got.get(`${apiUrl}/blocks/2`)).body).data.timestamp.unix *1000;
    const dateTime = Date.parse(date);
    if(Number.isNaN(dateTime)) {
        console.log("unable to parse date. Use ISO 8061 date")
    }

    const timeElapsed = dateTime - genesisTime;
    const blocks = timeElapsed / (1000* parseInt(blockTime));

    console.log("date:",new Date(dateTime)," blocks number:",blocks);
    return 0;
}
main()
