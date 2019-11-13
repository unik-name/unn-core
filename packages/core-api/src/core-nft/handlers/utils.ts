import { app } from "@arkecosystem/core-container";

// TODO: uns : Get nft configuration from global plugins config
export const networkNfts = () => {
    if (app.has("pkg.core-nft.opts")) {
        return Object.keys(app.resolve("pkg.core-nft.opts").constraints || {});
    } else {
        return [];
    }
};
