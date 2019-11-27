import { flags } from "@oclif/command";
import { BaseCommand } from "../commands/command";
import { satoshiFlag } from "../flags";
import { NftSigner } from "../nft-signer";
import { SendCommand } from "./send";

export abstract class NftSendCommand extends SendCommand {
    public static nftFlags = {
        ...SendCommand.flagsSend,
        ...BaseCommand.flagsConfig,
        ...BaseCommand.flagsDebug,
        id: flags.string({
            description: "token identifier",
            required: true,
        }),
        nftName: flags.string({
            description: "NFT name",
            required: true,
        }),
        nftFee: satoshiFlag({
            description: "nft fee",
            default: 1,
        }),
    };
    protected nftSigner: NftSigner;

    protected async make(command): Promise<any> {
        const { args, flags } = await super.make(command);
        if (flags.passphrase) {
            this.nftSigner = new NftSigner(this.network, this.nonce);
        }
        return { args, flags };
    }
}
