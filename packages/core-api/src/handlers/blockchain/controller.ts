import { supplyCalculator } from "@arkecosystem/core-utils";
import { Utils } from "@arkecosystem/crypto";
import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { nftsRepository } from "../../core-nft/handlers/methods";
import { Controller } from "../shared/controller";

export class BlockchainController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();

            const rewardSupply: Utils.BigNumber = await nftsRepository.getNftTotalRewards(lastBlock.data.height);
            const supply = Utils.BigNumber.make(supplyCalculator.calculate(lastBlock.data.height))
                .plus(rewardSupply)
                .toFixed();
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
