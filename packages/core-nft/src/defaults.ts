export const defaults = {
    constraints: {
        unik: {
            name: "UNIK",
            properties: {
                type: {
                    genesis: true,
                    constraints: [
                        "immutable",
                        {
                            name: "enumeration",
                            parameters: {
                                values: ["1", "2", "3"],
                            },
                        },
                    ],
                },
            },
        },
    },
};
