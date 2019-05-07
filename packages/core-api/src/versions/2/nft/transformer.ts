export function transformNft(model) {
    return {
        id: Buffer.from(model.id).toString("utf8"),
        owner: model.owner,
        properties: model.properties,
    };
}
