export function transformNft(model) {
    return {
        id: model.id,
        ownerId: model.ownerId,
        properties: model.properties,
        transactions: model.transactions,
    };
}

export function transformNftProperties(model) {
    return {
        [model.key]: model.value,
    };
}

export function transformNftProperty(model) {
    return model.value;
}
