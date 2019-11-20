import { NFTMintBuilder } from "./nft-mint";
import { NFTTransferBuilder } from "./nft-transfer";
import { NFTUpdateBuilder } from "./nft-update";

export class NftBuilderFactory {
    public static nftMint(tokenId): NFTMintBuilder {
        return new NFTMintBuilder(tokenId);
    }

    public static nftUpdate(tokenId): NFTUpdateBuilder {
        return new NFTUpdateBuilder(tokenId);
    }

    public static nftTransfer(tokenId): NFTTransferBuilder {
        return new NFTTransferBuilder(tokenId);
    }
}

export { NFTMintBuilder, NFTTransferBuilder, NFTUpdateBuilder };
