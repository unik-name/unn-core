export function transformNft(model) {
    return {
        id: model.id,
        ownerId: model.ownerId,
    };
}
