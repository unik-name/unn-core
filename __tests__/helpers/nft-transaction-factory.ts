import { Identities, Types, Utils } from "@arkecosystem/crypto";
import { Builders } from "@uns/core-nft-crypto";
import {
    CertifiedNftMintTransaction,
    CertifiedNftUpdateTransaction,
    INftDemand,
    INftDemandCertification,
    NftCertificationSigner,
    NftDemandHashBuffer,
    NftDemandSigner,
    UNSCertifiedNftMintBuilder,
    UNSCertifiedNftUpdateBuilder,
} from "@uns/crypto";
import { TransactionFactory } from "./transaction-factory";

export const buildCertifiedDemand = (properties, sender, issuer, cost: Utils.BigNumber = Utils.BigNumber.ZERO) => {
    const asset: INftDemand = {
        nft: {
            unik: {
                tokenId: sender.tokenId,
                properties,
            },
        },
        demand: {
            payload: {
                iss: sender.tokenId,
                sub: sender.tokenId,
                iat: 1579165954,
                cryptoAccountAddress: Identities.Address.fromPassphrase(issuer.passphrase),
            },
            signature: "",
        },
    };

    asset.demand.signature = new NftDemandSigner(asset).sign(sender.passphrase);

    const hash = new NftDemandHashBuffer(asset).getPayloadHashBuffer();

    const demandCertificationPayload = {
        sub: hash,
        iss: issuer.tokenId,
        iat: 12345678,
        cost,
    };

    const certification: INftDemandCertification = {
        payload: demandCertificationPayload,
        signature: new NftCertificationSigner(demandCertificationPayload).sign(issuer.passphrase),
    };

    return { ...asset, certification };
};

export class NFTTransactionFactory extends TransactionFactory {
    public static nftName = "unik";
    public static network: Types.NetworkName = "dalinet";

    public static nftMint(nftName: string, tokenId: string, properties) {
        return new TransactionFactory(new Builders.NftMintBuilder(nftName, tokenId).properties(properties)).withNetwork(
            NFTTransactionFactory.network,
        );
    }

    public static nftUpdate(nftName: string, tokenId: string, properties) {
        return new TransactionFactory(
            new Builders.NftUpdateBuilder(nftName, tokenId).properties(properties),
        ).withNetwork(NFTTransactionFactory.network);
    }

    public static nftTransfer(nftName: string, tokenId: string, recipient: string) {
        return new TransactionFactory(
            new Builders.NftTransferBuilder(nftName, tokenId).recipientId(recipient),
        ).withNetwork(NFTTransactionFactory.network);
    }

    public static nftCertifiedMint(
        tokenId: string,
        senderPassphrase: string,
        issuerUNID,
        issuerPassphrase,
        properties,
        cost = Utils.BigNumber.make(100000000),
        fee: number = +CertifiedNftMintTransaction.staticFee(),
    ) {
        const asset = buildCertifiedDemand(
            properties,
            { tokenId, passphrase: senderPassphrase },
            { tokenId: issuerUNID, passphrase: issuerPassphrase },
            cost,
        );
        return new TransactionFactory(
            new UNSCertifiedNftMintBuilder(NFTTransactionFactory.nftName, tokenId)
                .properties(properties)
                .demand(asset.demand)
                .certification(asset.certification, asset.demand.payload.cryptoAccountAddress),
        )
            .withNetwork(NFTTransactionFactory.network)
            .withFee(fee)
            .withPassphrase(senderPassphrase);
    }

    public static nftCertifiedUpdate(
        tokenId: string,
        senderPassphrase: string,
        issuerUNID,
        issuerPassphrase,
        properties,
        cost = Utils.BigNumber.make(100000000),
        fee: number = +CertifiedNftUpdateTransaction.staticFee(),
    ) {
        const asset = buildCertifiedDemand(
            properties,
            { tokenId, passphrase: senderPassphrase },
            { tokenId: issuerUNID, passphrase: issuerPassphrase },
            cost,
        );
        return new TransactionFactory(
            new UNSCertifiedNftUpdateBuilder(NFTTransactionFactory.nftName, tokenId)
                .properties(properties)
                .demand(asset.demand)
                .certification(asset.certification, asset.demand.payload.cryptoAccountAddress),
        )
            .withNetwork(NFTTransactionFactory.network)
            .withFee(fee)
            .withPassphrase(senderPassphrase);
    }
}
