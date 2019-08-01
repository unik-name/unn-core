export function transformNft(model) {
    return {
        id: model.id,
        ownerId: model.ownerId,
        properties: model.properties,
    };
}

export function transformNftProperties(model) {
    return model;
}
