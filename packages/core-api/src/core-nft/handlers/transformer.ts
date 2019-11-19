export const transformNft = model => {
    return {
        id: model.id,
        ownerId: model.ownerId,
        properties: model.properties,
    };
};

export const transformNftProperties = model => {
    return model;
};

export const transformNftProperty = model => {
    return model.value;
};
