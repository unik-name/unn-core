import { NftSigner } from "../nft-signer";
import { SendCommand } from "./send";

export abstract class NftSendCommand extends SendCommand {
    protected nftSigner: NftSigner;

    protected async make(command): Promise<any> {
        const { args, flags } = await super.make(command);
        if (flags.passphrase) {
            this.nftSigner = new NftSigner(this.network, this.nonce);
        }
        return { args, flags };
    }
}
