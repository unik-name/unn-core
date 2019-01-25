import { TransactionTypes } from "../../../constants";
import { base as transaction } from "./base";

const tokenId = joi =>
    joi.alternatives().try(
        joi.bignumber().min(1),
        joi
            .number()
            .integer()
            .positive(),
    );

const nft = (type, joi) => {
    return transaction(joi).append({
        type: joi
            .number()
            .only(type)
            .required(),
        amount: joi
            .alternatives()
            .try(joi.bignumber().only(0), joi.number().valid(0))
            .optional(),
    });
};

const nftTransfer = joi => ({
    name: "nftTransfer",
    base: nft(TransactionTypes.NftTransfer, joi).append({
        recipientId: joi.address().optional(),
        asset: joi
            .object({
                nft: joi
                    .object({
                        tokenId: tokenId(joi).required(),
                    })
                    .required(),
            })
            .required(),
    }),
});

const nftUpdate = joi => ({
    name: "nftUpdate",
    base: nft(TransactionTypes.NftUpdate, joi).append({
        recipientId: joi.forbidden(),
        asset: joi
            .object({
                nft: joi
                    .object({
                        tokenId: tokenId(joi).required(),
                        properties: joi
                            .array()
                            .items(
                                joi
                                    .array()
                                    .items(joi.string(), joi.string())
                                    .length(2),
                            )
                            .min(1)
                            .required(),
                    })
                    .required(),
            })
            .required(),
    }),
});

export { nftTransfer, nftUpdate };
