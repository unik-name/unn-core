import { Address } from "@arkecosystem/crypto";
import { NFTUPDATE_FLAGS, NFTUpdateCommand } from "./nftupdate";

export class NFTMintCommand extends NFTUpdateCommand {
    public static description: string = "mint a non-fungible token and set properties";

    // TODO why is it required ? Crashes at runtime: unexpected arguments
    public static flags = NFTUPDATE_FLAGS;

    protected async createWalletsWithBalance(flags: Record<string, any>): Promise<any[]> {
        const ownerAddress = Address.fromPassphrase(flags.owner);

        const wallets = [];
        wallets[ownerAddress] = {
            address: ownerAddress,
            passphrase: flags.owner,
        };
        return wallets;
    }

    protected getCommand(): any {
        return NFTMintCommand;
    }

    protected getSigner(opts) {
        return this.signer.makeNftMint(opts);
    }
}
