import { app } from "@arkecosystem/core-container";
import { Database } from "@arkecosystem/core-interfaces";
import Hapi from "hapi";
import { Controller } from "../shared/controller";

export class ChallengeController extends Controller {
    protected databaseService = app.resolvePlugin<Database.IDatabaseService>("database");

    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        const publicKey = request.query.kpub as string;

        const wallet = await this.databaseService.wallets.findById(publicKey);

        const uniknames: string[] = wallet.tokens;

        return uniknames;
    }
}
