import { Container, Database } from "@arkecosystem/core-interfaces";
import * as Hapi from "@hapi/hapi";
import { nftRepository } from "@uns/core-nft";
import { DIDTypes } from "@uns/crypto";
import { badges } from "./defaults";
import { IRoutesManager } from "./routes";

export const registerPlugin = (container: Container.IContainer, server: Hapi.Server, routesManager: IRoutesManager) => {
    if (server) {
        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                if (routesManager.isValidRoute(request)) {
                    const response = request.response;
                    if (isResponse(response)) {
                        const source = response.source as any;
                        const nft = await nftRepository().findById(request.params.id);
                        if (nft) {
                            if (request.params?.key === undefined) {
                                source.data = handlePropertiesRequest(source.data, nft, container);
                            } else {
                                if (source.data === undefined) {
                                    source.data = await handlePropertyValueRequest(request.params.key, nft, container);
                                    if (source.data !== undefined) {
                                        delete source.error;
                                        delete source.message;
                                        delete source.statusCode;
                                        response.code(200);
                                    }
                                }
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

export const hasSecondPassphrase = (id: string, container: Container.IContainer): boolean => {
    const databaseService = container.resolvePlugin<Database.IDatabaseService>("database");
    const wallet = databaseService.wallets.findById(Database.SearchScope.Wallets, id);
    if (wallet) {
        return wallet.hasSecondSignature();
    }
    return false;
};

const getDefaultValue = (badgeName: string, nftType: DIDTypes): string => {
    if (badges[badgeName]?.types) {
        return badges[badgeName].types?.[nftType];
    }
    return badges[badgeName]?.default;
};

export const handlePropertiesRequest = (properties: Array<{ [_: string]: string }>, nft, container) => {
    for (const badgeName in badges) {
        if (badgeName) {
            let value: string;
            const category = badges[badgeName].category;
            const propertyKey = "Badges/" + (category ? `${category}/` : "") + badgeName;

            if (!properties.find(elt => Object.getOwnPropertyNames(elt)[0] === propertyKey)) {
                switch (badgeName) {
                    case "SecondPassphrase":
                        value = hasSecondPassphrase(nft.ownerId, container).toString();
                        break;
                    default:
                        const nftType = properties.find(elt => Object.getOwnPropertyNames(elt)[0] === "type").type;
                        value = getDefaultValue(badgeName, parseInt(nftType));

                        break;
                }
            }
            if (value) {
                properties.push({
                    [propertyKey]: value,
                });
            }
        }
    }
    return properties;
};

export const handlePropertyValueRequest = async (propertyKey, nft, container) => {
    const badge = propertyKey.split("/");
    // Check if requested property is a badge
    if (badge[0] === "Badges") {
        const badgeName = badge.pop();
        const category = badges[badgeName]?.category;
        // Check badge category
        // Handle special case category = null for route without category
        if (category === null || badge[1] === category) {
            switch (badgeName) {
                case "SecondPassphrase":
                    return hasSecondPassphrase(nft.ownerId, container);
                default:
                    const nftType = await nftRepository().findPropertyByKey(nft.id, "type");
                    return getDefaultValue(badgeName, parseInt(nftType.value));
            }
        }
    }
    return undefined;
};
