import { ITransactionData } from "../../../../../packages/crypto/src";
import { transactionBuilder } from "../../../../../packages/crypto/src/builder";

export const discloseExplicitTransactionStruct = (demand: any, owner: string): ITransactionData => {
    return transactionBuilder
        .unsDiscloseExplicit()
        .discloseDemand(demand["disclose-demand"], demand["disclose-demand-certification"])
        .sign(owner)
        .getStruct();
};
