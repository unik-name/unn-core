import { transactionBuilder } from "../../../../packages/crypto";
import { delegates } from "../../../utils/fixtures/testnet/delegates";
import { generateNftIdentifier } from "../../../utils/generators/nft";
import { __addBlocks, __resetBlocksInCurrentRound, __resetToHeight1, __start, createBlock } from "./utils";

export const mintNft = async (blockchain, nextForger, properties): Promise<string> => {
    // Ceate new nft
    const forgerKeys = delegates.find(wallet => wallet.publicKey === nextForger.publicKey);

    const nftId = generateNftIdentifier();
    const mintNft = transactionBuilder
        .nftMint(nftId)
        .properties(properties)
        .sign(forgerKeys.passphrase)
        .getStruct();

    const mintBlock = createBlock(forgerKeys, [mintNft]);
    await blockchain.processBlock(mintBlock, jest.fn(() => true));

    return nftId;
};
