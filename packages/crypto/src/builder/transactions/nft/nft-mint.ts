import { ActorType } from "@arkecosystem/crypto/src/transactions";
import { TransactionTypes } from "../../../constants";
import { NFTBuilder } from "./nft";

export class NFTMintBuilder extends NFTBuilder {
    constructor(type: TransactionTypes, tokenId: string) {
        super(type, tokenId);
        this.data.payments = [];

        // Can't use multipayment, the user doesn't pay, just fees, fees could be 0 for NftMint transactions. User pays NFT creation directly to the token creators (UNS foundation and other granted orgs)
        // Add here all nft creation actors.
        this.addPaymentOrder(ActorType.UNS_FOUNDATION, this.getFoundationPublicKey());
        this.addPaymentOrder(ActorType.DATA_PROVIDER, this.getChosenDataProviderPublicKey());
        this.addPaymentOrder(ActorType.CREATOR);
    }

    protected instance(): NFTMintBuilder {
        return this;
    }

    private addPaymentOrder(actorType: ActorType, publicKey?: string): void {
        this.data.payments.push({ actorType, publicKey });
    }

    private getFoundationPublicKey(): string {
        return "dnsdlkjqdjsqlkdjsqlkjdkl";
    }

    private getChosenDataProviderPublicKey(): string {
        return "dsdsfdsfdsfdsdsfdsgffdg";
    }
}
