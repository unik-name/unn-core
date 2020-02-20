export const transformNft = model => {
    return {
        id: model.id,
        ownerId: model.ownerId,
        properties: model.properties, // TO REMOVE??
        transactions: model.transactions, // TO REMOVE??
        type: model.type,
        explicitValues: model.explicitValues,
        defaultExplicitValue: model.defaultExplicitValue,
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
