import * as Hapi from "@hapi/hapi";
import { EXPLICIT_PROP_KEY, getNftsManager } from "../handlers/utils/helpers";
import { isResponse } from "./utils";

export const registerPlugin = (server: Hapi.Server) => {
    if (server) {
        server.ext({
            type: "onPreResponse",
            async method(request: Hapi.Request, h: Hapi.ResponseToolkit) {
                if (isDelegatesdRoute(request)) {
                    const response = request.response;
                    if (isResponse(response)) {
                        const source = response.source as any;
                        source.data = await handleDelegatesdRoute(source.data);
                    }
                }
                return h.continue;
            },
        });
    }
};

const isDelegatesdRoute = (request: Hapi.Request): boolean => {
    const { method, path } = request.route;
    return method === "get" && /^\/api\/delegates$/.test(path);
};

const handleDelegatesdRoute = async delegates => {
    // Get the list of delegates Uniks
    const delegatesUniks = delegates.filter(delegate => isUnikId(delegate.username)).map(delegate => delegate.username);
    if (delegatesUniks.length) {
        // Retrieve explicit values
        const explicitValuesBatch = await getNftsManager().getPropertyBatch(delegatesUniks, EXPLICIT_PROP_KEY);
        return delegates.map(delegate => {
            if (isUnikId(delegate.username)) {
                const explicitValues = explicitValuesBatch.find(elt => elt.nftId === delegate.username).value;
                delegate.unikname = explicitValues.split(",")[0];
            }
            return delegate;
        });
    } else {
        return delegates;
    }
};

const isUnikId = (username: string): boolean => {
    return /^[a-f0-9]+$/.test(username) && username.length === 64;
};
