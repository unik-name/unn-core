import { Managers, Transactions } from "@arkecosystem/crypto";
import { CertifiedNftMintTransaction } from "@uns/crypto";
import { testNftAssetSchema } from "../../core-nft/transactions/schemas-utils";
import * as Fixtures from "../__fixtures__";
import { testCertifiedBuilder } from "./uns-certified-nft-utils";

describe("Uns Certified NFT Mint", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(CertifiedNftMintTransaction);

    testCertifiedBuilder(Fixtures.unsCertifiedNftMintTransaction());

    testNftAssetSchema(CertifiedNftMintTransaction, Fixtures.unsCertifiedNftMintTransaction());
});
