import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { NftsManager } from "@uns/core-nft";
import { DIDTypes, getRewardsFromDidType } from "@uns/crypto";
import { getFoundationWallet } from "@uns/uns-transactions/src/handlers/utils/helpers";
import * as support from "../../__support__";
import * as NftSupport from "../../__support__/nft";
import * as UnsSupport from "../../__support__/uns";

let walletManager: IWalletManager;
let nftManager: NftsManager;
beforeAll(async () => {
    await NftSupport.setUp();

    await UnsSupport.setupForgeFactory();
    walletManager = app.resolvePlugin<Database.IDatabaseService>("database").walletManager;
    nftManager = app.resolvePlugin<NftsManager>("core-nft");

    // force v2 token Eco
    Managers.configManager.getMilestone().unsTokenEcoV2 = true;
});
afterAll(async () => support.tearDown());

describe("Uns certified mint", () => {
    it("organization certified mint with voucher", async () => {
        const tokenId = NftSupport.generateNftId();
        const passphrase = "the passphrase " + tokenId.substr(0, 10);
        const UnikVoucherId = "my voucher" + tokenId.substr(0, 10);

        const didType = DIDTypes.ORGANIZATION;
        const properties = {
            type: didType.toString(),
            UnikVoucherId,
        };

        const rewards = getRewardsFromDidType(didType);
        const fee = rewards.forger;
        const serviceCost = Utils.BigNumber.ZERO;

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

        const senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        expect(senderWallet.balance).toEqual(Utils.BigNumber.make(rewards.sender));

        const foundationWallet = getFoundationWallet(walletManager);
        expect(foundationWallet.balance).toEqual(Utils.BigNumber.make(rewards.foundation));

        expect(senderWallet.getAttributes().tokens).toEqual({ [tokenId]: { type: didType } });
        expect(await nftManager.exists(tokenId)).toBeTrue();

        await support.revertLastBlock();
        await support.revertLastBlock();

        expect(senderWallet.getAttributes().tokens).toBeUndefined();
        expect(await nftManager.exists(tokenId)).toBeFalse();
    });
});
