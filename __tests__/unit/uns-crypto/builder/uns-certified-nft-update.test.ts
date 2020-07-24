import { Managers, Transactions } from "@arkecosystem/crypto";
import { CertifiedNftUpdateTransaction } from "@uns/crypto";
import { testNftAssetSchema } from "../../core-nft/transactions/schemas-utils";
import * as Fixtures from "../__fixtures__";
import { testCertifiedBuilder } from "./uns-certified-nft-utils";

describe("Uns Certified NFT update", () => {
    Managers.configManager.setFromPreset(Fixtures.network);
    Managers.configManager.setHeight(2);
    Transactions.TransactionRegistry.registerTransactionType(CertifiedNftUpdateTransaction);

    testCertifiedBuilder(Fixtures.unsCertifiedNftUpdateTransaction());

    testNftAssetSchema(CertifiedNftUpdateTransaction, Fixtures.unsCertifiedNftUpdateTransaction());
});
