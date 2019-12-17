import { Identities, Interfaces } from "@arkecosystem/crypto";
import got from "got";
import * as NftSupport from "./nft";

const publicAPIEndpoint: string = "http://localhost:4003/api";

declare global {
    namespace jest {
        // tslint:disable-next-line:interface-name
        interface Matchers<R> {
            toHaveValidNftPersistanceState(): Promise<R>;
        }
    }
}

const nftPropertiesAreUpdated = async (tokenId: string, properties): Promise<any> => {
    let pass: boolean = true;
    let errorInfo: string;

    for (const [key, value] of Object.entries(properties)) {
        try {
            const { body } = await got.get(`${publicAPIEndpoint}/${NftSupport.nftName}s/${tokenId}/properties/${key}`);
            const { data } = JSON.parse(body);

            if (data !== value) {
                // property should be updated
                pass = false;
                errorInfo = `(property ${key} is not updated)`;
                break;
            }
            // property has been updated
        } catch (error) {
            if (error.response.status === 404) {
                // handle 404 errors only

                if (value !== null) {
                    // property should be updated
                    pass = false;
                    errorInfo = `(property ${key} is not found)`;
                    break;
                }

                // property has been deleted
            } else {
                throw error;
            }
        }
    }

    return {
        pass,
        errorInfo,
    };
};

expect.extend({
    toHaveValidNftPersistanceState: async (transaction: Interfaces.ITransactionData) => {
        let pass: boolean = false;
        let errorInfo: string = "";
        const { senderPublicKey, id, asset, recipientId } = transaction;
        const nftAssets = asset.nft[NftSupport.nftName];
        const { tokenId, properties } = nftAssets;
        const owner = recipientId ? recipientId : Identities.Address.fromPublicKey(senderPublicKey);

        try {
            const { body } = await got.get(`${publicAPIEndpoint}/${NftSupport.nftName}s/${tokenId}`);
            const { data } = JSON.parse(body);

            pass = data.id === tokenId && data.ownerId === owner && data.transactions.last.id === id;

            if (pass && properties) {
                const result = await nftPropertiesAreUpdated(tokenId, properties);
                pass = result.pass;
                if (!pass) {
                    errorInfo = result.errorInfo;
                }
            } else {
                errorInfo = `(id:${tokenId}/${data.id},owner:${owner}/${data.ownerId},tx:${id}/${data.transactions.last.id})`;
            }
        } catch (e) {
            errorInfo = `(${e.message})`;
        }

        return {
            pass,
            message: () => `expected nft ${tokenId} ${this.isNot ? "not" : ""} to be persisted ${errorInfo}`,
        };
    },
});
