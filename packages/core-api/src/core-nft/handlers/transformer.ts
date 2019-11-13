export const transformNft = model => {
    return {
        id: model.id,
        ownerId: model.ownerId,
        properties: model.properties,
        transactions: model.transactions,
    };
};

export const transformNftProperties = model => {
    return {
        [model.key]: model.value,
    };
};

export const transformNftProperty = model => {
    return model.value;
};
