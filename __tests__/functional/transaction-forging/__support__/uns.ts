import { UNSDiscloseExplicitBuilder } from "@uns/crypto";
import { snoozeForBlock } from ".";
import { TransactionFactory } from "../../../helpers";
import * as NftSupport from "./nft";
import "./nft-jest-matchers";

export const discloseExplicitTransaction = discloseDemand => {
    const discloseBuilder = new UNSDiscloseExplicitBuilder().discloseDemand(
        discloseDemand["disclose-demand"],
        discloseDemand["disclose-demand-certification"],
    );
    return new TransactionFactory(discloseBuilder);
};

export const discloseAndWait = async discloseDemand => {
    const t = discloseExplicitTransaction(discloseDemand)
        .withNetwork(NftSupport.network)
        .withPassphrase(NftSupport.defaultPassphrase)
        .createOne();

    await expect(t).toBeAccepted();
    await snoozeForBlock(1);
    return t;
};
