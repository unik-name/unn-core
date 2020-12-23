import { Identities, Managers, Transactions } from "@arkecosystem/crypto";
import { CertifiedNftTransferTransaction, UNSCertifiedNftTransferBuilder } from "@uns/crypto";
import { generateNftId } from "../../../functional/transaction-forging/__support__/nft";
import { buildCertifiedDemand } from "../../../helpers/nft-transaction-factory";
import { testNftAssetSchema } from "../../core-nft/transactions/schemas-utils";
import * as Fixtures from "../__fixtures__";
import { testCertifiedBuilder } from "./uns-certified-nft-utils";

describe("Uns Certified NFT Transfer", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(CertifiedNftTransferTransaction);

    const tokenId = generateNftId();
    const issuerTokenId = generateNftId();
    const sender = { tokenId, passphrase: "thePassphrase" };
    const issuer = { tokenId: issuerTokenId, passphrase: "issuerPassphrase" };

    const recipientId = Identities.Address.fromPassphrase("recipientPassphrase");
    const asset = buildCertifiedDemand({}, sender, issuer);
    describe("Uns Certified NFT Transfer with properties", () => {
        const properties = { tata: "toto" };
        const builder = new UNSCertifiedNftTransferBuilder("unik", tokenId)
            .properties(properties)
            .demand(asset.demand)
            .certification(asset.certification)
            .recipientId(recipientId)
            .nonce("1")
            .sign(sender.passphrase);

        testCertifiedBuilder(builder);

        testNftAssetSchema(CertifiedNftTransferTransaction, builder);

        it("should have properties tata", () => {
            expect(builder).toHaveProperty("data.asset.nft.unik.properties.tata", properties.tata);
        });
    });

    describe("Uns Certified NFT Transfer without property", () => {
        const builder = new UNSCertifiedNftTransferBuilder("unik", tokenId)
            .demand(asset.demand)
            .certification(asset.certification)
            .recipientId(recipientId)
            .nonce("1")
            .sign(sender.passphrase);

        testCertifiedBuilder(builder);

        testNftAssetSchema(CertifiedNftTransferTransaction, builder);
    });
});
