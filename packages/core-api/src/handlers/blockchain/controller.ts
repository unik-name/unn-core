import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { nftsRepository } from "../../core-nft/handlers/methods";
import { Controller } from "../shared/controller";

export class BlockchainController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            const lastBlock = this.blockchain.getLastBlock();
            const totalSupply = await nftsRepository.getTotalSupply(lastBlock.data.height);
            return {
                data: {
                    block: {
                        height: lastBlock.data.height,
                        id: lastBlock.data.id,
                    },
                    supply: totalSupply.toFixed(),
                },
            };
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
