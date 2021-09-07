import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../shared/controller";

export class BlockchainController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

            const lastBlock = this.blockchain.getLastBlock();
            const supply = databaseService.walletManager.getTotalSupply().toFixed();
            return {
                data: {
                    block: {
                        height: lastBlock.data.height,
                        id: lastBlock.data.id,
                    },
                    supply,
                },
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
