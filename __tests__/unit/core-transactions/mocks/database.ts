export const database = {
    connection: {
        nftsRepository: {
            findPropertyByKey: key => {
                switch (key) {
                    case "immutableProp":
                        return 1;
                    default:
                        return true;
                }
            },
        },
    },
};
