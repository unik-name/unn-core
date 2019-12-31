import { Container, Database } from "@arkecosystem/core-interfaces";
import * as Hapi from "@hapi/hapi";
import { nftRepository } from "@uns/core-nft";
import { IRoutesManager } from "./routes";

export const registerPlugin = (container: Container.IContainer, server: Hapi.Server, routesManager: IRoutesManager) => {
    if (server) {
        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                if (routesManager.isValidRoute(request)) {
                    const response = request.response;
                    // Adds the secondPassphrase badge to properties
                    if (isResponse(response)) {
                        const source = response.source as any;
                        const nft = await nftRepository().findById(request.params.id);
                        if (nft) {
                            if (request.params?.key === undefined) {
                                source.data.push({
                                    "Badges/Security/SecondPassphrase": hasSecondPassphrase(nft.ownerId, container),
                                });
                            } else if (request.params?.key === "Badges/Security/SecondPassphrase") {
                                source.data = hasSecondPassphrase(nft.ownerId, container);
                                delete source.error;
                                delete source.message;
                                delete source.statusCode;
                                response.code(200);
                            }
                        }
                    }
                }
                return h.continue;
            },
        });
    }
};

const isResponse = (response: any): response is Hapi.ResponseObject => !response.isBoom;

const hasSecondPassphrase = (id: string, container: Container.IContainer): boolean => {
    const databaseService = container.resolvePlugin<Database.IDatabaseService>("database");
    const wallet = databaseService.wallets.findById(Database.SearchScope.Wallets, id);
    if (wallet) {
        return wallet.hasSecondSignature();
    }
    return false;
};
