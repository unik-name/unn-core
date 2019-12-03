export const nftsFindPropertyByKeyMock = jest.fn();

export const databaseManager = {
    connection: () => {
        return {
            db: {
                nfts: {
                    findPropertyByKey: nftsFindPropertyByKeyMock,
                },
            },
        };
    },
};
