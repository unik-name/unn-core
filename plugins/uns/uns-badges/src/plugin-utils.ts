import { Container, Database } from "@arkecosystem/core-interfaces";
import * as Hapi from "@hapi/hapi";
import { nftRepository } from "@uns/core-nft";
import { DIDTypes } from "@uns/crypto";
import { IProperyInfo, systemProperties } from "./defaults";
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

const getDefaultValue = (propertyInfos: IProperyInfo, nftType: DIDTypes): string => {
    if (propertyInfos.defaultByType !== undefined) {
        return propertyInfos.defaultByType[nftType];
    }
    return propertyInfos?.default;
};

export const handlePropertiesRequest = (properties: Array<{ [_: string]: string }>, nft, container) => {
    // tslint:disable-next-line: forin
    for (const propertyStr in systemProperties) {
        let value: string;
        if (!properties.find(elt => Object.getOwnPropertyNames(elt)[0] === propertyStr)) {
            switch (propertyStr) {
                case "Badges/Security/SecondPassphrase":
                    value = hasSecondPassphrase(nft.ownerId, container).toString();
                    break;
                default:
                    const nftType = properties.find(elt => Object.getOwnPropertyNames(elt)[0] === "type").type;
                    value = getDefaultValue(systemProperties[propertyStr], parseInt(nftType));
                    break;
            }
        }
        if (value) {
            properties.push({
                [propertyStr]: value,
            });
        }
    }
    return properties;
};

export const handlePropertyValueRequest = async (propertyKey, nft, container) => {
    if (systemProperties.hasOwnProperty(propertyKey)) {
        switch (propertyKey) {
            case "Badges/Security/SecondPassphrase":
                return hasSecondPassphrase(nft.ownerId, container);
            default:
                const nftType = await nftRepository().findPropertyByKey(nft.id, "type");
                return getDefaultValue(systemProperties[propertyKey], parseInt(nftType.value));
        }
    }
    return undefined;
};
