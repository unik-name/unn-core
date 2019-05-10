import { Bignum } from "../utils";
import { DelegateRegistrationBuilder } from "./transactions/delegate-registration";
import { DelegateResignationBuilder } from "./transactions/delegate-resignation";
import { IPFSBuilder } from "./transactions/ipfs";
import { MultiPaymentBuilder } from "./transactions/multi-payment";
import { MultiSignatureBuilder } from "./transactions/multi-signature";
import { NFTTransferBuilder, NFTUpdateBuilder } from "./transactions/nft";
import { SecondSignatureBuilder } from "./transactions/second-signature";
import { TimelockTransferBuilder } from "./transactions/timelock-transfer";
import { TransferBuilder } from "./transactions/transfer";
import { VoteBuilder } from "./transactions/vote";

export class TransactionBuilderFactory {
    /**
     * Create new transfer transaction type.
     */
    public transfer(): TransferBuilder {
        return new TransferBuilder();
    }

    /**
     * Create new second signature transaction type.
     */
    public secondSignature(): SecondSignatureBuilder {
        return new SecondSignatureBuilder();
    }

    /**
     * Create new delegate transaction type.
     */
    public delegateRegistration(): DelegateRegistrationBuilder {
        return new DelegateRegistrationBuilder();
    }

    /**
     * Create new vote transaction type.
     */
    public vote(): VoteBuilder {
        return new VoteBuilder();
    }

    /**
     * Create new multi-signature transaction type.
     */
    public multiSignature(): MultiSignatureBuilder {
        return new MultiSignatureBuilder();
    }

    /**
     * Create new IPFS transaction type.
     */
    public ipfs(): IPFSBuilder {
        return new IPFSBuilder();
    }

    /**
     * Create new timelock transfer transaction type.
     */
    public timelockTransfer(): TimelockTransferBuilder {
        return new TimelockTransferBuilder();
    }

    /**
     * Create new multi-payment transaction type.
     */
    public multiPayment(): MultiPaymentBuilder {
        return new MultiPaymentBuilder();
    }

    /**
     * Create new delegate resignation transaction type.
     */
    public delegateResignation(): DelegateResignationBuilder {
        return new DelegateResignationBuilder();
    }

    /**
     * Create a new nft transaction type.
     */
    public nftTransfer(tokenId: string): NFTTransferBuilder {
        return new NFTTransferBuilder(tokenId);
    }

    /**
     * Create a new nft transaction type.
     */
    public nftUpdate(tokenId: string): NFTUpdateBuilder {
        return new NFTUpdateBuilder(tokenId);
    }
}

export const transactionBuilder = new TransactionBuilderFactory();
