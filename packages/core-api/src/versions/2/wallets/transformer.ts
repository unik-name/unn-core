import { bignumify } from "@arkecosystem/core-utils";
import { bignumToUnicode } from "@arkecosystem/crypto";

export function transformWallet(model) {
    return {
        address: model.address,
        publicKey: model.publicKey,
        username: model.username,
        secondPublicKey: model.secondPublicKey,
        balance: +bignumify(model.balance).toFixed(),
        isDelegate: !!model.username,
        vote: model.vote,
        tokens: model.tokens.map(t => Buffer.from(t).toString("utf8")),
    };
}
