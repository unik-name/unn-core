import { flags } from "@oclif/command";
import { NftSendCommand } from "../../shared/nft-send";
import { NFTUpdateCommand } from "./nftupdate";

export class NFTMintCommand extends NFTUpdateCommand {
    public static description: string = "mint a non-fungible token and set properties";

    public static flags = {
        ...NftSendCommand.nftFlags,
        props: flags.string({
            description: "NFT properties to update key/value",
            required: false,
        }),
    };

    protected getCommand(): any {
        return NFTMintCommand;
    }

    protected getSigner(opts) {
        return this.nftSigner.makeNftMint(opts);
    }
}
