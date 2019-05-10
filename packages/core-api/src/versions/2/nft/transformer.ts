export function transformNft(model) {
    return {
        id: model.id,
        owner: model.owner,
        properties: model.properties,
    };
}
