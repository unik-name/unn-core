import { app } from "@arkecosystem/core-container";
import { Database, NFT } from "@arkecosystem/core-interfaces";
import { Bignum, bignumToUnicode } from "@arkecosystem/crypto";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class ChallengeController extends Controller {
    protected nftManager: NFT.INFTManager = app.resolvePlugin<NFT.INFTManager>("nft");
    protected databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const publicKey = request.query.kpub as string; /* warning handle multiple kpub query params */

        const wallet = await this.databaseService.wallets.findById(publicKey);

        const uniknames: Buffer[] = wallet.tokens;

        return uniknames.map(bignumToUnicode);
    }
}
