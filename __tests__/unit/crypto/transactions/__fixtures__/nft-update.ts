import { ITransactionData } from "../../../../../packages/crypto/src";
import { transactionBuilder } from "../../../../../packages/crypto/src/builder";

export const nftupdateTransctionStruct = (
    tokenId: string,
    sender: string,
    owner: string,
    properties: any,
): ITransactionData => {
    return transactionBuilder
        .nftUpdate(tokenId)
        .properties(properties)
        .senderPublicKey(sender)
        .sign(owner)
        .getStruct();
};

export const getProperties = (nbProperties: number): any => {
    const properties = {};
    for (let i = 0; i < nbProperties; i++) {
        properties[`prop${i}`] = `${i}`;
    }
    return properties;
};
