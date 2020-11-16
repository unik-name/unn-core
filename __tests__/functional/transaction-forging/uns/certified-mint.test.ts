import { Managers, Utils } from "@arkecosystem/crypto";
import { DIDTypes, getRewardsFromDidType } from "@uns/crypto";
import { utils } from "../../../integration/core-api/utils";
import genesisBlock from "../../../utils/config/dalinet/genesisBlock.json";
import * as support from "../__support__";
import * as NftSupport from "../__support__/nft";
import * as UnsSupport from "../__support__/uns";

beforeAll(async () => {
    Managers.configManager.set("network.forgeFactory.unikidWhiteList", [UnsSupport.forgerFactoryTokenId]);
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
});
afterAll(async () => support.tearDown());

const getUnikNumber = async () => {
    const response = await utils.request("GET", "nfts/status");
    expect(response).toBeSuccessfulResponse();
    return response.data.data[0];
};

describe("Uns certified mint", () => {
    it("nft certified mint", async () => {
        const nbUniks = parseInt((await getUnikNumber()).individual);

        const tokenId = NftSupport.generateNftId();
        const properties = {
            type: "1",
        };

        const serviceCost = Utils.BigNumber.make("666");
        const fee = 100000000;
        const trx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            NftSupport.defaultPassphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            fee,
        );

        await expect(trx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();
        expect((await getUnikNumber()).individual).toEqual((nbUniks + 1).toString());
    });

    it("nft certified mint with voucher", async () => {
        const tokenId = NftSupport.generateNftId();
        const passphrase = "the passphrase " + tokenId.substr(0, 10);
        const voucherId = "6trg50ZxgEPl9Av8V67c0";
        const didType = DIDTypes.INDIVIDUAL;
        const properties = {
            type: didType.toString(),
            UnikVoucherId: voucherId,
        };

        const rewards = getRewardsFromDidType(didType);
        const serviceCost = Utils.BigNumber.ZERO;
        const fee = rewards.forger;

        const trx = await UnsSupport.certifiedMintAndWait(
            tokenId,
            passphrase,
            UnsSupport.forgerFactoryTokenId,
            UnsSupport.forgerFactoryPassphrase,
            properties,
            serviceCost,
            fee,
        );

        await expect(trx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();

        // Check total supply
        const response = await utils.request("GET", "blockchain");
        expect(response).toBeSuccessfulResponse();
        const premine = parseInt(genesisBlock.totalAmount);
        const totalSupply = response.data.data.supply;
        const blockReward = Managers.configManager.getMilestone().reward;
        const totalBlockRewards = response.data.data.block.height * blockReward;
        expect(+totalSupply).toEqual(
            premine + totalBlockRewards + rewards.sender + rewards.forger + rewards.foundation,
        );
    });
});
