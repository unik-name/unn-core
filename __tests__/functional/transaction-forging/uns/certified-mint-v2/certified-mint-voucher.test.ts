import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import { IWalletManager } from "@arkecosystem/core-interfaces/dist/core-state";
import { Identities, Managers, Utils } from "@arkecosystem/crypto";
import { NftsManager } from "@uns/core-nft";
import { DIDTypes } from "@uns/crypto";
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
    it("apply individual certified mint with voucher (zero fee) and revert", async () => {
        const tokenId = NftSupport.generateNftId();
        const passphrase = "the passphrase " + tokenId.substr(0, 10);
        const UnikVoucherId = "my voucher" + tokenId.substr(0, 10);
        const didType = DIDTypes.INDIVIDUAL;

        const properties = {
            type: didType.toString(),
            UnikVoucherId,
        };

        const fee = 0;
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

        expect(trx.fee).toStrictEqual(Utils.BigNumber.ZERO);
        await expect(trx.id).toBeForged();
        await expect({ tokenId, properties }).toMatchProperties();

        const senderWallet = walletManager.findByAddress(Identities.Address.fromPassphrase(passphrase));
        expect(senderWallet.balance).toEqual(Utils.BigNumber.ZERO);

        expect(senderWallet.getAttributes().tokens).toEqual({ [tokenId]: { type: didType } });
        expect(await nftManager.exists(tokenId)).toBeTrue();

        await support.revertLastBlock();
        await support.revertLastBlock();

        expect(senderWallet.getAttributes().tokens).toBeUndefined();
        expect(await nftManager.exists(tokenId)).toBeFalse();
    });
});
