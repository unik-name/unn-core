import { app } from "@arkecosystem/core-container";
import { NFT } from "@arkecosystem/core-interfaces";
import { Bignum } from "@arkecosystem/crypto";
import Boom from "boom";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class NftController extends Controller {
    protected nftManager: NFT.INFTManager = app.resolvePlugin<NFT.INFTManager>("nft");

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const tokens = this.nftManager.tokens;

        return {
            result: tokens,
            totalCount: tokens.length,
        };
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const tokenId = request.params.id;
        const token = this.nftManager.findById(Buffer.from(tokenId));

        if (!token) {
            return Boom.notFound(`Token ${request.params.id} not found`);
        }

        return {
            data: token,
        };
    }
}
