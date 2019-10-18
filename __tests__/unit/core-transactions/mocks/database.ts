import { NFT } from "../../../../packages/core-interfaces/src";

export const database = {
    connection: {
        nftsRepository: {
            findPropertyByKey: key => {
                switch (key) {
                    case "immutableProp":
                        return 1;
                    default:
                        return true;
                }
            },
        },
    },
    nftsBusinessRepository: {
        findById: (id): Promise<NFT.INft> => {
            let nftId;
            let ownerId;
            switch (id) {
                case "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051":
                    nftId = "0035a40470021425558f5cbb7b5f056e51b694db5cc6c336abdc6b777fc9d051";
                    ownerId = "DEbyWA3XZHkdVv8ZMPkV7Qzqs7k5iJoPFZ";
                    break;
                case "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f":
                    nftId = "ee16f4b75f38f6e3d16635f72a8445e0ff8fbacfdfa8f05df077e73de79d6e4f";
                    ownerId = "DNr6xHfWySFN5eGqaxrwydAnN4ejvgDsEA";
                    break;
                default:
                    return null;
            }
            return Promise.resolve({ id: nftId, ownerId });
        },
    },
    transactionsBusinessRepository: {
        getPublicKeyFromAddress: address => {
            switch (address) {
                case "DEbyWA3XZHkdVv8ZMPkV7Qzqs7k5iJoPFZ":
                    return "0227c8a0260a964ee857aa1820d422bed972f41574e62362eee047750eb1e3efc7";
                case "DNr6xHfWySFN5eGqaxrwydAnN4ejvgDsEA":
                    return "024a9a1370d1ecb0e4016f01744ab0087e43e7a6cd6e4cc8117293a913be7c778f";
                default:
                    return null;
            }
        },
        findAllByAsset: _ => {
            return null;
        },
    },
};
