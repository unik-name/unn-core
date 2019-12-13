import Boom from "@hapi/boom";
import Hapi from "@hapi/hapi";
import { Controller } from "../../handlers/shared/controller";

export class NftController extends Controller {
    public async index(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.index(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async show(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.show(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async properties(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.properties(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async property(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.property(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async search(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.search(request);

            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async walletNfts(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            request.query.ownerId = request.params.id;

            // @ts-ignore
            const data = await request.server.methods.v2.nfts.search(request);
            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }

    public async status(request: Hapi.Request, h: Hapi.ResponseToolkit) {
        try {
            // @ts-ignore
            const data = await request.server.methods.v2.nfts.status(request);
            return super.respondWithCache(data, h);
        } catch (error) {
            return Boom.badImplementation(error);
        }
    }
}
