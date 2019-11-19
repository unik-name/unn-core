import { transformBlock } from "../handlers/blocks/transformer";
import { transformBridgechain } from "../handlers/bridgechains/transformer";
import { transformBusiness } from "../handlers/businesses/transformer";
import { transformDelegate } from "../handlers/delegates/transformer";
import { transformLock } from "../handlers/locks/transformer";
import { transformPeer } from "../handlers/peers/transformer";
import { transformRoundDelegate } from "../handlers/rounds/transformer";
import { transformFeeStatistics } from "../handlers/shared/transformers/fee-statistics";
import { transformPorts } from "../handlers/shared/transformers/ports";
import { transformTransaction } from "../handlers/transactions/transformer";
import { transformWallet } from "../handlers/wallets/transformer";

// TODO: uns :
import { transformNft, transformNftProperties, transformNftProperty } from "../core-nft/handlers/transformer";

class Transformer {
    private readonly transformers: Record<string, any> = {
        block: transformBlock,
        bridgechain: transformBridgechain,
        business: transformBusiness,
        delegate: transformDelegate,
        "fee-statistics": transformFeeStatistics,
        peer: transformPeer,
        ports: transformPorts,
        "round-delegate": transformRoundDelegate,
        transaction: transformTransaction,
        wallet: transformWallet,
        lock: transformLock,

        // TODO: uns : can't do better due to `readonly` property
        nft: transformNft,
        nftProperties: transformNftProperties,
        nftProperty: transformNftProperty,
    };

    public toResource(data, transformer, transform: boolean = true): object {
        return this.transformers[transformer](data, transform);
    }

    public toCollection(data, transformer, transform: boolean = true): object[] {
        return data.map(d => this.toResource(d, transformer, transform));
    }
}

export const transformerService = new Transformer();
