import { flags } from "@oclif/command";
import { getNftUpdateFlags, NFTUpdateCommand } from "./nftupdate";

export class NFTMintCommand extends NFTUpdateCommand {
    public static description: string = "mint a non-fungible token and set properties";

    // TODO why is it required ? Crashes at runtime: unexpected arguments
    public static flags = {
        ...getNftUpdateFlags(false),
        nftName: flags.string({
            description: "NFT name",
            required: true,
        }),
    };

    protected getCommand(): any {
        return NFTMintCommand;
    }

    protected getSigner(opts) {
        return this.nftSigner.makeNftMint(opts);
    }
}
